"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaSearch,
  FaSpinner,
  FaMapMarkerAlt,
  FaCity,
  FaBuilding,
  FaHome,
  FaRoad,
  FaCompass,
  FaHistory,
  FaTrashAlt,
} from "react-icons/fa";
import { normalizeVietnamese } from "../../utils/textNormalizer";
import { searchPlaces } from "../../utils/nominatimService";

const STORAGE_KEY = "MAP_SEARCH_HISTORY";

const getStoredHistory = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const SearchPanel = ({
  onClose,
  onSelect,
  onBoundaryAdd,
  onPlaceSelect,
  onSearchCommit,
  onToggleClickMode,
  isClickModeActive,
  onRemoveChip,
  searchLoading = false,
  searchError = null,
}) => {
  const [query, setQuery] = useState("");
  const [boundarySuggestions, setBoundarySuggestions] = useState([]);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [selectedChips, setSelectedChips] = useState([]);
  const [sortedData, setSortedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [error, setError] = useState(searchError);
  const [searchHistory, setSearchHistory] = useState([]);

  const searchTimeoutRef = useRef(null);

  // Load lịch sử tìm kiếm từ localStorage
  useEffect(() => {
    setSearchHistory(getStoredHistory());
  }, []);

  // Lưu một mục vào lịch sử
  const saveItemToHistory = (item) => {
    try {
      const history = getStoredHistory();
      // Loại bỏ mục trùng lặp theo tên
      const filtered = history.filter(
        (h) => h.name.toLowerCase() !== item.name.toLowerCase()
      );
      const updated = [item, ...filtered].slice(0, 8); // Lưu tối đa 8 mục gần nhất
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (e) {
      console.warn("Failed to save search history:", e);
    }
  };

  // Xóa một mục khỏi lịch sử
  const removeHistoryItem = (e, index) => {
    e.stopPropagation();
    const updated = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {}
  };

  // Xóa toàn bộ lịch sử
  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
  };

  // Load dữ liệu GIS sorted.json cho tìm kiếm ranh giới
  useEffect(() => {
    const loadSortedData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/data/sorted.json");
        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu tìm kiếm ranh giới");
        }
        const data = await response.json();
        setSortedData(data);
        setError(null);
      } catch (err) {
        console.error("[SearchPanel] Error loading sorted.json:", err);
        setSortedData(null);
      } finally {
        setLoading(false);
      }
    };
    loadSortedData();
  }, []);

  // Đồng bộ searchError từ bên ngoài nếu có
  useEffect(() => {
    if (searchError) {
      setError(searchError);
    }
  }, [searchError]);

  // 1. Phân tích truy vấn ranh giới hành chính từ sorted.json
  const parseQueryForBoundaries = (q) => {
    if (!sortedData || !q.trim()) return [];

    const normalizedQuery = normalizeVietnamese(q);
    const results = [];
    const seen = new Set();

    sortedData.forEach((level1Item) => {
      const [level1Id, level1Name, level1Type, , level2s] = level1Item;

      // Level 1: Tỉnh / Thành phố
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

      // Level 2 & Level 3
      if (Array.isArray(level2s)) {
        level2s.forEach((level2Item) => {
          const [level2InternalId, level2Name, level2Type, , level3s] = level2Item;

          // Level 2: Quận / Huyện / Thị xã
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

          // Level 3: Xã / Phường / Thị trấn
          if (Array.isArray(level3s)) {
            level3s.forEach((level3) => {
              const [, level3Name, level3Type] = level3;
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

    return results.slice(0, 5);
  };

  // 2. Xử lý khi người dùng gõ vào ô tìm kiếm (Dò tìm tức thì cả Ranh giới & Địa chỉ chi tiết)
  const handleInputChange = (value) => {
    setQuery(value);
    setError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setBoundarySuggestions([]);
      setPlaceSuggestions([]);
      setIsSearchingOnline(false);
      return;
    }

    // A. Tìm tức thì ranh giới hành chính từ dữ liệu nội bộ
    const boundaries = parseQueryForBoundaries(value);
    setBoundarySuggestions(boundaries);

    // B. Gọi dịch vụ dò tìm địa chỉ chi tiết theo chuẩn Google Maps (Đường, số nhà, địa danh...)
    searchTimeoutRef.current = setTimeout(async () => {
      const cleanVal = value.trim();
      if (cleanVal.length >= 2) {
        setIsSearchingOnline(true);
        try {
          const places = await searchPlaces(cleanVal, 6);
          setPlaceSuggestions(places);
        } catch (err) {
          console.warn("[SearchPanel] Geocoding autocomplete error:", err);
        } finally {
          setIsSearchingOnline(false);
        }
      } else {
        setPlaceSuggestions([]);
      }
    }, 350);
  };

  // 3. Chọn địa chỉ / địa điểm chi tiết (Google Maps)
  const handlePlaceClick = (place) => {
    // Lưu vào lịch sử tìm kiếm
    saveItemToHistory({
      id: `place-${Date.now()}`,
      name: place.name || place.displayName.split(",")[0],
      subText: place.displayName,
      type: "place",
      lat: place.lat,
      lng: place.lng,
      raw: place,
      timestamp: Date.now(),
    });

    if (onPlaceSelect) {
      onPlaceSelect(place);
    } else if (onSearchCommit) {
      onSearchCommit(place.displayName || place.name);
    }
    setQuery(place.name || place.displayName);
    setBoundarySuggestions([]);
    setPlaceSuggestions([]);
    if (onClose) onClose();
  };

  // 4. Chọn ranh giới hành chính (Tỉnh / Huyện / Xã)
  const handleBoundaryClick = (suggestion) => {
    // Lưu vào lịch sử tìm kiếm
    saveItemToHistory({
      id: `boundary-${suggestion.id}`,
      name: suggestion.name,
      subText: suggestion.type || "Ranh giới hành chính",
      type: "boundary",
      raw: suggestion,
      timestamp: Date.now(),
    });

    const handleSelect = onSelect || onBoundaryAdd;
    if (!selectedChips.find((c) => c.id === suggestion.id)) {
      const newChips = [...selectedChips, suggestion];
      setSelectedChips(newChips);
      if (handleSelect) {
        handleSelect(suggestion);
      }
    }
    setQuery("");
    setBoundarySuggestions([]);
    setPlaceSuggestions([]);
  };

  const handleRemoveLocalChip = (chipId) => {
    const updatedChips = selectedChips.filter((c) => c.id !== chipId);
    setSelectedChips(updatedChips);
    if (onRemoveChip) {
      onRemoveChip(chipId);
    }
  };

  // 5. Bấm vào một mục trong lịch sử tìm kiếm
  const handleHistoryClick = (item) => {
    if (item.type === "place" && (item.raw || (item.lat && item.lng))) {
      handlePlaceClick(item.raw || item);
    } else if (item.type === "boundary" && item.raw) {
      handleBoundaryClick(item.raw);
    } else {
      setQuery(item.name);
      if (onSearchCommit) {
        onSearchCommit(item.name);
      }
      setBoundarySuggestions([]);
      setPlaceSuggestions([]);
      if (onClose) onClose();
    }
  };

  // 6. Xác nhận tìm kiếm khi bấm Enter hoặc nút Kính lúp
  const handleCommit = () => {
    if (placeSuggestions.length > 0) {
      handlePlaceClick(placeSuggestions[0]);
      return;
    }

    if (boundarySuggestions.length > 0) {
      handleBoundaryClick(boundarySuggestions[0]);
      return;
    }

    if (query.trim()) {
      saveItemToHistory({
        id: `query-${Date.now()}`,
        name: query.trim(),
        subText: "Tìm kiếm tự do",
        type: "query",
        timestamp: Date.now(),
      });

      if (onSearchCommit) {
        onSearchCommit(query.trim());
      }
      setBoundarySuggestions([]);
      setPlaceSuggestions([]);
      if (onClose) onClose();
      return;
    }

    setError("Vui lòng nhập tên đường, địa chỉ hoặc địa danh cần tìm.");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit();
    }
  };

  const clearQuery = () => {
    setQuery("");
    setBoundarySuggestions([]);
    setPlaceSuggestions([]);
    setError(null);
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case "level1":
        return <FaCity className="text-blue-500" />;
      case "level2":
        return <FaBuilding className="text-emerald-500" />;
      case "level3":
        return <FaHome className="text-amber-500" />;
      default:
        return <FaMapMarkerAlt className="text-rose-500" />;
    }
  };

  const hasSuggestions = boundarySuggestions.length > 0 || placeSuggestions.length > 0;

  return (
    <div
      className="absolute z-50 w-full max-w-lg p-4 transform -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-2xl top-4 left-1/2 md:p-5 rounded-2xl border border-slate-200/90 animate-slideInTop"
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-md">
            <FaSearch className="text-sm" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Tìm kiếm địa chỉ & Bản đồ</span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full">
                Google Maps GIS
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Tra cứu số nhà, tuyến đường, địa danh hoặc ranh giới hành chính
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"
          title="Đóng tìm kiếm"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>

      {/* 2. Search Input */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập địa chỉ (VD: Chợ Mỹ Tho, Đường Ấp Bắc...)"
            className="w-full py-2.5 pl-9 pr-16 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all"
            autoFocus
          />

          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-blue-600 transition-colors" />

          {/* Nút Xóa nhanh hoặc Trạng thái đang tải */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {isSearchingOnline && (
              <FaSpinner className="text-blue-600 text-xs animate-spin" title="Đang dò tìm địa chỉ..." />
            )}

            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] transition-all"
                title="Xóa nội dung"
              >
                <FaTimes />
              </button>
            )}

            <button
              type="button"
              onClick={handleCommit}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
              title="Tìm ngay"
            >
              Tìm
            </button>
          </div>
        </div>

        {/* Nút Chấm điểm trên bản đồ */}
        {onToggleClickMode && (
          <button
            type="button"
            className={`flex items-center justify-center w-11 h-11 transition-all rounded-xl border-2 cursor-pointer ${
              isClickModeActive
                ? "bg-blue-600 border-blue-600 text-white shadow-md animate-pulse"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
            }`}
            onClick={onToggleClickMode}
            title={isClickModeActive ? "Đang bật chế độ chấm điểm" : "Chấm điểm trực tiếp trên bản đồ"}
          >
            <FaCompass className="text-base" />
          </button>
        )}
      </div>

      {/* 3. Chips ranh giới đã chọn */}
      {selectedChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 mb-3 bg-blue-50/70 border border-blue-200 rounded-xl">
          <span className="text-[11px] font-bold text-blue-700 w-full mb-0.5">Ranh giới đang xem:</span>
          {selectedChips.map((chip) => (
            <div
              key={chip.id}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-white text-slate-800 border border-blue-300 rounded-lg shadow-sm"
            >
              {getLevelIcon(chip.level)}
              <span className="truncate max-w-[140px]">{chip.name}</span>
              <button
                onClick={() => handleRemoveLocalChip(chip.id)}
                className="text-slate-400 hover:text-rose-600 text-xs ml-1"
                title="Bỏ chọn"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. Thông báo lỗi nếu có */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 mb-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* 5. Danh sách gợi ý thông minh đa nguồn khi đang gõ (Địa chỉ chi tiết Google Maps + Ranh giới) */}
      {hasSuggestions && (
        <div className="overflow-hidden overflow-y-auto border border-slate-200 shadow-xl rounded-xl max-h-72 bg-white divide-y divide-slate-100">
          {/* Nhóm A: Địa chỉ & Địa điểm cụ thể (Google Maps / Nominatim) */}
          {placeSuggestions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>📍 Địa chỉ & Địa điểm (Google Maps)</span>
                <span className="text-blue-600 font-bold">{placeSuggestions.length} kết quả</span>
              </div>
              {placeSuggestions.map((place, idx) => (
                <div
                  key={`place-${idx}`}
                  onClick={() => handlePlaceClick(place)}
                  className="p-3 flex items-start gap-2.5 hover:bg-blue-50/70 cursor-pointer transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    {place.type === "road" ? <FaRoad className="text-xs" /> : <FaMapMarkerAlt className="text-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-800 group-hover:text-blue-600 truncate">
                      {place.name || place.displayName.split(",")[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed mt-0.5">
                      {place.displayName}
                    </div>
                  </div>
                  <span className="text-[9.5px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold flex-shrink-0">
                    {place.type === "road" ? "Đường" : "Địa điểm"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Nhóm B: Ranh giới hành chính nội bộ (Tỉnh / Huyện / Xã) */}
          {boundarySuggestions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>🏛️ Ranh giới hành chính</span>
                <span className="text-emerald-600 font-bold">{boundarySuggestions.length} khu vực</span>
              </div>
              {boundarySuggestions.map((sug, idx) => (
                <div
                  key={`bound-${idx}`}
                  onClick={() => handleBoundaryClick(sug)}
                  className="p-2.5 flex items-center gap-2.5 hover:bg-emerald-50/70 cursor-pointer transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    {getLevelIcon(sug.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                      {sug.name}
                    </span>
                    {sug.level3Name && (
                      <span className="text-[10.5px] text-slate-400 ml-1.5 font-medium">
                        (Thuộc {sug.level3Name})
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {sug.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. LỊCH SỬ TÌM KIẾM GẦN ĐÂY (Thay thế phần gợi ý tìm nhanh) */}
      {!query && !hasSuggestions && (
        <div className="mt-1 pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1.5">
              <FaHistory className="text-slate-400 text-xs" />
              <span>Lịch sử tìm kiếm gần đây:</span>
            </span>
            {searchHistory.length > 0 && (
              <button
                type="button"
                onClick={clearAllHistory}
                className="text-[10.5px] text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Xóa toàn bộ lịch sử"
              >
                <FaTrashAlt className="text-[9.5px]" />
                <span>Xóa lịch sử</span>
              </button>
            )}
          </div>

          {searchHistory.length === 0 ? (
            <div className="py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
              <FaHistory className="text-slate-300 text-base mx-auto mb-1 opacity-70" />
              <p className="text-xs font-bold text-slate-600">Chưa có lịch sử tìm kiếm</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Các địa chỉ và khu vực bạn tìm kiếm sẽ được tự động lưu tại đây
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
              {searchHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => handleHistoryClick(item)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-colors group border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 flex-shrink-0 transition-colors">
                      {item.type === "place" ? (
                        <FaMapMarkerAlt className="text-xs text-rose-500" />
                      ) : item.type === "boundary" ? (
                        <FaCity className="text-xs text-emerald-500" />
                      ) : (
                        <FaHistory className="text-[11px]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">
                        {item.name}
                      </div>
                      {item.subText && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.subText}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => removeHistoryItem(e, idx)}
                    className="w-5 h-5 flex items-center justify-center rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all ml-2 flex-shrink-0"
                    title="Xóa mục này khỏi lịch sử"
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Trạng thái không tìm thấy */}
      {query && !isSearchingOnline && !hasSuggestions && (
        <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl mt-2 bg-slate-50">
          <p className="text-xs font-bold text-slate-700 mb-1">
            Chưa tìm thấy địa chỉ "{query}"
          </p>
          <p className="text-[11px] text-slate-500 mb-3">
            Bạn có thể thử bấm nút bên dưới để gửi yêu cầu tìm kiếm mở rộng trên toàn quốc
          </p>
          <button
            type="button"
            onClick={handleCommit}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
          >
            Tìm kiếm mở rộng: "{query}"
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
