"use client"

import { useState, useEffect } from "react"
import { FaTimes, FaSearch, FaSpinner } from "react-icons/fa"
import { normalizeVietnamese } from "../utils/textNormalizer"
import PlaceDetailCard from "./PlaceDetailCard"
import "../styles/SearchPanel.css"

// Debounce helper
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Retry helper for fetch
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (err) {
      console.warn("[v0] Fetch retry attempt", i + 1, "failed:", err);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error("Max retries reached");
};
// VN ISO to level1_id map (hardcode from sorted.json - add all if need)

const VN_PROVINCE_MAP = {
  // Miền Bắc
  "VN-HN": { id: "01", name: "Hà Nội" },
  "VN-HP": { id: "31", name: "Hải Phòng" },
  "VN-60": { id: "30", name: "Hải Dương" },
  "VN-61": { id: "33", name: "Hưng Yên" },
  "VN-27": { id: "27", name: "Bắc Ninh" },
  "VN-24": { id: "24", name: "Bắc Giang" },
  "VN-19": { id: "19", name: "Thái Nguyên" },
  "VN-68": { id: "25", name: "Phú Thọ" },
  "VN-70": { id: "26", name: "Vĩnh Phúc" },
  "VN-17": { id: "17", name: "Hoà Bình" },
  "VN-06": { id: "15", name: "Yên Bái" },
  "VN-02": { id: "10", name: "Lào Cai" },
  "VN-07": { id: "08", name: "Tuyên Quang" },
  "VN-03": { id: "02", name: "Hà Giang" },
  "VN-04": { id: "04", name: "Cao Bằng" },
  "VN-09": { id: "20", name: "Lạng Sơn" },
  "VN-13": { id: "22", name: "Quảng Ninh" },
  "VN-05": { id: "14", name: "Sơn La" },
  "VN-11": { id: "11", name: "Điện Biên" },
  "VN-12": { id: "12", name: "Lai Châu" },
  "VN-50": { id: "06", name: "Bắc Kạn" },
  "VN-18": { id: "37", name: "Ninh Bình" },
  "VN-36": { id: "36", name: "Nam Định" },
  "VN-20": { id: "34", name: "Thái Bình" },
  "VN-35": { id: "35", name: "Hà Nam" },

  // Miền Trung
  "VN-38": { id: "38", name: "Thanh Hóa" },
  "VN-40": { id: "40", name: "Nghệ An" },
  "VN-42": { id: "42", name: "Hà Tĩnh" },
  "VN-44": { id: "44", name: "Quảng Bình" },
  "VN-45": { id: "45", name: "Quảng Trị" },
  "VN-46": { id: "46", name: "Huế" },
  "VN-DN": { id: "48", name: "Đà Nẵng" },
  "VN-49": { id: "49", name: "Quảng Nam" },
  "VN-51": { id: "51", name: "Quảng Ngãi" },
  "VN-52": { id: "52", name: "Bình Định" },
  "VN-54": { id: "54", name: "Phú Yên" },
  "VN-56": { id: "56", name: "Khánh Hòa" },
  "VN-58": { id: "58", name: "Ninh Thuận" },
  "VN-60": { id: "60", name: "Bình Thuận" },
  "VN-28": { id: "62", name: "Kon Tum" },
  "VN-64": { id: "64", name: "Gia Lai" },
  "VN-66": { id: "66", name: "Đắk Lắk" },
  "VN-67": { id: "67", name: "Đắk Nông" },
  "VN-68": { id: "68", name: "Lâm Đồng" },

  // Miền Nam
  "VN-SG": { id: "79", name: "Hồ Chí Minh" },
  "VN-75": { id: "75", name: "Đồng Nai" },
  "VN-77": { id: "77", name: "Bà Rịa - Vũng Tàu" },
  "VN-74": { id: "74", name: "Bình Dương" },
  "VN-70": { id: "70", name: "Bình Phước" },
  "VN-72": { id: "72", name: "Tây Ninh" },
  "VN-80": { id: "80", name: "Long An" },
  "VN-82": { id: "82", name: "Tiền Giang" },
  "VN-83": { id: "83", name: "Bến Tre" },
  "VN-84": { id: "84", name: "Trà Vinh" },
  "VN-86": { id: "86", name: "Vĩnh Long" },
  "VN-87": { id: "87", name: "Đồng Tháp" },
  "VN-89": { id: "89", name: "An Giang" },
  "VN-91": { id: "91", name: "Kiên Giang" },
  "VN-CT": { id: "92", name: "Cần Thơ" },
  "VN-93": { id: "93", name: "Hậu Giang" },
  "VN-94": { id: "94", name: "Sóc Trăng" },
  "VN-95": { id: "95", name: "Bạc Liêu" },
  "VN-96": { id: "96", name: "Cà Mau" },
};

// Map từ tên tỉnh mới (sau sát nhập) sang list tên tỉnh cũ (trước sát nhập, chuẩn hóa)
const MERGED_TO_OLD_MAP = {
  "tuyenquang": ["tuyenquang", "hagiang"],
  "laocai": ["laocai", "yenbai"],
  "thainguyen": ["backan", "thainguyen"],
  "phutho": ["vinhphuc", "phutho", "hoabinh"],
  "bacninh": ["bacninh", "bacgiang"],
  "hungyen": ["hungyen", "thaibinh"],
  "haiphong": ["haiphong", "haiduong"],
  "ninhbinh": ["hanam", "ninhbinh", "namdinh"],
  "quangtri": ["quangbinh", "quangtri"],
  "danang": ["danang", "quangnam"],
  "quangngai": ["quangngai", "kontum"],
  "gialai": ["gialai", "binhdinh"],
  "khanhhoa": ["khanhhoa", "ninhthuan"],
  "lamdong": ["lamdong", "daknong", "binhthuan"],
  "daklak": ["daklak", "phuyen"],
  "hochiminh": ["hochiminh", "bariavungtau", "binhduong"],
  "dongnai": ["dongnai", "binhphuoc"],
  "tayninh": ["tayninh", "longan"],
  "cantho": ["cantho", "soctrang", "haugiang"],
  "vinhlong": ["bentre", "vinhlong", "travinh"],
  "dongthap": ["dongthap", "tiengiang"],
  "camau": ["camau", "baclieu"],
  "angiang": ["angiang", "kiengiang"],
  // Các tỉnh giữ nguyên không cần list, sẽ dùng chính tên
};

const SearchPanel = ({ onClose, onSelect, onDistrictSelect, onBoundaryAdd }) => {  // Thêm props: onDistrictSelect cho quy hoạch, onBoundaryAdd để sync list opacity
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)  // Cho info
  const [placeDetailBoundaries, setPlaceDetailBoundaries] = useState([])  // Boundaries cho info
  const [selectedBoundaries, setSelectedBoundaries] = useState([])  // List opacity (sync từ map)
  const [boundaryOpacities, setBoundaryOpacities] = useState({})  // Opacity per boundary id
  const [sortedData, setSortedData] = useState(null)  // Load sorted.json
  // Load sorted.json

  useEffect(() => {

    const loadSortedData = async () => {

      try {
        const response = await fetch("/data/sorted.json")
        if (!response.ok) throw new Error("Failed to load sorted.json")
        const data = await response.json()
        setSortedData(data)
      } catch (err) {
        console.error("[v0] Error loading sorted.json:", err)
      }
    }
    loadSortedData()
  }, [])
  // Sync selectedBoundaries từ map qua callback (gọi từ GoogleMapComponent khi add)
  useEffect(() => {
    if (onBoundaryAdd) onBoundaryAdd((boundary) => {
      setSelectedBoundaries(prev => [...prev, boundary]);
      setBoundaryOpacities(prev => ({ ...prev, [boundary.id]: 0.5 }));
    });
  }, [onBoundaryAdd]);

  // Debounce cho autocomplete
  const debouncedSearch = debounce(async (value) => {
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    setLoading(true)  // Show spinner, nhưng input không disabled
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&countrycodes=vn&limit=5&addressdetails=1`
      const response = await fetchWithRetry(url)
      const data = await response.json()
      setSuggestions(data)
    } catch (err) {
      console.error("[v0] Nominatim search error:", err)
      setError("Lỗi tìm kiếm địa chỉ")
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, 3000);

  const handleInputChange = (value) => {
    setQuery(value)
    setError(null)
    debouncedSearch(value)
  }

  const mapNameToId = (level, name, sorted_data, context = {}) => {
    if (!sorted_data) return level === "level1" ? [] : null;
    let norm_name = normalizeVietnamese(name).replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    norm_name = norm_name.replace(/^(tinh|thanhpho|phuong|xa|quan|huyen)/, '')

    // ✅ LOGIC MỚI: Xử lý sát nhập cho level1 (trả về array các level1 nếu merged)
    let search_norm_names = [norm_name];
    if (level === "level1" && MERGED_TO_OLD_MAP[norm_name]) {
      search_norm_names = MERGED_TO_OLD_MAP[norm_name];
    }

    if (level === "level1") {
      const results = [];
      console.log("[DEBUG] Searching for merged names:", search_norm_names)
      for (const search_norm of search_norm_names) {
        console.log(`[DEBUG] Current target: ${search_norm}`)
        for (const l1 of sorted_data) {
          const [l1_id, l1_name] = l1
          let norm_l1 = normalizeVietnamese(l1_name).replace(/[^a-zA-Z0-9]/g, "").toLowerCase().replace(/^(tinh|thanhpho)/, '')
          if (search_norm === "tiengiang") { // DEBUG cho Tiền Giang
            console.log(`[DEBUG] Comparing Tiền Giang: Data Name: ${l1_name} (ID: ${l1_id}) -> Norm: ${norm_l1}`)
          }
          if (norm_l1 === search_norm || norm_l1.includes(search_norm)) {
            console.log(`[DEBUG] MATCH FOUND for ${search_norm}: ${l1_name}`)
            results.push({ level: "level1", name: l1_name, id: l1_id, level1_id: l1_id });
            break; // Giả sử không trùng tên cũ
          }
        }
      }
      return results; // Array các level1 matched (có thể multiple từ merged)
    }

    // Level2: yêu cầu context.level1_ids (array), tìm trong bất kỳ level1 nào
    if (level === "level2" && context.level1_ids && context.level1_ids.length > 0) {
      for (const l1_id of context.level1_ids) {
        const l1 = sorted_data.find(([id]) => id === l1_id);
        if (!l1) continue;

        const [, , , , l2s] = l1;
        for (const l2 of l2s) {
          const [l2_id, l2_name] = l2
          let norm_l2 = normalizeVietnamese(l2_name).replace(/[^a-zA-Z0-9]/g, "").toLowerCase().replace(/^(thanhpho|huyen|quan)/, '')

          if (norm_l2 === norm_name || norm_l2.includes(norm_name)) {
            return { level: "level2", name: l2_name, id: l2_id, level1_id: l1_id, level2_id: l2_id };
          }
        }
      }
      return null;
    }

    // Level3: yêu cầu context.level2_ids (array, nhưng thường single), tìm trong bất kỳ
    if (level === "level3" && context.level2_ids && context.level2_ids.length > 0) {
      for (const l2_id of context.level2_ids) {
        let foundL3 = null;
        for (const l1 of sorted_data) {
          const [, , , , l2s] = l1;
          const l2 = l2s.find(([id]) => id === l2_id);
          if (l2) {
            const [, , , , l3s] = l2;
            for (const l3 of l3s) {
              const [l3_id, l3_name] = l3
              let norm_l3 = normalizeVietnamese(l3_name).replace(/[^a-zA-Z0-9]/g, "").toLowerCase().replace(/^(phuong|xa)/, '')

              if (norm_l3 === norm_name || norm_l3.includes(norm_name)) {
                foundL3 = { level: "level3", name: l3_name, id: l3_id, level1_id: l1[0], level2_id: l2_id };
                break;
              }
            }
            if (foundL3) return foundL3;
          }
        }
      }
      return null;
    }

    return null;
  }

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError("Nhập địa chỉ để tìm")
      return
    }
    setLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=1&addressdetails=1`
      const response = await fetchWithRetry(url)
      const data = await response.json()
      const result = data.length > 0 ? data[0] : {}; // Lấy kết quả đầu tiên, hoặc đối tượng rỗng

      setSelectedPlace({
        ...result,
        lat: parseFloat(result.lat || 0),  // Parse string to number, default 0 nếu null
        lng: parseFloat(result.lon || result.lng || 0),  // Parse
      });

      // Parse address để extract levels từ OSM (dùng cho fallback)
      const address = result.address || {}


      // ✅ LOGIC MỚI: Ưu tiên parse queryParts (input người dùng)
      const queryParts = query.split(',').map(part => part.trim()).reverse(); // Reverse để level1 (tỉnh) ở đầu
      const levels = [];

      // Bước 1: Xác định level1 (tỉnh/thành phố) từ queryParts[0] (phần cuối input)
      let level1_name = queryParts.length > 0 ? queryParts.shift() : (address.state || address.province || address.county || ''); // Fallback OSM nếu không có parts
      const level1s = mapNameToId("level1", level1_name, sortedData); // Trả array (có thể multiple nếu merged)
      if (level1s.length > 0) {
        levels.push(...level1s);
      } else {
        // Fallback OSM nếu query không match
        const iso = address['ISO3166-2-lvl4'] || ''
        const osm_level1 = VN_PROVINCE_MAP[iso] || mapNameToId("level1", address.state || address.province || address.county || '', sortedData);
        if (osm_level1.length > 0) { // Vì mapNameToId level1 trả array
          levels.push(...osm_level1);
        } else {
          setError("Không xác định được tỉnh/thành phố");
          return;
        }
      }

      // Collect level1_ids từ level1s (multiple nếu merged)
      const level1_ids = level1s.map(l => l.id);

      // Bước 2: Xác định level2 (huyện/quận) từ queryParts[0] hiện tại (nếu còn)
      let level2_name = queryParts.length > 0 ? queryParts.shift() : null;
      const level2 = level2_name && level1_ids.length > 0 ? mapNameToId("level2", level2_name, sortedData, { level1_ids }) : null;
      if (level2) levels.push(level2);

      // Collect level2_ids (thường single hoặc null)
      const level2_ids = level2 ? [level2.id] : [];

      // Bước 3: Xác định level3 (xã/phường) từ queryParts[0] hiện tại (nếu còn)
      let level3_name = queryParts.length > 0 ? queryParts.shift() : null;
      const level3 = level2_ids.length > 0 && level3_name ? mapNameToId("level3", level3_name, sortedData, { level2_ids }) : null;
      if (level3) levels.push(level3);

      // Send onSelect
      levels.forEach(level => onSelect(level))

      // 🚀 CẬP NHẬT LOGIC GỌI onDistrictSelect
      // District for planning (ưu tiên level2 nếu có, fallback level1[0].name)
      const province = level1s[0] ? level1s[0].name : null;
      const district = level2 ? level2.name : province;

      if (district && onDistrictSelect) {
        onDistrictSelect(province, district); // Truyền cả province và district
      }
      // ------------------------------------

      // Boundaries for info
      setPlaceDetailBoundaries(levels)
    } catch (err) {
      console.error("[v0] Nominatim submit error:", err)
      setError("Lỗi xử lý địa chỉ")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Xóa ranh
  const handleRemoveBoundary = (id) => {
    setSelectedBoundaries(prev => prev.filter(b => b.id !== id))
    // Call callback to remove from map if have prop onBoundaryRemove
  }

  // Tắt all opacity
  const handleToggleAllOpacity = (opacity) => {
    const newOpacities = {}
    selectedBoundaries.forEach(b => newOpacities[b.id] = opacity)
    setBoundaryOpacities(newOpacities)
    // Sync to map Polygon options
  }

  // Clear all
  const handleClearAll = () => {
    setSelectedBoundaries([])
    setBoundaryOpacities({})
    // Sync to map
  }

  // onClose clear
  const handleClose = () => {
    handleClearAll()  // Clear khi tắt panel
    onClose()
  }

  return (
    <div className="search-panel">
      <div className="panel-header">
        <h3>Tìm kiếm ranh giới</h3>
        <button onClick={handleClose} className="close-btn">
          <FaTimes />
        </button>
      </div>

      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="VD: Chợ Lái Thiêu, Thuận An, Bình Dương..."
          className="search-input"
          disabled={loading}
        />
        <FaSearch className="search-icon" onClick={handleSubmit} style={{ cursor: 'pointer' }} />
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {loading && (
        <div className="loading-message">
          <FaSpinner className="spin-icon" /> Đang tải...
        </div>
      )}

      {suggestions.length > 0 && !loading && (
        <div className="suggestions">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="suggestion-item" onClick={() => setQuery(sug.display_name)}>
              <FaSearch className="suggestion-icon" />
              <div className="suggestion-text">
                <strong>{sug.display_name}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List opacity */}
      {selectedBoundaries.map((boundary) => (
        <div key={boundary.id} className="opacity-control-item">
          {/* Label và Range Input */}
          <label>{boundary.name} ({Math.round((boundaryOpacities[boundary.id] || 0.5) * 100)}%)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={boundaryOpacities[boundary.id] || 0.5}
            onChange={(e) => setBoundaryOpacities(prev => ({ ...prev, [boundary.id]: parseFloat(e.target.value) }))}
          />

          {/* ✅ THÊM: Bọc các nút Tắt/Xóa vào một div để căn chỉnh ngang */}
          <div className="opacity-control-buttons">
            <button onClick={() => setBoundaryOpacities(prev => ({ ...prev, [boundary.id]: 0 }))}>Tắt</button>
            <button onClick={() => handleRemoveBoundary(boundary.id)}>Xóa</button>
          </div>
        </div>
      ))}

      {/* Info địa điểm (child của panel) */}
      {
        selectedPlace && (
          <PlaceDetailCard
            place={selectedPlace}
            boundaries={placeDetailBoundaries}
            onClose={() => setSelectedPlace(null)}
            onBoundaryClick={(boundary) => onSelect(boundary)}  // Optional
          />
        )
      }
    </div >
  )
}

export default SearchPanel