"use client";

import { useState, useEffect, useRef } from "react";
import { Polygon } from "@react-google-maps/api";
import {
  FaSearch,
  FaTimes,
  FaMapMarkedAlt,
  FaLayerGroup,
  FaEye,
  FaEyeSlash,
  FaTrash,
  FaSpinner,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaAdjust,
} from "react-icons/fa";
import { convertCoordinates } from "../../utils/gisUtils.js";

const AdminBoundary = ({ mapRef, onBoundarySelect, isVisible = true }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoundaries, setSelectedBoundaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [provinceOpacity, setProvinceOpacity] = useState(0.5);
  const [districtOpacity, setDistrictOpacity] = useState(0.5);
  const [wardOpacity, setWardOpacity] = useState(0.5);
  const [sortedData, setSortedData] = useState(null);
  const [showOpacityPanel, setShowOpacityPanel] = useState(false);
  const [showBoundariesList, setShowBoundariesList] = useState(true);

  const searchTimeoutRef = useRef(null);

  // Load sorted.json
  useEffect(() => {
    const loadSortedData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/data/sorted.json");
        if (!response.ok) throw new Error("Không tìm thấy sorted.json");
        const data = await response.json();
        setSortedData(data);
        setError(null);
      } catch (err) {
        console.error("[v0] Error loading sorted.json offline:", err);
        setError("Lỗi khi tải dữ liệu ranh giới hành chính");
      } finally {
        setLoading(false);
      }
    };
    loadSortedData();
  }, []);

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim() || !sortedData) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = sortedData
      .filter(
        (item) =>
          item[1].toLowerCase().includes(lowerQuery) ||
          item[3].toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);

    setSearchResults(
      results.map((item) => ({
        id: item[0],
        name: item[1],
        type: item[2],
        level: item[0].length === 3 ? "level2" : "level3",
        level3s: item[4],
      }))
    );
  };

  // Normalize name for file
  const normalizeNameForFile = (name) => {
    let tempName = name.replace(/Đ/g, "D").replace(/đ/g, "d");
    let cleanedName = tempName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, "");
    let noDiacritics = cleanedName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return noDiacritics.toLowerCase();
  };

  // Select boundary handler
  const handleSelectBoundary = async (boundary) => {
    setLoading(true);
    try {
      const level1_id = boundary.id.slice(0, 2);
      const response = await fetch(`/data/gis/${level1_id}.json`);

      if (!response.ok) {
        throw new Error(
          `Không tìm thấy file GIS cấp Tỉnh (${level1_id}.json).`
        );
      }

      const gisData = await response.json();

      let coords = [];
      let bbox = null;
      let level = boundary.level;
      let displayName = boundary.name;

      // Handle different boundary levels
      if (boundary.level === "level1") {
        const rawCoords = gisData.coordinates || [];
        coords = convertCoordinates(rawCoords);
        bbox = gisData.bbox;
        displayName = gisData.name;
      } else if (boundary.level === "level2") {
        const searchId = boundary.id;
        const level2 = gisData.level2s?.find(
          (l2) =>
            l2.level2_id === searchId ||
            l2.id === searchId ||
            l2.internal_id === searchId
        );

        if (level2) {
          const rawCoords = level2.coordinates || [];
          coords = convertCoordinates(rawCoords);
          bbox = level2.bbox;
          displayName = level2.name;
        } else {
          throw new Error(
            `Không tìm thấy ranh giới Huyện/Quận cho ID: ${searchId}`
          );
        }
      } else if (boundary.level === "level3") {
        const level2_id_parent_numeric = boundary.id.slice(0, 3);
        let targetFeature = null;

        try {
          const rawProvinceName = gisData.name.replace(
            /^(Tỉnh|Thành phố)\s*/,
            ""
          );
          const level3Key = normalizeNameForFile(rawProvinceName);
          const level3Filename = `${level3Key}.json`;

          const level3Response = await fetch(
            `/data/gis/level3s/${level3Filename}`
          );

          if (level3Response.ok) {
            const level3GeoJSON = await level3Response.json();
            targetFeature = level3GeoJSON.features.find(
              (feature) => feature.properties.NAME_3 === boundary.name
            );
          }
        } catch (err) {
          console.error(`[v0] Error loading Level 3 GeoJSON:`, err.message);
        }

        if (targetFeature && targetFeature.geometry) {
          const rawCoords = targetFeature.geometry.coordinates;
          coords = convertCoordinates(rawCoords);
          bbox = targetFeature.properties.bbox || gisData.bbox;
          displayName = targetFeature.properties.NAME_3;
          level = "level3";
        } else {
          const level2 = gisData.level2s?.find(
            (l2) =>
              l2.level2_id === level2_id_parent_numeric ||
              l2.id === level2_id_parent_numeric
          );

          if (level2) {
            const rawCoords = level2.coordinates || [];
            coords = convertCoordinates(rawCoords);
            bbox = level2.bbox;
            displayName = boundary.name;
            level = "level3_fallback";
          } else {
            throw new Error("Không tìm thấy ranh giới cấp Huyện cho Xã này.");
          }
        }
      }

      if (coords.length === 0) {
        throw new Error("Không có tọa độ để vẽ.");
      }

      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

      setSelectedBoundaries((prev) => [
        ...prev,
        {
          name: displayName,
          coordinates: coords,
          bbox,
          color,
          level,
          id: Date.now(),
        },
      ]);

      // Fit bounds
      if (mapRef.current && bbox) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: bbox[1], lng: bbox[0] });
        bounds.extend({ lat: bbox[3], lng: bbox[2] });
        mapRef.current.fitBounds(bounds);
      }

      if (onBoundarySelect) onBoundarySelect(boundary);

      // Clear search after selection
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("[v0] Error in handleSelectBoundary:", err.message);
      setError("Lỗi load coordinates: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove boundary
  const handleRemoveBoundary = (id) => {
    setSelectedBoundaries((prev) => prev.filter((b) => b.id !== id));
  };

  // Clear all
  const handleClearAll = () => {
    setSelectedBoundaries([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getLevelIcon = (level) => {
    if (level === "level1") return "🏙️";
    if (level === "level2") return "🏘️";
    return "🏡";
  };

  const getLevelLabel = (level) => {
    if (level === "level1") return "Tỉnh/TP";
    if (level === "level2") return "Quận/Huyện";
    return "Phường/Xã";
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Main Panel */}
      <div className="fixed top-20 right-4 z-40 w-full max-w-md transition-all duration-500 animate-slideInRight">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg">
                  <FaMapMarkedAlt className="text-sm text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Ranh giới hành chính
                  </h3>
                  <p className="text-[10px] font-semibold text-teal-100">
                    {selectedBoundaries.length} lớp đang hiển thị
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto">
            {/* Search Box */}
            <div className="relative animate-fadeInUp">
              <input
                type="text"
                placeholder="Tìm tỉnh, huyện, xã..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full py-2.5 pl-10 pr-10 text-sm font-medium text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 focus:outline-none hover:border-teal-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors duration-300"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-1 animate-fadeInUp">
                <p className="text-xs font-bold text-gray-600 px-2">
                  Kết quả tìm kiếm:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectBoundary(result)}
                      className="w-full flex items-center gap-2 p-2.5 text-left transition-all duration-300 bg-gray-50 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-400 hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-lg">
                        {getLevelIcon(result.level)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {result.name}
                        </p>
                        <p className="text-xs text-gray-500">{result.type}</p>
                      </div>
                      <span className="text-xs font-bold text-teal-600 px-2 py-1 bg-teal-100 rounded-full">
                        {getLevelLabel(result.level)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-xs font-medium text-red-700 border-l-4 border-red-500 rounded-md bg-red-50 animate-slideInLeft">
                <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-2 p-3 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg animate-fadeIn">
                <FaSpinner className="animate-spin" />
                <span>Đang tải dữ liệu...</span>
              </div>
            )}

            {/* Active Boundaries List */}
            {selectedBoundaries.length > 0 && (
              <div
                className="space-y-2 animate-fadeInUp"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setShowBoundariesList(!showBoundariesList)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-teal-600 transition-colors duration-300"
                  >
                    <FaLayerGroup />
                    <span>Lớp ranh giới ({selectedBoundaries.length})</span>
                    {showBoundariesList ? (
                      <FaChevronUp className="text-xs" />
                    ) : (
                      <FaChevronDown className="text-xs" />
                    )}
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-300"
                  >
                    <FaTrash className="inline mr-1" />
                    Xóa tất cả
                  </button>
                </div>

                {showBoundariesList && (
                  <div className="space-y-1.5">
                    {selectedBoundaries.map((boundary) => (
                      <div
                        key={boundary.id}
                        className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-gray-50 to-teal-50 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 animate-fadeInUp"
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: boundary.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {boundary.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getLevelLabel(boundary.level)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveBoundary(boundary.id)}
                          className="flex items-center justify-center w-7 h-7 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 hover:scale-110 active:scale-95 transition-all duration-300"
                          title="Xóa lớp"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Opacity Controls */}
            <div
              className="space-y-2 animate-fadeInUp"
              style={{ animationDelay: "200ms" }}
            >
              <button
                onClick={() => setShowOpacityPanel(!showOpacityPanel)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <FaAdjust />
                  <span>Độ trong suốt</span>
                </div>
                {showOpacityPanel ? (
                  <FaChevronUp className="text-xs" />
                ) : (
                  <FaChevronDown className="text-xs" />
                )}
              </button>

              {showOpacityPanel && (
                <div className="space-y-3 p-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  {/* Province Opacity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        🏙️ Tỉnh/TP
                      </label>
                      <span className="text-xs font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                        {Math.round(provinceOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={provinceOpacity}
                      onChange={(e) =>
                        setProvinceOpacity(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* District Opacity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        🏘️ Quận/Huyện
                      </label>
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {Math.round(districtOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={districtOpacity}
                      onChange={(e) =>
                        setDistrictOpacity(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Ward Opacity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        🏡 Phường/Xã
                      </label>
                      <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                        {Math.round(wardOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={wardOpacity}
                      onChange={(e) =>
                        setWardOpacity(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            {selectedBoundaries.length === 0 &&
              !loading &&
              !searchResults.length && (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
                  <div className="flex items-center justify-center w-16 h-16 mb-3 bg-gray-100 rounded-full">
                    <FaMapMarkedAlt className="text-2xl text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">
                    Chưa có ranh giới nào
                  </p>
                  <p className="text-xs text-gray-500">
                    Tìm kiếm để thêm ranh giới hành chính
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Render Polygons */}
      {selectedBoundaries.map((boundary) => {
        const paths = boundary.coordinates;
        const opacity =
          boundary.level === "level1"
            ? provinceOpacity
            : boundary.level === "level2"
            ? districtOpacity
            : wardOpacity;

        return paths.map((path, pIdx) => (
          <Polygon
            key={`${boundary.id}-${pIdx}`}
            paths={path}
            options={{
              fillColor: boundary.color,
              fillOpacity: opacity * 0.25,
              strokeColor: boundary.color,
              strokeOpacity: opacity * 0.8,
              strokeWeight: 2,
            }}
          />
        ));
      })}
    </>
  );
};

export default AdminBoundary;
