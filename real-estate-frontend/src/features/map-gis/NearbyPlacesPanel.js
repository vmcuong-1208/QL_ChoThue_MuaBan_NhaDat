"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaSearch,
  FaRoad,
  FaSchool,
  FaShoppingCart,
  FaHospital,
  FaBus,
  FaUtensils,
  FaCoffee,
  FaGasPump,
  FaChurch,
  FaParking,
  FaLocationArrow,
  FaStar,
  FaSpinner,
} from "react-icons/fa";
import {
  searchNearbyPlacesNominatim,
  getSupportedPOITypes,
} from "../../utils/overpassService";
import L from "leaflet";

const getPlaceEmoji = (type) => {
  const t = String(type || "").toLowerCase();
  if (t.includes("school") || t.includes("trường")) return "🎓";
  if (t.includes("hospital") || t.includes("bệnh viện") || t.includes("pharmacy")) return "🏥";
  if (t.includes("market") || t.includes("chợ") || t.includes("siêu thị") || t.includes("mall")) return "🛒";
  if (t.includes("gas") || t.includes("xăng")) return "⛽";
  if (t.includes("restaurant") || t.includes("quán ăn") || t.includes("nhà hàng")) return "🍽️";
  if (t.includes("cafe") || t.includes("cà phê")) return "☕";
  if (t.includes("bus") || t.includes("xe buýt") || t.includes("trạm")) return "🚌";
  if (t.includes("park") || t.includes("công viên")) return "🌳";
  if (t.includes("bank") || t.includes("atm") || t.includes("ngân hàng")) return "🏦";
  return "📍";
};

const NearbyPlacesPanel = ({ propertyCenter, mapRef, onClose }) => {
  const [fixedPlaces, setFixedPlaces] = useState({
    highway: [],
    school: [],
    market: [],
  });
  const [customPlaces, setCustomPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [searchType, setSearchType] = useState("school");
  const [selectedPlace, setSelectedPlace] = useState(null);

  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const radiusLabelMarkerRef = useRef(null);

  const calculateDistance = (lat, lng) => {
    if (!propertyCenter?.lat || !propertyCenter?.lng) return "0 m";
    const R = 6371;
    const dLat = ((lat - propertyCenter.lat) * Math.PI) / 180;
    const dLng = ((lng - propertyCenter.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((propertyCenter.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance < 1
      ? `${(distance * 1000).toFixed(0)} m`
      : `${distance.toFixed(1)} km`;
  };

  // 1. Quản lý Vòng tròn bán kính (Radius Search Circle) & Pulsing Center Pin
  useEffect(() => {
    if (!mapRef?.current || !propertyCenter?.lat || !propertyCenter?.lng) return;
    const map = mapRef.current;

    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove();
      centerMarkerRef.current = null;
    }
    if (radiusLabelMarkerRef.current) {
      radiusLabelMarkerRef.current.remove();
      radiusLabelMarkerRef.current = null;
    }

    const center = [Number(propertyCenter.lat), Number(propertyCenter.lng)];

    // A. Vẽ vòng tròn bán kính mờ với viền nét đứt sang trọng
    const circle = L.circle(center, {
      radius: Number(radius),
      color: "#2563eb",
      weight: 2.5,
      opacity: 0.9,
      dashArray: "8, 6",
      fillColor: "#3b82f6",
      fillOpacity: 0.1,
    }).addTo(map);
    circleRef.current = circle;

    // B. Ghim tâm BĐS với hiệu ứng gợn sóng (Pulsing Halo Ring)
    const centerIcon = L.divIcon({
      className: "custom-radius-center-pin",
      html: `
        <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -50%);">
          <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 3px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 900;">
            🎯
          </div>
        </div>
      `,
      iconSize: [0, 0],
    });
    const centerMarker = L.marker(center, { icon: centerIcon, zIndexOffset: 2000 }).addTo(map);
    centerMarker.bindPopup(`
      <div style="font-family: 'Roboto', Arial, sans-serif; font-size: 12px; padding: 3px;">
        <strong style="color: #1e3a8a;">📍 Tâm tìm kiếm tiện ích (Bán kính vàng)</strong>
        <div style="color: #64748b; margin-top: 2px;">Tọa độ: ${center[0].toFixed(5)}, ${center[1].toFixed(5)}</div>
      </div>
    `);
    centerMarkerRef.current = centerMarker;

    // C. Nhãn hiển thị bán kính nổi ở mép trên đỉnh vòng tròn
    const radiusKm = radius / 1000;
    const labelLat = center[0] + radius / 111320;
    const labelText = radius >= 1000 ? `${radiusKm % 1 === 0 ? radiusKm : radiusKm.toFixed(1)} km` : `${radius} m`;

    const labelIcon = L.divIcon({
      className: "custom-radius-label-badge",
      html: `
        <div style="
          transform: translate(-50%, -100%);
          background: rgba(15, 23, 42, 0.94);
          color: #ffffff;
          padding: 4px 11px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 800;
          font-family: 'Roboto', Arial, sans-serif;
          border: 1.5px solid #38bdf8;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          white-space: nowrap;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 5px;
        ">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8;"></span>
          <span>Bán kính: ${labelText}</span>
        </div>
      `,
      iconSize: [0, 0],
    });
    const radiusLabelMarker = L.marker([labelLat, center[1]], { icon: labelIcon, zIndexOffset: 1500 }).addTo(map);
    radiusLabelMarkerRef.current = radiusLabelMarker;

    // D. Căn chỉnh khung nhìn vừa khít vòng tròn
    try {
      map.fitBounds(circle.getBounds(), { padding: [45, 45], maxZoom: 16 });
    } catch (err) {
      console.warn("fitBounds radius error:", err);
    }

    return () => {
      if (circleRef.current) circleRef.current.remove();
      if (centerMarkerRef.current) centerMarkerRef.current.remove();
      if (radiusLabelMarkerRef.current) radiusLabelMarkerRef.current.remove();
    };
  }, [propertyCenter, radius, mapRef]);

  // 2. Render các Marker Tiện ích (POI Markers) bên trong Vòng tròn
  useEffect(() => {
    if (!mapRef?.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const allPlaces = [...Object.values(fixedPlaces).flat(), ...customPlaces];
    const seen = new Set();
    const uniquePlaces = [];
    allPlaces.forEach((p) => {
      const key = `${p.lat?.toFixed(5)}_${p.lng?.toFixed(5)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePlaces.push(p);
      }
    });

    uniquePlaces.forEach((place) => {
      if (!place.lat || !place.lng) return;
      const distText = calculateDistance(place.lat, place.lng);
      const iconEmoji = getPlaceEmoji(place.type);

      const poiIcon = L.divIcon({
        className: "custom-poi-marker-icon",
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 9999px;
            background: #ffffff;
            color: #1e293b;
            font-size: 11px;
            font-weight: 800;
            font-family: 'Roboto', Arial, sans-serif;
            border: 1.5px solid #10b981;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            white-space: nowrap;
            cursor: pointer;
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='translate(-50%, -100%) scale(1.15)'; this.style.zIndex='9999';" onmouseout="this.style.transform='translate(-50%, -100%) scale(1)';">
            <span>${iconEmoji}</span>
            <span style="color: #047857; font-weight: 800;">${distText}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([place.lat, place.lng], { icon: poiIcon });
      marker.bindPopup(`
        <div style="font-family: 'Roboto', Arial, sans-serif; font-size: 12px; max-width: 220px; line-height: 1.4;">
          <div style="display: flex; align-items: center; gap: 4px; color: #047857; font-weight: 800; font-size: 11px; margin-bottom: 3px;">
            <span>${iconEmoji}</span>
            <span>${place.type || "Tiện ích lân cận"}</span>
          </div>
          <strong style="color: #0f172a; font-size: 13px;">${place.name || "Địa điểm"}</strong>
          <div style="color: #2563eb; font-weight: 800; margin-top: 4px; font-size: 12px;">
            📍 Cách tâm BĐS: ${distText}
          </div>
          ${place.address ? `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">${place.address}</div>` : ""}
        </div>
      `);
      marker.on("click", () => handlePlaceClick(place));
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [fixedPlaces, customPlaces, mapRef, propertyCenter]);

  const radiusOptions = [
    { value: 500, label: "500m" },
    { value: 1000, label: "1km" },
    { value: 2000, label: "2km" },
    { value: 5000, label: "5km" },
    { value: 10000, label: "10km" },
  ];

  const placeTypes = getSupportedPOITypes();

  // Icon mapping
  const getPlaceIcon = (type) => {
    const iconMap = {
      school: FaSchool,
      market: FaShoppingCart,
      hospital: FaHospital,
      gas_station: FaGasPump,
      restaurant: FaUtensils,
      cafe: FaCoffee,
      bus_station: FaBus,
      church: FaChurch,
      parking: FaParking,
    };
    return iconMap[type] || FaMapMarkerAlt;
  };

  useEffect(() => {
    loadFixedPlaces();
  }, [propertyCenter]);

  const loadFixedPlaces = async () => {
    setLoading(true);
    try {
      const [highways, schools, markets] = await Promise.all([
        searchNearbyPlacesNominatim(
          propertyCenter.lat,
          propertyCenter.lng,
          "gas_station",
          5000
        ),
        searchNearbyPlacesNominatim(
          propertyCenter.lat,
          propertyCenter.lng,
          "school",
          5000
        ),
        searchNearbyPlacesNominatim(
          propertyCenter.lat,
          propertyCenter.lng,
          "market",
          5000
        ),
      ]);

      setFixedPlaces({
        highway: highways.slice(0, 1),
        school: schools.slice(0, 1),
        market: markets.slice(0, 1),
      });
    } catch (err) {
      console.error("Lỗi load fixed places:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyPlaces = async () => {
    setLoading(true);
    setError(null);
    setCustomPlaces([]);

    try {
      const results = await searchNearbyPlacesNominatim(
        propertyCenter.lat,
        propertyCenter.lng,
        searchType,
        radius
      );
      setCustomPlaces(results);
      if (results.length === 0) {
        setError("Không tìm thấy địa điểm nào trong bán kính này");
      }
    } catch (err) {
      setError(`Lỗi tìm kiếm: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sortedCustomPlaces = [...customPlaces].sort((a, b) => {
    const distA = parseFloat(calculateDistance(a.lat, a.lng));
    const distB = parseFloat(calculateDistance(b.lat, b.lng));
    return distA - distB;
  });

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    if (mapRef?.current) {
      mapRef.current.panTo({ lat: place.lat, lng: place.lng });
      mapRef.current.setZoom(17);
    }
  };

  const renderPlaceCard = (place, isQuick = false) => {
    const Icon = getPlaceIcon(place.type);

    return (
      <div
        key={place.id}
        onClick={() => handlePlaceClick(place)}
        className={`group relative overflow-hidden transition-all duration-300 cursor-pointer
          ${
            isQuick
              ? "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-3 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400"
              : "bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-blue-300"
          }
          animate-fadeInUp`}
      >
        {/* Icon Badge */}
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-300
            ${
              isQuick
                ? "w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-110"
                : "w-10 h-10 bg-blue-100 group-hover:bg-blue-500"
            }`}
          >
            <Icon
              className={`${
                isQuick
                  ? "text-white text-lg"
                  : "text-blue-600 group-hover:text-white text-sm"
              } transition-colors duration-300`}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Place Name */}
            <h4 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
              {place.name}
            </h4>

            {/* Place Type */}
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {placeTypes.find((t) => t.value === place.type)?.label ||
                place.type}
            </p>

            {/* Distance Badge */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-full">
                <FaLocationArrow className="text-green-600 text-[8px]" />
                <span className="text-xs font-bold text-green-700">
                  {calculateDistance(place.lat, place.lng)}
                </span>
              </div>

              {/* Rating (mock) */}
              <div className="flex items-center gap-0.5">
                <FaStar className="text-yellow-400 text-[10px]" />
                <span className="text-xs font-semibold text-gray-600">4.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>
      </div>
    );
  };

  return (
    <div
      className="fixed top-20 right-4 z-40 w-full max-w-md transition-all duration-500 animate-slideInRight"
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      <div className="relative overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200">
        {/* Header */}
        <div className="relative px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg">
                <span className="text-sm">🎯</span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>Bán Kính Tiện Ích</span>
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[10.5px] font-extrabold rounded-full">
                    {radius >= 1000 ? `${(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)} km` : `${radius} m`}
                  </span>
                </h3>
                <p className="text-[10px] font-semibold text-emerald-100">
                  Dò tìm trường học, chợ, bệnh viện trong bán kính vàng
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 text-white transition-all duration-300 rounded-full hover:bg-white/20 hover:rotate-90 active:scale-95"
              title="Đóng bảng tiện ích"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3 bg-white max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Quick Access Section */}
          <div
            className="space-y-2 animate-fadeInUp"
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Địa điểm quan trọng
              </span>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Gas Station */}
              {fixedPlaces.highway.length > 0 ? (
                <div
                  className="animate-fadeInUp"
                  style={{ animationDelay: "100ms" }}
                >
                  {renderPlaceCard(
                    { ...fixedPlaces.highway[0], type: "gas_station" },
                    true
                  )}
                </div>
              ) : (
                <div
                  className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-lg animate-fadeInUp"
                  style={{ animationDelay: "100ms" }}
                >
                  <FaGasPump className="inline-block mb-1 text-gray-300" />
                  <p>Không tìm thấy trạm xăng</p>
                </div>
              )}

              {/* School */}
              {fixedPlaces.school.length > 0 ? (
                <div
                  className="animate-fadeInUp"
                  style={{ animationDelay: "200ms" }}
                >
                  {renderPlaceCard(
                    { ...fixedPlaces.school[0], type: "school" },
                    true
                  )}
                </div>
              ) : (
                <div
                  className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-lg animate-fadeInUp"
                  style={{ animationDelay: "200ms" }}
                >
                  <FaSchool className="inline-block mb-1 text-gray-300" />
                  <p>Không tìm thấy trường học</p>
                </div>
              )}

              {/* Market */}
              {fixedPlaces.market.length > 0 ? (
                <div
                  className="animate-fadeInUp"
                  style={{ animationDelay: "300ms" }}
                >
                  {renderPlaceCard(
                    { ...fixedPlaces.market[0], type: "market" },
                    true
                  )}
                </div>
              ) : (
                <div
                  className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-lg animate-fadeInUp"
                  style={{ animationDelay: "300ms" }}
                >
                  <FaShoppingCart className="inline-block mb-1 text-gray-300" />
                  <p>Không tìm thấy chợ</p>
                </div>
              )}
            </div>
          </div>

          {/* Search Section */}
          <div
            className="pt-3 space-y-2 border-t-2 border-gray-200 animate-fadeInUp"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FaSearch className="text-gray-400 text-xs" />
              <span className="text-xs font-bold text-gray-700">
                Tìm kiếm nâng cao
              </span>
            </div>

            {/* Place Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">
                Loại địa điểm
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-green-400 bg-white"
              >
                {placeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Radius Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">
                Bán kính tìm kiếm
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {radiusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRadius(option.value)}
                    className={`px-2 py-1.5 text-xs font-bold transition-all duration-300 rounded-md ${
                      radius === option.value
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                    } active:scale-95`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={searchNearbyPlaces}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Đang tìm kiếm...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>Tìm kiếm ngay</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-2 text-xs font-medium text-red-700 border-l-4 border-red-500 rounded-md bg-red-50 animate-slideInLeft">
              <span className="flex-shrink-0 text-base">⚠️</span>
              <span className="text-[10px]">{error}</span>
            </div>
          )}

          {/* Search Results */}
          {sortedCustomPlaces.length > 0 && (
            <div
              className="pt-3 space-y-2 border-t-2 border-gray-200 animate-fadeInUp"
              style={{ animationDelay: "500ms" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">
                  Kết quả tìm kiếm
                </span>
                <span className="px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded-full">
                  {sortedCustomPlaces.length} địa điểm
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedCustomPlaces.map((place, index) => (
                  <div
                    key={place.id}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    {renderPlaceCard(place)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !error && customPlaces.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 animate-fadeIn">
              <div className="w-10 h-10 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
              <span className="text-xs font-bold text-gray-700">
                Đang tải dữ liệu...
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default NearbyPlacesPanel;
