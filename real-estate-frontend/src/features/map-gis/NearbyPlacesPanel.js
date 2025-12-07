"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!mapRef?.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const allPlaces = [...Object.values(fixedPlaces).flat(), ...customPlaces];
    allPlaces.forEach((place) => {
      if (!place.lat || !place.lng) return;
      const marker = L.marker([place.lat, place.lng]);
      marker.bindPopup(`<b>${place.name || "Địa điểm"}</b>`);
      marker.on("click", () => handlePlaceClick(place));
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [fixedPlaces, customPlaces, mapRef]);

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

  const calculateDistance = (lat, lng) => {
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
      : `${distance.toFixed(2)} km`;
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
    <div className="fixed top-20 left-4 z-40 w-full max-w-md transition-all duration-500 animate-slideInLeft">
      <div className="relative overflow-hidden bg-white shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="relative px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg">
                <FaMapMarkerAlt className="text-sm text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Tham khảo vị trí
                </h3>
                <p className="text-[10px] font-semibold text-green-100">
                  Địa điểm gần đây
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 text-white transition-all duration-300 rounded-full hover:bg-white/20 hover:rotate-90 active:scale-95"
              title="Đóng"
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
