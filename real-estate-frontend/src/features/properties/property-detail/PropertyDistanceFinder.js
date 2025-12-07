"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaLocationArrow,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaCar,
  FaWalking,
  FaRoute,
  FaClock,
  FaExchangeAlt,
  FaSearch,
  FaTimes,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaCompass,
  FaCrosshairs,
} from "react-icons/fa";
import { getRouteFromOSRM, formatDistance, formatDuration } from "../../../utils/osmRoutingService";
import { calculateDistance } from "../../../utils/coordinateConverter";
import { searchPlaces, getPlaceByCoordinates } from "../../../utils/nominatimService";

/**
 * Chuyển đổi mã bước di chuyển sang tiếng Việt dễ hiểu giống Google Maps
 */
const formatManeuver = (step, idx, totalSteps) => {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier;
  const name = step?.name ? `đường ${step.name}` : "đoạn đường phía trước";
  const dist = step?.distance ? `${Math.round(step.distance)} m` : "";

  if (idx === 0 || type === "depart") {
    return {
      icon: "🏁",
      title: `Bắt đầu xuất phát trên ${name}`,
      dist,
      color: "text-blue-600",
    };
  }
  if (idx === totalSteps - 1 || type === "arrive") {
    return {
      icon: "🎯",
      title: `Đến đích: Bất động sản (${name})`,
      dist: "",
      color: "text-red-600 font-bold",
    };
  }
  if (type === "roundabout" || type === "rotary") {
    const exit = step.maneuver?.exit ? `lối ra thứ ${step.maneuver.exit}` : "lối ra";
    return {
      icon: "🔄",
      title: `Vào bùng binh, đi theo ${exit} vào ${name}`,
      dist,
      color: "text-indigo-600",
    };
  }

  let action = "Tiếp tục đi thẳng";
  let icon = "⬆️";
  if (modifier?.includes("right")) {
    action = modifier.includes("slight")
      ? "Rẽ chếch sang phải"
      : modifier.includes("sharp")
      ? "Rẽ ngoặt sang phải"
      : "Rẽ phải";
    icon = "➡️";
  } else if (modifier?.includes("left")) {
    action = modifier.includes("slight")
      ? "Rẽ chếch sang trái"
      : modifier.includes("sharp")
      ? "Rẽ ngoặt sang trái"
      : "Rẽ trái";
    icon = "⬅️";
  } else if (modifier === "straight") {
    action = "Đi thẳng";
    icon = "⬆️";
  } else if (modifier === "uturn") {
    action = "Quay đầu xe";
    icon = "↩️";
  }

  return {
    icon,
    title: `${action} vào ${name}`,
    dist,
    color: "text-gray-800",
  };
};

const PropertyDistanceFinder = ({
  destination,
  fullAddress = "",
  onRouteChange,
  onMapPickRequest,
  pickedLocationFromMap,
  onResetMap,
}) => {
  // Điểm xuất phát
  const [origin, setOrigin] = useState(null);
  const [originInput, setOriginInput] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);

  // Gợi ý địa chỉ Autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Profile phương tiện (bike: xe máy, car: ô tô, foot: đi bộ)
  const [profile, setProfile] = useState("cycling"); // Xe máy làm mặc định phổ biến nhất ở VN

  // Kết quả tính toán
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [straightDistanceMeters, setStraightDistanceMeters] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTurnByTurn, setShowTurnByTurn] = useState(false);

  // Khi nhận được điểm chọn từ click trên bản đồ
  useEffect(() => {
    if (!pickedLocationFromMap) return;

    const handlePickedPoint = async () => {
      const { lat, lng } = pickedLocationFromMap;
      const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setOriginInput(`Điểm chọn trên bản đồ (${coordStr})`);

      try {
        const place = await getPlaceByCoordinates(lat, lng);
        const address = place?.displayName || place?.name || `Tọa độ: ${coordStr}`;
        setOrigin({ lat, lng, address });
        setOriginInput(address);
      } catch (e) {
        setOrigin({ lat, lng, address: `Tọa độ: ${coordStr}` });
      }

      setIsPickingOnMap(false);
      if (typeof onMapPickRequest === "function") {
        onMapPickRequest(false);
      }
    };

    handlePickedPoint();
  }, [pickedLocationFromMap, onMapPickRequest]);

  // Tìm kiếm gợi ý khi người dùng gõ vào ô input (Debounced)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setOriginInput(val);
    setErrorMsg("");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const results = await searchPlaces(val, 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.warn("Autocomplete error:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 450);
  };

  // Chọn 1 gợi ý từ dropdown
  const handleSelectSuggestion = (place) => {
    const newOrigin = {
      lat: place.lat,
      lng: place.lng,
      address: place.displayName,
    };
    setOrigin(newOrigin);
    setOriginInput(place.displayName);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Định vị GPS của trình duyệt (Một chạm)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocating(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setOriginInput("Đang lấy tên địa chỉ...");

        try {
          const place = await getPlaceByCoordinates(lat, lng);
          const address = place?.displayName || place?.name || `Vị trí hiện tại (${coordStr})`;
          setOrigin({ lat, lng, address });
          setOriginInput(address);
        } catch (e) {
          setOrigin({ lat, lng, address: `Vị trí hiện tại (${coordStr})` });
          setOriginInput(`Vị trí hiện tại (${coordStr})`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Không thể lấy vị trí hiện tại.";
        if (err.code === 1) {
          msg = "Vui lòng cho phép quyền truy cập vị trí (GPS) trên trình duyệt để dò khoảng cách.";
        } else if (err.code === 2) {
          msg = "Không xác định được tín hiệu GPS. Hãy thử gõ địa chỉ vào ô tìm kiếm.";
        }
        setErrorMsg(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Bật/tắt chế độ chọn điểm trực tiếp trên bản đồ
  const toggleMapPicking = () => {
    const nextState = !isPickingOnMap;
    setIsPickingOnMap(nextState);
    if (typeof onMapPickRequest === "function") {
      onMapPickRequest(nextState);
    }
  };

  // Tính toán khoảng cách & chỉ đường từ Origin -> Destination
  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;
    if (isNaN(origin.lat) || isNaN(origin.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
      setErrorMsg("Tọa độ không hợp lệ.");
      return;
    }

    setIsCalculating(true);
    setErrorMsg("");

    // 1. Tính khoảng cách đường chim bay
    const straightDist = calculateDistance(origin, destination);
    setStraightDistanceMeters(straightDist);

    try {
      // 2. Gọi API định tuyến OSRM
      const res = await getRouteFromOSRM(
        origin.lng,
        origin.lat,
        destination.lng,
        destination.lat,
        profile
      );

      setRouteResult(res);

      // Gửi dữ liệu lộ trình lên bản đồ để vẽ Polyline
      if (typeof onRouteChange === "function") {
        onRouteChange({
          coordinates: res.coordinates,
          origin,
          destination,
          originText: origin.address || originInput,
        });
      }
    } catch (err) {
      console.warn("OSRM routing fallback:", err);
      // Fallback: nếu OSRM lỗi mạng, vẽ đường thẳng và ước tính theo tốc độ
      const speedKmh = profile === "cycling" ? 30 : profile === "driving" ? 40 : 5;
      const distKm = straightDist / 1000;
      const durationSeconds = (distKm / speedKmh) * 3600;

      const fallbackRoute = {
        distance: straightDist,
        duration: durationSeconds,
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
        steps: [],
        isFallback: true,
      };

      setRouteResult(fallbackRoute);

      if (typeof onRouteChange === "function") {
        onRouteChange({
          coordinates: fallbackRoute.coordinates,
          origin,
          destination,
          originText: origin.address || originInput,
        });
      }
    } finally {
      setIsCalculating(false);
    }
  }, [origin, destination, profile, originInput, onRouteChange]);

  // Tự động tính toán khi origin hoặc profile thay đổi
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    }
  }, [origin, destination, profile, calculateRoute]);

  // Xóa lộ trình và reset
  const handleClearRoute = () => {
    setOrigin(null);
    setOriginInput("");
    setRouteResult(null);
    setStraightDistanceMeters(null);
    setShowTurnByTurn(false);
    setErrorMsg("");
    setIsPickingOnMap(false);

    if (typeof onMapPickRequest === "function") {
      onMapPickRequest(false);
    }
    if (typeof onRouteChange === "function") {
      onRouteChange(null);
    }
    if (typeof onResetMap === "function") {
      onResetMap();
    }
  };

  // Tạo URL mở Google Maps tìm đường
  const getGoogleMapsDirectionsUrl = () => {
    if (!origin || !destination) return "#";
    const travelModes = {
      cycling: "two-wheeler", // Xe máy trên Google Maps
      driving: "driving",
      walking: "walking",
    };
    const mode = travelModes[profile] || "driving";
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=${mode}`;
  };

  return (
    <div className="mt-5 border border-blue-100 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Tiêu đề thanh công cụ */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-blue-100/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <FaRoute className="text-base" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Dò khoảng cách & Chỉ đường
              <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Miễn phí
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Đo quãng đường từ vị trí của bạn đến thửa đất VN2000 này
            </p>
          </div>
        </div>

        {routeResult && (
          <button
            type="button"
            onClick={handleClearRoute}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-all shadow-sm"
          >
            <FaTimes className="text-[11px]" />
            <span>Xóa đường đi</span>
          </button>
        )}
      </div>

      {/* Thông tin Điểm đến (Bất động sản) */}
      <div className="mb-4 bg-white/90 border border-gray-200/90 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
        <div className="mt-0.5 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
          <FaMapMarkerAlt className="text-xs" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Điểm đến (Thửa đất BĐS)
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Tọa độ cố định
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-800 font-medium truncate mt-0.5">
            {fullAddress || "Vị trí bất động sản"}
          </p>
          {destination && (
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
              GPS: {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
            </p>
          )}
        </div>
      </div>

      {/* Thanh nhập điểm xuất phát (Origin) */}
      <div className="space-y-3">
        <div className="relative">
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Điểm xuất phát (Vị trí của bạn):
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 text-blue-500">
              <FaSearch className="text-xs" />
            </div>
            <input
              type="text"
              value={originInput}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Nhập địa chỉ của bạn (VD: Quận 1, Chợ Bến Thành, Sân bay...)"
              className="w-full pl-9 pr-24 py-2.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs outline-none transition-all placeholder:text-gray-400"
            />

            {/* Nút xóa nhanh input */}
            {originInput && (
              <button
                type="button"
                onClick={() => {
                  setOriginInput("");
                  setOrigin(null);
                  setSuggestions([]);
                }}
                className="absolute right-20 text-gray-400 hover:text-gray-600 p-1"
                title="Xóa nội dung"
              >
                <FaTimes className="text-xs" />
              </button>
            )}

            {/* Indicator spinner khi tìm gợi ý */}
            {isSearchingSuggestions && (
              <div className="absolute right-14 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Dropdown danh sách gợi ý địa chỉ */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
              {suggestions.map((item, idx) => (
                <div
                  key={item.osmId || idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-start gap-2.5 transition-colors text-left"
                >
                  <FaMapMarkerAlt className="text-blue-500 text-xs mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                      {item.name || item.displayName.split(",")[0]}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {item.displayName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Các nút bấm chọn nhanh: Vị trí của tôi & Chọn trên bản đồ */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút 1: Định vị GPS hiện tại */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isLocating
                ? "bg-blue-100 text-blue-600 cursor-wait"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-500/25"
            }`}
            title="Lấy vị trí GPS thực tế từ thiết bị của bạn"
          >
            {isLocating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Đang định vị...</span>
              </>
            ) : (
              <>
                <FaLocationArrow className="text-[11px]" />
                <span>Vị trí của tôi</span>
              </>
            )}
          </button>

          {/* Nút 2: Bấm chọn trên bản đồ */}
          <button
            type="button"
            onClick={toggleMapPicking}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              isPickingOnMap
                ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 animate-pulse"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:scale-95"
            }`}
            title="Nhấp vào bất kỳ điểm nào trên bản đồ để làm điểm xuất phát"
          >
            <FaCrosshairs className="text-[11px]" />
            <span>{isPickingOnMap ? "Đang chọn trên bản đồ..." : "Chọn trên bản đồ"}</span>
          </button>

          {/* Chế độ phương tiện (Xe máy, Ô tô, Đi bộ) */}
          <div className="ml-auto flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setProfile("cycling")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                profile === "cycling"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Xe máy / Xe hai bánh"
            >
              <FaMotorcycle className="text-sm" />
              <span className="hidden sm:inline">Xe máy</span>
            </button>

            <button
              type="button"
              onClick={() => setProfile("driving")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                profile === "driving"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Ô tô"
            >
              <FaCar className="text-xs" />
              <span className="hidden sm:inline">Ô tô</span>
            </button>

            <button
              type="button"
              onClick={() => setProfile("walking")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                profile === "walking"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Đi bộ"
            >
              <FaWalking className="text-xs" />
              <span className="hidden sm:inline">Đi bộ</span>
            </button>
          </div>
        </div>

        {/* Thông báo hướng dẫn khi đang bật chế độ chấm điểm trên bản đồ */}
        {isPickingOnMap && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 animate-fadeIn">
            <span className="text-base animate-bounce">👉</span>
            <span>
              Hãy <b>click trực tiếp lên bản đồ</b> ở trên để đặt điểm xuất phát của bạn!
            </span>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-fadeIn">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Loading state khi đang tính lộ trình */}
      {isCalculating && (
        <div className="mt-4 p-4 bg-white/90 border border-blue-200 rounded-xl flex items-center justify-center gap-3 text-xs text-blue-700 font-semibold animate-pulse">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Đang tính toán tuyến đường và khoảng cách tốt nhất...</span>
        </div>
      )}

      {/* KHỐI KẾT QUẢ DÒ KHOẢNG CÁCH & CHỈ ĐƯỜNG */}
      {routeResult && !isCalculating && (
        <div className="mt-4 bg-white border border-blue-200 rounded-xl p-4 shadow-sm animate-scaleIn">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-gray-100">
            {/* Khoảng cách đường bộ */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-600 block">
                Khoảng cách đường bộ
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-900 mt-0.5 block">
                {formatDistance(routeResult.distance)}
              </span>
            </div>

            {/* Thời gian ước tính */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-600 block">
                Thời gian ước tính
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-900 mt-0.5 block">
                ~ {formatDuration(routeResult.duration)}
              </span>
            </div>

            {/* Khoảng cách chim bay */}
            {straightDistanceMeters !== null && (
              <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-gray-50 to-slate-100 p-2.5 rounded-xl border border-gray-200">
                <span className="text-[11px] font-semibold text-gray-500 block">
                  Đường chim bay
                </span>
                <span className="text-lg sm:text-xl font-bold text-gray-700 mt-0.5 block">
                  {(straightDistanceMeters / 1000).toFixed(1)} km
                </span>
              </div>
            )}
          </div>

          {/* Các nút hành động chính */}
          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            {/* Nút 1: Mở Google Maps tìm đường (yêu cầu chính của người dùng) */}
            <a
              href={getGoogleMapsDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 text-center"
            >
              <FaExternalLinkAlt className="text-xs" />
              <span>Chỉ đường trên Google Maps</span>
            </a>

            {/* Nút 2: Xem chi tiết từng bước (Turn-by-turn) */}
            {routeResult.steps && routeResult.steps.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTurnByTurn(!showTurnByTurn)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                <span>{showTurnByTurn ? "Thu gọn bước đi" : "Xem các bước rẽ"}</span>
                {showTurnByTurn ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
            )}
          </div>

          {/* Danh sách các bước rẽ chi tiết (Turn-by-turn) */}
          {showTurnByTurn && routeResult.steps && routeResult.steps.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-gray-100 max-h-60 overflow-y-auto pr-1 space-y-2">
              <div className="text-xs font-bold text-gray-700 flex items-center justify-between mb-1">
                <span>Hướng dẫn lộ trình chi tiết ({routeResult.steps.length} bước):</span>
              </div>
              {routeResult.steps.map((step, idx) => {
                const info = formatManeuver(step, idx, routeResult.steps.length);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-gray-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <span className="text-sm mt-0.5 flex-shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${info.color}`}>{info.title}</p>
                      {info.dist && (
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          Đi tiếp {info.dist}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyDistanceFinder;
