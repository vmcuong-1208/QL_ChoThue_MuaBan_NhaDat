"use client"

import { useState, useEffect, useRef } from "react"
import { Polygon } from "@react-google-maps/api"
import { FaSearch, FaTimes } from "react-icons/fa"
import "../styles/AdminBoundary.css"
import { convertCoordinates } from "../utils/gisUtils.js"

const AdminBoundary = ({ mapRef, onBoundarySelect, isVisible = true }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBoundaries, setSelectedBoundaries] = useState([]) // Multi boundaries cho chồng lớp
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [provinceOpacity, setProvinceOpacity] = useState(0.5)
  const [districtOpacity, setDistrictOpacity] = useState(0.5)
  const [wardOpacity, setWardOpacity] = useState(0.5)
  const [sortedData, setSortedData] = useState(null) // Load sorted.json async


  const searchTimeoutRef = useRef(null)

  // Load sorted.json offline từ public/ khi mount
  useEffect(() => {
    const loadSortedData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/data/sorted.json')
        if (!response.ok) throw new Error('Không tìm thấy sorted.json')
        const data = await response.json()
        setSortedData(data)
        setError(null)
      } catch (err) {
        console.error("[v0] Error loading sorted.json offline:", err)
        setError("Lỗi khi tải dữ liệu ranh giới hành chính")
      } finally {
        setLoading(false)
      }
    }
    loadSortedData()
  }, [])

  // Xử lý search real-time (autocomplete, no debounce để gợi ý nhanh)
  const handleSearch = (query) => {
    setSearchQuery(query)

    if (!query.trim() || !sortedData) {
      setSearchResults([])
      setSelectedBoundaries([]) // Clear all polygons khi xóa query
      return
    }

    const lowerQuery = query.toLowerCase()
    const results = sortedData.filter(item =>
      item[1].toLowerCase().includes(lowerQuery) || // name
      item[3].toLowerCase().includes(lowerQuery)   // romanized
    ).slice(0, 10) // Giới hạn 10 gợi ý

    setSearchResults(results.map((item) => ({
      id: item[0], // level2_id
      name: item[1],
      type: item[2],
      level: item[0].length === 3 ? 'level2' : 'level3', // Phân biệt huyện/xã
      level3s: item[4] // Nếu cần xã
    })))
  }
  //normalize nội bộ
  const normalizeNameForFile = (name) => {
    // 1. Thay thế trực tiếp 'Đ' và 'đ' bằng 'D' và 'd'
    let tempName = name.replace(/Đ/g, 'D').replace(/đ/g, 'd');

    // 2. Loại bỏ các ký tự không phải chữ, số
    let cleanedName = tempName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '');

    // 3. Chuyển sang không dấu
    let noDiacritics = cleanedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 4. Chuẩn hóa cuối cùng: Chuyển sang chữ thường
    return noDiacritics.toLowerCase();
  };
  const handleSelectBoundary = async (boundary) => {
    setLoading(true)
    try {
      const level1_id = boundary.id.slice(0, 2) // Extract tỉnh từ ID (ví dụ "7601" -> "76")
      const response = await fetch(`/data/gis/${level1_id}.json`)

      if (!response.ok) {
        // Log lỗi khi không tải được file GIS cấp Tỉnh
        throw new Error(`Không tìm thấy file GIS cấp Tỉnh (${level1_id}.json).`);
      }

      const gisData = await response.json()

      let coords = []
      let bbox = null
      let level = boundary.level
      let displayName = boundary.name

      // 🛑 LOGIC XỬ LÝ RANH GIỚI

      if (boundary.level === "level1") {
        // ... (Logic Level 1 giữ nguyên, đã chính xác)
        const rawCoords = gisData.coordinates || []
        coords = convertCoordinates(rawCoords)
        bbox = gisData.bbox
        displayName = gisData.name

        console.log("[v0] Rendering level1 (province):", displayName, "raw coords length:", rawCoords.length, "converted length:", coords.length)
        console.log("[v0] Converted coords structure:", {
          length: coords.length,
          firstPolygon: coords[0]?.length,
          firstRing: coords[0]?.[0]?.length,
          firstPoint: coords[0]?.[0],
          sample: JSON.stringify(coords[0]?.[0])
        })

      } else if (boundary.level === "level2") {
        // ... (Logic Level 2 giữ nguyên, đã chính xác)
        const searchId = boundary.id;
        const level2 = gisData.level2s?.find((l2) =>
          l2.level2_id === searchId || l2.id === searchId || l2.internal_id === searchId
        );

        if (level2) {
          const rawCoords = level2.coordinates || []
          coords = convertCoordinates(rawCoords)
          bbox = level2.bbox
          displayName = level2.name

          console.log("[v1] Rendering level2 (district):", displayName, "raw coords length:", rawCoords.length, "converted length:", coords.length)
        } else {
          console.warn(`[v1] level2_id not found: ${searchId} in province: ${level1_id}`);
          setError(`Không tìm thấy ranh giới Huyện/Quận cho ID: ${searchId}`);
          return
        }

      } else if (boundary.level === "level3") {
        // 🛑 DÙNG 3 CHỮ SỐ CHO FALLBACK TÌM LEVEL 2 CHA (Phù hợp với Bình Dương '718')
        // ID Xã/Phường: 74001, Huyện/Quận cha: 740 (hoặc 718)
        const level2_id_parent_numeric = boundary.id.slice(0, 3);
        let targetFeature = null;

        // 1. TẢI VÀ TÌM KIẾM TỌA ĐỘ CHÍNH XÁC (DATASET 2)
        try {
          const rawProvinceName = gisData.name.replace(/^(Tỉnh|Thành phố)\s*/, ''); // Bỏ "Tỉnh" / "Thành phố" 
          const level3Key = normalizeNameForFile(rawProvinceName); // Ví dụ: "binhduong"

          const level3Filename = `${level3Key}.json`; // Ví dụ: binhduong.json
          console.log(`[v0] Attempting to load exact level3 file: ${level3Filename}`);

          const level3Response = await fetch(`/data/gis/level3s/${level3Filename}`);

          if (level3Response.ok) {
            const level3GeoJSON = await level3Response.json();

            // Tìm Feature theo tên Xã (NAME_3)
            targetFeature = level3GeoJSON.features.find(feature =>
              // Sử dụng tên từ kết quả tìm kiếm (boundary.name) để khớp với NAME_3
              feature.properties.NAME_3 === boundary.name
            );
          } else {
            console.warn(`[v0] GeoJSON Level 3 not OK (${level3Response.status}): Falling back to Level 2.`);
          }
        } catch (err) {
          console.error(`[v0] Error loading or parsing Level 3 GeoJSON:`, err.message);
          console.warn("[v0] No level3 geometry found, falling back to level2 parent.");
        }

        if (targetFeature && targetFeature.geometry) {
          // ✅ THÀNH CÔNG: SỬ DỤNG TỌA ĐỘ CHÍNH XÁC CẤP XÃ
          const rawCoords = targetFeature.geometry.coordinates;
          coords = convertCoordinates(rawCoords);
          // 🛑 KIỂM TRA ĐỘ DÀI TỌA ĐỘ SAU KHI CHUYỂN ĐỔI
          if (coords.length === 0) {
            console.error("[v0] Level 3 Feature found, but coordinates are empty after conversion.");
            setError("Tọa độ ranh giới cấp Xã không hợp lệ.");
            return;
          }
          bbox = targetFeature.properties.bbox || gisData.bbox;
          displayName = targetFeature.properties.NAME_3;
          level = 'level3';
          console.log(`[v0] Rendering level3 (ward) successful: ${displayName}, converted paths: ${coords.length}`);

        } else {
          // 🛑 FALLBACK (SỬ DỤNG DỮ LIỆU TỈNH/HUYỆN)
          const level2 = gisData.level2s?.find(l2 =>
            // Dùng ID 3 chữ số để tìm (phù hợp với cấu trúc '718' của Bình Dương)
            l2.level2_id === level2_id_parent_numeric ||
            l2.id === level2_id_parent_numeric
          );

          if (level2) {
            const rawCoords = level2.coordinates || [];
            coords = convertCoordinates(rawCoords);
            // 🛑 KIỂM TRA ĐỘ DÀI TỌA ĐỘ FALLBACK
            if (coords.length === 0) {
              console.error(`[v0] Fallback Level 2 found (${level2.name}) but coordinates are empty/invalid.`);
              setError(`Tọa độ ranh giới cấp Huyện (${level2.name}) không hợp lệ.`);
              return;
            }
            if (coords.length === 0) {
              console.error(`[v0] Fallback Level 2 found (${level2.name}) but coordinates are empty/invalid.`);
              setError(`Tọa độ ranh giới cấp Huyện (${level2.name}) không hợp lệ.`);
              return;
            }

            bbox = level2.bbox;
            displayName = boundary.name; // Tên Xã/Phường
            level = 'level3_fallback';
            console.warn(`[v0] Fallback to Level 2 parent: ${level2.name} successful. Converted paths: ${coords.length}`);
          } else {
            console.error(`[v0] Could not find Level 2 parent for Level 3 ID: ${boundary.id} (searching for: ${level2_id_parent_numeric}).`);
            setError("Lỗi: Không tìm thấy ranh giới cấp Huyện cho Xã này.");
            return;
          }
        }
      }

      // --- 🛑 GÁN VÀ FIT BOUNDS (PHẦN NÀY ĐÃ ĐƯỢC CHUẨN HÓA) ---

      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`

      if (coords.length === 0) {
        setError("Không có tọa độ để vẽ.");
        return;
      }

      setSelectedBoundaries(prev => [...prev, { name: displayName, coordinates: coords, bbox, color, level }])
      console.log(`[v0] Added boundary to state: ${displayName} (${level}) with ${coords.length} paths.`);

      // Fit bounds
      if (mapRef.current && bbox) {
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend({ lat: bbox[1], lng: bbox[0] }) // sw (minLng, minLat)
        bounds.extend({ lat: bbox[3], lng: bbox[2] }) // ne (maxLng, maxLat)
        mapRef.current.fitBounds(bounds)
      }

      if (onBoundarySelect) onBoundarySelect(boundary)
    } catch (err) {
      // Log lỗi cuối cùng
      console.error("[v0] General Error in handleSelectBoundary:", err.message, err);
      setError("Lỗi load coordinates: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedBoundaries([])
    setSearchQuery("")
    setSearchResults([])
  }

  if (!isVisible) return null

  return (
    <>
      <div className="admin-boundary-container">
        <div className="search-box">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm tỉnh, huyện, xã..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={handleClearSelection}>
                <FaTimes />
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result, index) => (
                <div key={index} className="result-item" onClick={() => handleSelectBoundary(result)}>
                  <span className="result-name">{result.name} ({result.type})</span>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-message">Đang tải dữ liệu...</div>}
        </div>

        {/* Opacity sliders như 3 thanh gắn */}
        <div className="opacity-sliders flex no-gap">
          <input type="range" min="0" max="1" step="0.1" value={provinceOpacity} onChange={(e) => {
            const val = parseFloat(e.target.value)
            setProvinceOpacity(val)
            if (val > 0.5) setDistrictOpacity(Math.max(0, val - 0.2))
          }} title="Tỉnh" />
          <input type="range" min="0" max="1" step="0.1" value={districtOpacity} onChange={(e) => {
            const val = parseFloat(e.target.value)
            setDistrictOpacity(val)
            if (val > 0.5) setWardOpacity(Math.max(0, val - 0.2))
          }} title="Huyện" />
          <input type="range" min="0" max="1" step="0.1" value={wardOpacity} onChange={e => setWardOpacity(parseFloat(e.target.value))} title="Xã" />
        </div>
      </div>

      {/* Vẽ multi polygons */}
      {selectedBoundaries.map((boundary, idx) => {
        const paths = boundary.coordinates
        const opacity = boundary.level === 'level1' ? provinceOpacity : boundary.level === 'level2' ? districtOpacity : wardOpacity
        return paths.map((path, pIdx) => (
          <Polygon
            key={`${idx}-${pIdx}`}
            paths={path}
            options={{
              fillColor: boundary.color,
              fillOpacity: opacity * 0.25,
              strokeColor: boundary.color,
              strokeOpacity: opacity * 0.8,
              strokeWeight: 2,
            }}
          />
        ))
      })}
    </>
  )
}

export default AdminBoundary