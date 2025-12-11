"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaRoad,
  FaMapMarkerAlt,
  FaLocationArrow,
  FaCar,
  FaMotorcycle,
  FaWalking,
  FaExchangeAlt,
  FaClock,
  FaRoute,
  FaHome,
  FaSearch,
} from "react-icons/fa";
import {
  getRouteFromOSRM,
  formatDistance,
  formatDuration,
} from "../../utils/osmRoutingService";

const DirectionsPanel = ({
  propertyCenter,
  mapRef,
  onClose,
  onRouteChange,
}) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapClickMode, setMapClickMode] = useState(null);
  const [profile, setProfile] = useState("driving");
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");

  // Autocomplete states
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);

  const mapClickListenerRef = useRef(null);
  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (mapClickListenerRef.current && mapRef?.current) {
        if (typeof mapRef.current.off === "function") {
          mapRef.current.off("click", mapClickListenerRef.current);
        } else if (window.google?.maps?.event?.removeListener) {
          window.google.maps.event.removeListener(mapClickListenerRef.current);
        }
        mapClickListenerRef.current = null;
      }
    };
  }, [mapRef]);

  // Debounced search for suggestions
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      if (originText && originText.length > 2 && !origin) {
        fetchSuggestions(originText, "origin");
      } else {
        setOriginSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayTimer);
  }, [originText]);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      if (destinationText && destinationText.length > 2 && !destination) {
        fetchSuggestions(destinationText, "destination");
      } else {
        setDestinationSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayTimer);
  }, [destinationText]);

  const fetchSuggestions = async (query, mode) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5&countrycodes=vn`;
      const response = await fetch(url, {
        headers: { "User-Agent": "RealEstateApp/1.0" },
      });
      const data = await response.json();

      if (mode === "origin") {
        setOriginSuggestions(data);
        setShowOriginSuggestions(true);
      } else {
        setDestinationSuggestions(data);
        setShowDestinationSuggestions(true);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const selectSuggestion = (suggestion, mode) => {
    const loc = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };

    if (mode === "origin") {
      setOrigin(loc);
      setOriginText(suggestion.display_name);
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    } else {
      setDestination(loc);
      setDestinationText(suggestion.display_name);
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };

  const geocodeAddress = async (address, mode) => {
    if (!address) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1&countrycodes=vn`;
      const response = await fetch(url, {
        headers: { "User-Agent": "RealEstateApp/1.0" },
      });
      const data = await response.json();
      if (data.length > 0) {
        const loc = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        if (mode === "origin") {
          setOrigin(loc);
          setOriginText(address);
        } else {
          setDestination(loc);
          setDestinationText(address);
        }
      } else {
        setError("Không tìm thấy địa chỉ");
      }
    } catch (err) {
      setError("Lỗi tìm địa chỉ: " + err.message);
    }
  };

  // ✅ AUTO RECALCULATE khi đổi profile
  useEffect(() => {
    if (origin && destination) {
      console.log("🔄 Profile changed to:", profile); // Debug log
      calculateDirections();
    } else {
      setRoute(null);
      if (onRouteChange) {
        onRouteChange(null);
      }
    }
  }, [origin, destination, profile]);

  const getUserLocation = (mode) => {
    setLoading(true);
    setError(null);
    setRoute(null);
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ Geolocation");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const coordText = `${location.lat.toFixed(6)}, ${location.lng.toFixed(
          6
        )}`;
        if (mode === "origin") {
          setOrigin(location);
          setOriginText(coordText);
        } else if (mode === "destination") {
          setDestination(location);
          setDestinationText(coordText);
        }
        setLoading(false);
      },
      (err) => {
        if (err.code === 1) {
          setError(
            "Trình duyệt đang chặn quyền Vị trí (Location). Hãy bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ để cho phép, hoặc chọn điểm trực tiếp trên bản đồ."
          );
        } else if (err.code === 2) {
          setError("Không thể xác định vị trí GPS hiện tại.");
        } else if (err.code === 3) {
          setError("Hết thời gian chờ lấy vị trí GPS. Vui lòng thử lại.");
        } else {
          setError(`Lỗi lấy vị trí: ${err.message}`);
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleMapSelection = (mode) => {
    if (mapClickListenerRef.current && mapRef?.current) {
      if (typeof mapRef.current.off === "function") {
        mapRef.current.off("click", mapClickListenerRef.current);
      } else if (window.google?.maps?.event?.removeListener) {
        window.google.maps.event.removeListener(mapClickListenerRef.current);
      }
      mapClickListenerRef.current = null;
    }

    setMapClickMode(mode);

    if (mapRef?.current) {
      const clickHandler = (e) => {
        const lat = e.latlng ? e.latlng.lat : (typeof e.latLng?.lat === "function" ? e.latLng.lat() : e.latLng?.lat);
        const lng = e.latlng ? e.latlng.lng : (typeof e.latLng?.lng === "function" ? e.latLng.lng() : e.latLng?.lng);
        const clickedLocation = { lat, lng };
        const coordText = `${clickedLocation.lat.toFixed(6)}, ${clickedLocation.lng.toFixed(6)}`;
        if (mode === "origin") {
          setOrigin(clickedLocation);
          setOriginText(coordText);
        } else if (mode === "destination") {
          setDestination(clickedLocation);
          setDestinationText(coordText);
        }

        if (mapClickListenerRef.current && mapRef.current) {
          if (typeof mapRef.current.off === "function") {
            mapRef.current.off("click", mapClickListenerRef.current);
          } else if (window.google?.maps?.event?.removeListener) {
            window.google.maps.event.removeListener(mapClickListenerRef.current);
          }
          mapClickListenerRef.current = null;
        }
        setMapClickMode(null);
      };

      mapClickListenerRef.current = clickHandler;
      if (typeof mapRef.current.on === "function") {
        mapRef.current.on("click", clickHandler);
      } else if (typeof mapRef.current.addListener === "function") {
        mapRef.current.addListener("click", clickHandler);
      }
    }
  };

  const handleCurrentLocation = (mode) => {
    getUserLocation(mode);
  };

  const handlePropertyLocation = (mode) => {
    const coordText = `${propertyCenter.lat.toFixed(
      6
    )}, ${propertyCenter.lng.toFixed(6)}`;
    if (mode === "origin") {
      setOrigin(propertyCenter);
      setOriginText(coordText);
    } else if (mode === "destination") {
      setDestination(propertyCenter);
      setDestinationText(coordText);
    }
  };

  const calculateDirections = async () => {
    if (!origin || !destination) {
      setError("Vui lòng chọn điểm đi và điểm đến");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!origin.lng || !destination.lng) {
        setError("Tọa độ không hợp lệ.");
        setLoading(false);
        return;
      }

      console.log("🚀 Calculating route with profile:", profile); // Debug log

      const routeData = await getRouteFromOSRM(
        origin.lng,
        origin.lat,
        destination.lng,
        destination.lat,
        profile // ← Pass profile correctly
      );

      console.log("✅ Route calculated:", {
        profile: profile,
        distance: formatDistance(routeData.distance),
        duration: formatDuration(routeData.duration),
      }); // Debug log

      setRoute(routeData);

      if (routeData?.coordinates && mapRef?.current) {
        const latLngs = routeData.coordinates.map((coord) => [coord[1], coord[0]]);
        if (typeof mapRef.current.fitBounds === "function") {
          try {
            mapRef.current.fitBounds(latLngs, { padding: [50, 50] });
          } catch (e) {
            console.warn("fitBounds error:", e);
          }
        }

        if (onRouteChange) {
          onRouteChange({
            coordinates: routeData.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0],
            })),
          });
        }
      }
    } catch (err) {
      console.error("❌ Route calculation failed:", err); // Debug log
      setError(`Không thể tính toán đường đi: ${err.message}`);
      setRoute(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOriginChange = (e) => {
    const value = e.target.value;
    setOriginText(value);
    if (value === "") {
      setOrigin(null);
      setOriginSuggestions([]);
    }
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestinationText(value);
    if (value === "") {
      setDestination(null);
      setDestinationSuggestions([]);
    }
  };

  const swapLocations = () => {
    const tempOrigin = origin;
    const tempOriginText = originText;
    setOrigin(destination);
    setOriginText(destinationText);
    setDestination(tempOrigin);
    setDestinationText(tempOriginText);
  };

  return (
    <aside
      aria-label="Bảng chỉ đường bản đồ"
      className="fixed z-40 w-full max-w-md transition-all duration-500 top-20 right-4 animate-slideInRight"
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      <div className="relative overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200/80">
        {/* Gradient Header */}
        <header className="relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg" aria-hidden="true">
                <FaRoad className="text-sm text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">Tìm đường</h2>
                <p className="text-[11px] font-medium text-blue-100">
                  Định tuyến thông minh theo phương tiện
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng chỉ đường"
              className="flex items-center justify-center text-white transition-all duration-300 rounded-full w-7 h-7 hover:bg-white/20 hover:rotate-90 active:scale-95"
              title="Đóng"
            >
              <FaTimes className="text-sm" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-3 space-y-2.5 bg-white max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Origin Box */}
          <div
            className="relative space-y-1.5 transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "0ms" }}
          >
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <FaMapMarkerAlt className="text-green-500 text-[10px]" />
              <span>Điểm đi</span>
            </label>

            <div className="relative">
              <input
                ref={originInputRef}
                type="text"
                className="w-full px-3 py-2 pr-8 text-xs font-medium text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-blue-400"
                value={
                  originText ||
                  (origin
                    ? `${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}`
                    : "")
                }
                placeholder="Nhập địa chỉ điểm đi..."
                onChange={handleOriginChange}
                onFocus={() =>
                  originSuggestions.length > 0 && setShowOriginSuggestions(true)
                }
              />
              <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 text-[10px]" />

              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 overflow-hidden overflow-y-auto bg-white border-2 border-blue-300 rounded-lg shadow-2xl animate-fadeIn max-h-48">
                  {originSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => selectSuggestion(suggestion, "origin")}
                      className="flex items-start gap-2 p-2 text-xs transition-all duration-200 border-b border-gray-100 cursor-pointer hover:bg-blue-50 last:border-0"
                    >
                      <FaMapMarkerAlt className="flex-shrink-0 mt-0.5 text-blue-500 text-[10px]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 line-clamp-2">
                          {suggestion.display_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCurrentLocation("origin")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 transition-all duration-300 bg-blue-50 rounded-lg hover:bg-blue-100 active:scale-95 disabled:opacity-50"
              >
                <FaLocationArrow className="text-[10px]" />
                <span>Vị trí</span>
              </button>

              <button
                type="button"
                onClick={() => handleMapSelection("origin")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-purple-600 transition-all duration-300 bg-purple-50 rounded-lg hover:bg-purple-100 active:scale-95 disabled:opacity-50"
              >
                <FaMapMarkerAlt className="text-[10px]" />
                <span>Chọn</span>
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div
            className="flex justify-center animate-scaleIn"
            style={{ animationDelay: "100ms" }}
          >
            <button
              onClick={swapLocations}
              disabled={!origin && !destination}
              className="flex items-center justify-center text-gray-600 transition-all duration-300 bg-gray-100 rounded-full w-7 h-7 hover:bg-blue-100 hover:text-blue-600 hover:rotate-180 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Đổi điểm"
            >
              <FaExchangeAlt className="text-xs" />
            </button>
          </div>

          {/* Destination Box */}
          <div
            className="relative space-y-1.5 transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "200ms" }}
          >
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <FaMapMarkerAlt className="text-red-500 text-[10px]" />
              <span>Điểm đến</span>
            </label>

            <div className="relative">
              <input
                ref={destinationInputRef}
                type="text"
                className="w-full px-3 py-2 pr-8 text-xs font-medium text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-blue-400"
                value={
                  destinationText ||
                  (destination
                    ? `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(
                        6
                      )}`
                    : "")
                }
                placeholder="Nhập địa chỉ điểm đến..."
                onChange={handleDestinationChange}
                onFocus={() =>
                  destinationSuggestions.length > 0 &&
                  setShowDestinationSuggestions(true)
                }
              />
              <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 text-[10px]" />

              {showDestinationSuggestions &&
                destinationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 overflow-hidden overflow-y-auto bg-white border-2 border-blue-300 rounded-lg shadow-2xl animate-fadeIn max-h-48">
                    {destinationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() =>
                          selectSuggestion(suggestion, "destination")
                        }
                        className="flex items-start gap-2 p-2 text-xs transition-all duration-200 border-b border-gray-100 cursor-pointer hover:bg-blue-50 last:border-0"
                      >
                        <FaMapMarkerAlt className="flex-shrink-0 mt-0.5 text-blue-500 text-[10px]" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 line-clamp-2">
                            {suggestion.display_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCurrentLocation("destination")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 transition-all duration-300 bg-blue-50 rounded-lg hover:bg-blue-100 active:scale-95 disabled:opacity-50"
              >
                <FaLocationArrow className="text-[10px]" />
                <span>Vị trí</span>
              </button>

              <button
                type="button"
                onClick={() => handleMapSelection("destination")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-purple-600 transition-all duration-300 bg-purple-50 rounded-lg hover:bg-purple-100 active:scale-95 disabled:opacity-50"
              >
                <FaMapMarkerAlt className="text-[10px]" />
                <span>Chọn</span>
              </button>
            </div>
          </div>

          {/* Transport Mode */}
          {origin && destination && (
            <div
              className="pt-2 space-y-1.5 border-t border-gray-200 animate-fadeInUp"
              style={{ animationDelay: "300ms" }}
            >
              <label className="block text-xs font-bold text-gray-700">
                Phương tiện
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setProfile("driving")}
                  disabled={loading}
                  className={`flex flex-col items-center gap-1 px-2 py-2 text-xs font-bold transition-all duration-300 rounded-lg ${
                    profile === "driving"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  } active:scale-95 disabled:opacity-50`}
                >
                  <FaCar className="text-lg" />
                  <span className="text-[10px]">Ô tô</span>
                </button>

                <button
                  onClick={() => setProfile("cycling")}
                  disabled={loading}
                  className={`flex flex-col items-center gap-1 px-2 py-2 text-xs font-bold transition-all duration-300 rounded-lg ${
                    profile === "cycling"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  } active:scale-95 disabled:opacity-50`}
                >
                  <FaMotorcycle className="text-lg" />
                  <span className="text-[10px]">Xe máy</span>
                </button>

                <button
                  onClick={() => setProfile("walking")}
                  disabled={loading}
                  className={`flex flex-col items-center gap-1 px-2 py-2 text-xs font-bold transition-all duration-300 rounded-lg ${
                    profile === "walking"
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  } active:scale-95 disabled:opacity-50`}
                >
                  <FaWalking className="text-lg" />
                  <span className="text-[10px]">Đi bộ</span>
                </button>
              </div>
            </div>
          )}

          {/* Map Click Hint */}
          {mapClickMode && (
            <div className="flex items-center gap-2 p-2 text-xs font-bold text-blue-700 border-2 border-blue-300 rounded-lg bg-blue-50 animate-pulse">
              <FaMapMarkerAlt className="flex-shrink-0 text-sm" />
              <span className="text-[10px]">
                Click bản đồ chọn{" "}
                {mapClickMode === "origin" ? "điểm đi" : "điểm đến"}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-2 text-xs font-medium text-red-700 border-l-4 border-red-500 rounded-md bg-red-50 animate-slideInLeft">
              <span className="flex-shrink-0 text-base">⚠️</span>
              <span className="text-[10px]">{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-3 animate-fadeIn">
              <div className="w-5 h-5 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <span className="text-xs font-bold text-gray-700">
                Đang tính...
              </span>
            </div>
          )}

          {/* Route Info with Profile Badge */}
          {route && !loading && (
            <div className="space-y-2 transition-all duration-500 animate-scaleIn">
              {/* ✅ Profile Badge - NEW */}
              <div className="flex items-center justify-center gap-1.5 p-1.5 bg-gray-100 rounded-lg">
                <span className="text-[10px] font-bold text-gray-600">
                  {profile === "driving" && "🚗 Ô tô"}
                  {profile === "cycling" && "🏍️ Xe máy"}
                  {profile === "walking" && "🚶 Đi bộ"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 transition-all duration-300 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md hover:scale-105">
                  <div className="flex items-center gap-1 mb-1">
                    <FaRoute className="text-blue-600 text-[10px]" />
                    <span className="text-[9px] font-bold text-gray-600">
                      Khoảng cách
                    </span>
                  </div>
                  <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    {formatDistance(route.distance)}
                  </p>
                </div>

                <div className="p-2 transition-all duration-300 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md hover:scale-105">
                  <div className="flex items-center gap-1 mb-1">
                    <FaClock className="text-purple-600 text-[10px]" />
                    <span className="text-[9px] font-bold text-gray-600">
                      Thời gian
                    </span>
                  </div>
                  <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    {formatDuration(route.duration)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 p-2 text-xs font-bold text-green-700 bg-green-100 border-2 border-green-300 rounded-lg">
                <span className="text-sm">✓</span>
                <span className="text-[10px]">Đã tính xong!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DirectionsPanel;
