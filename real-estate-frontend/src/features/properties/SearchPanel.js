"use client";

import { useState, useEffect } from "react";
import {
  FaTimes,
  FaSearch,
  FaSpinner,
  FaMapMarkerAlt,
  FaCity,
  FaBuilding,
  FaHome,
} from "react-icons/fa";
import { normalizeVietnamese } from "../../utils/textNormalizer";

// Debounce helper (Từ Upstream - giúp tối ưu tìm kiếm)
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const SearchPanel = ({
  onClose,
  onSelect, // Callback khi chọn boundaries (từ Stashed)
  onSearchCommit, // Callback khi commit tìm kiếm địa điểm thường (từ Upstream)
  onToggleClickMode, // (từ Upstream)
  isClickModeActive, // (từ Upstream)
  onRemoveChip, // (từ Stashed - để xóa chip bên ngoài nếu cần)
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedChips, setSelectedChips] = useState([]);
  const [sortedData, setSortedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dữ liệu GIS sorted.json
  useEffect(() => {
    const loadSortedData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/data/sorted.json");
        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu tìm kiếm");
        }
        const data = await response.json();
        setSortedData(data);
        setError(null);
      } catch (err) {
        console.error("[SearchPanel] Error loading sorted.json:", err);
        // Không set error UI để tránh làm phiền nếu chỉ là lỗi ngầm
        setSortedData(null);
      } finally {
        setLoading(false);
      }
    };
    loadSortedData();
  }, []);

  // Hàm parse query tìm ranh giới (Logic cốt lõi)
  const parseQueryForBoundaries = (q) => {
    if (!sortedData || !q.trim()) return [];

    const normalizedQuery = normalizeVietnamese(q);
    const results = [];
    const seen = new Set();

    sortedData.forEach((level1Item) => {
      const [level1Id, level1Name, level1Type, level1Romanized, level2s] =
        level1Item;

      // Level 1 (Tỉnh/Thành phố)
      const normalizedLevel1Name = normalizeVietnamese(level1Name);
      if (normalizedLevel1Name.includes(normalizedQuery)) {
        const key = `level1-${level1Id}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: level1Id,
            name: level1Name,
            type: level1Type,
            level: "level1",
            level1_id: level1Id,
            level2_id: null,
          });
        }
      }

      // Level 2 và Level 3
      if (Array.isArray(level2s)) {
        level2s.forEach((level2Item) => {
          const [
            level2InternalId,
            level2Name,
            level2Type,
            level2Romanized,
            level3s,
          ] = level2Item;

          // Level 2 (Huyện/Quận)
          const normalizedLevel2Name = normalizeVietnamese(level2Name);
          if (normalizedLevel2Name.includes(normalizedQuery)) {
            const key = `level2-${level2InternalId}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                id: level2InternalId,
                name: level2Name,
                type: level2Type,
                level: "level2",
                level1_id: level1Id,
                level2_id: level2InternalId,
              });
            }
          }

          // Level 3 (Xã/Phường)
          if (Array.isArray(level3s)) {
            level3s.forEach((level3) => {
              const [level3Id, level3Name, level3Type] = level3;
              const normalizedLevel3Name = normalizeVietnamese(level3Name);

              if (normalizedLevel3Name.includes(normalizedQuery)) {
                const key = `level3-${level1Id}-${level2InternalId}-${level3Name}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  results.push({
                    id: key,
                    name: level3Name,
                    type: level3Type,
                    level: "level3",
                    level1_id: level1Id,
                    level2_id: level2InternalId,
                    level3Name: level3Name,
                  });
                }
              }
            });
          }
        });
      }
    });

    return results.slice(0, 10);
  };

  // Debounced search function
  const debouncedSearch = debounce((value) => {
    if (!value.trim() || !sortedData) {
      setSuggestions([]);
      return;
    }
    const boundaries = parseQueryForBoundaries(value);
    setSuggestions(boundaries);
  }, 300); // 300ms delay

  const handleInputChange = (value) => {
    setQuery(value);
    setError(null);
    debouncedSearch(value);
  };

  const handleSuggestionClick = (suggestion) => {
    // Thêm vào chips nếu chưa có
    if (!selectedChips.find((c) => c.id === suggestion.id)) {
      const newChips = [...selectedChips, suggestion];
      setSelectedChips(newChips);

      // Gọi ngay callback select để map hiển thị luôn (UX tốt hơn)
      if (onSelect) {
        onSelect(suggestion);
      }
    }
    setQuery("");
    setSuggestions([]);
  };

  const handleRemoveLocalChip = (chipId) => {
    const updatedChips = selectedChips.filter((c) => c.id !== chipId);
    setSelectedChips(updatedChips);
    // Gọi callback remove của parent nếu có
    if (onRemoveChip) {
      onRemoveChip(chipId);
    }
  };

  // Xử lý khi bấm Enter hoặc nút Tìm kiếm
  const handleCommit = () => {
    // Ưu tiên 1: Nếu có chips đã chọn -> Xử lý chips (đã xử lý realtime ở trên, ở đây chỉ clear)
    if (selectedChips.length > 0) {
      // Có thể thực hiện thêm hành động gì đó với tập hợp chips
      setSelectedChips([]);
      return;
    }

    // Ưu tiên 2: Nếu có query text nhưng không chọn chip -> Tìm kiếm địa điểm thường (Nominatim)
    if (query.trim()) {
      if (onSearchCommit) {
        onSearchCommit(query);
      }
      setSuggestions([]);
      return;
    }

    setError("Chọn ít nhất 1 ranh giới hoặc nhập địa chỉ");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit();
    }
  };

  // Get icon by level
  const getLevelIcon = (level) => {
    switch (level) {
      case "level1":
        return <FaCity className="text-blue-500" />;
      case "level2":
        return <FaBuilding className="text-green-500" />;
      case "level3":
        return <FaHome className="text-orange-500" />;
      default:
        return <FaMapMarkerAlt className="text-gray-500" />;
    }
  };

  // Get badge color by level
  const getBadgeColor = (level) => {
    switch (level) {
      case "level1":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "level2":
        return "bg-green-100 text-green-700 border-green-300";
      case "level3":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="absolute z-50 w-full max-w-md p-4 transform -translate-x-1/2 bg-white shadow-2xl top-4 left-1/2 md:p-5 rounded-2xl backdrop-blur-sm bg-opacity-95 animate-slideInTop">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse">
            <FaSearch className="text-lg text-white" />
          </div>
          <h3 className="text-lg font-bold text-transparent md:text-xl bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Tìm kiếm
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 text-gray-400 transition-all duration-300 rounded-full hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-95"
          title="Đóng"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Search Input Container */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tìm Tỉnh/Huyện/Xã hoặc địa chỉ..."
            className="w-full py-3 pl-4 pr-10 text-sm font-medium transition-all duration-300 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed md:text-base"
            disabled={loading}
          />
          {/* Search Icon inside input */}
          <div
            className="absolute text-gray-400 transform -translate-y-1/2 cursor-pointer right-3 top-1/2 hover:text-blue-600"
            onClick={handleCommit}
          >
            <FaSearch />
          </div>
        </div>

        {/* Click Point Mode Button (From Upstream) */}
        {onToggleClickMode && (
          <button
            className={`flex items-center justify-center w-12 h-12 transition-all duration-300 border-2 rounded-xl ${
              isClickModeActive
                ? "bg-blue-100 border-blue-500 text-blue-600 shadow-inner"
                : "bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"
            }`}
            onClick={onToggleClickMode}
            title="Chọn điểm trên bản đồ"
          >
            <FaMapMarkerAlt className="text-lg" />
          </button>
        )}
      </div>

      {/* Chips Container */}
      {selectedChips.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 mb-4 border-2 border-blue-200 bg-blue-50/50 rounded-xl animate-slideInTop">
          {selectedChips.map((chip) => (
            <div
              key={chip.id}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold border-2 rounded-lg shadow-sm transition-all duration-300 hover:scale-105 ${getBadgeColor(
                chip.level
              )}`}
            >
              {getLevelIcon(chip.level)}
              <span className="max-w-[150px] truncate">{chip.name}</span>
              <button
                onClick={() => handleRemoveLocalChip(chip.id)}
                className="flex items-center justify-center w-5 h-5 transition-all duration-300 rounded-full hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95"
                title="Xóa"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm font-bold text-red-700 border-2 border-red-300 bg-red-50 rounded-xl animate-shake">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 p-4 mb-4 text-blue-600 border-2 border-blue-200 bg-blue-50 rounded-xl animate-pulse">
          <FaSpinner className="text-2xl animate-spin" />
          <span className="text-sm font-bold">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && !loading && (
        <div className="mb-4 overflow-hidden overflow-y-auto border-2 border-gray-200 shadow-xl rounded-xl animate-slideInTop max-h-64">
          {suggestions.map((sug, idx) => (
            <div
              key={idx}
              onClick={() => handleSuggestionClick(sug)}
              className="flex items-center gap-3 p-3 transition-all duration-300 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:scale-[1.02] active:scale-95 group border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 transition-all duration-300 bg-gray-100 rounded-full group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:scale-110">
                <div className="text-lg transition-colors group-hover:text-white">
                  {getLevelIcon(sug.level)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800 truncate md:text-base group-hover:text-blue-600">
                    {sug.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getBadgeColor(
                      sug.level
                    )}`}
                  >
                    {sug.type}
                  </span>
                </div>
                {sug.level3Name && (
                  <div className="text-xs text-gray-500 truncate">
                    Thuộc: {sug.level3Name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State / Not Found */}
      {query && !loading && suggestions.length === 0 && sortedData && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 mb-4 text-gray-500 border-2 border-gray-200 border-dashed rounded-xl animate-fadeIn">
          <FaSearch className="text-4xl opacity-30" />
          <p className="text-sm font-bold text-center">
            Không tìm thấy ranh giới.
            <br />
            <span className="text-xs font-normal">
              Nhấn Enter để tìm kiếm địa chỉ thường.
            </span>
          </p>
          <button
            onClick={handleCommit}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Tìm địa chỉ "{query}"
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
