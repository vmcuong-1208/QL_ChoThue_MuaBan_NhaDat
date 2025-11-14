"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Polygon, Marker, InfoWindow } from "@react-google-maps/api"
import {
  FaMap,
  FaSatellite,
  FaRuler,
  FaExpand,
  FaCompress,
  FaDrawPolygon,
  FaLayerGroup,
  FaDirections,
  FaMapMarkerAlt,
  FaSearch,
} from "react-icons/fa"
import { calculateDistance } from "../utils/coordinateConverter"
import PlanningOverlay from "./PlanningOverlay"
import DirectionsPanel from "./DirectionsPanel"
import NearbyPlacesPanel from "./NearbyPlacesPanel"
import SearchPanel from "./SearchPanel"
import PlaceDetailCard from "./PlaceDetailCard"
import { getPlaceByCoordinates } from "../utils/nominatimService"
import { findBoundariesContainingPoint as findBoundariesByPoint } from "../utils/pointInPolygon"
import { normalizeVietnamese } from "../utils/textNormalizer"
import "../styles/GoogleMapComponent.css"
import { convertCoordinates } from "../utils/gisUtils"
const GOOGLE_MAPS_API_KEY = "AIzaSyDhjP2YOGxpCbsp7HatnQXGsKutiIXwmuo"
const libraries = ["drawing", "geometry", "places"]

const GoogleMapComponent = ({
  center = { lat: 10.8231, lng: 106.6297 }, // Mặc định TP.HCM
  zoom = 15,
  propertyBoundary = null, // Tọa độ khung viền thửa đất [{lat, lng}, ...]
  propertyArea = null, // Diện tích thửa đất (m2)
  planningData = null, // Thêm prop planningData (JSON Index)
  height = "500px",
  showControls = true,
  onMapClick = null,
  showMode = "property", // Thêm từ version mới: "map" hoặc "property"
  onBoundaryAdd,
  onDistrictSelect,
}) => {
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const [propertyCenter, setPropertyCenter] = useState(center)

  const [mapType, setMapType] = useState("roadmap") // roadmap hoặc satellite
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true)
  const [showPlanningLayer, setShowPlanningLayer] = useState(false)
  const [boundaryOpacity, setBoundaryOpacity] = useState(0.5)

  // State công cụ đo
  const [measurementMode, setMeasurementMode] = useState(false)
  const [measurementPoints, setMeasurementPoints] = useState([])
  const [measurementDistance, setMeasurementDistance] = useState(0)

  // State fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)

  // State info window
  const [selectedPoint, setSelectedPoint] = useState(null)

  const [showDirections, setShowDirections] = useState(false)
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false)
  const [routeData, setRouteData] = useState(null)

  // Ref cho map
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  // Ref cho measurement layers
  const polylineRef = useRef(null)
  const markersRef = useRef([])

  // Ref cho route polyline
  const routePolylineRef = useRef(null)

  const [planningOpacity, setPlanningOpacity] = useState(0.7)

  // **START: Thêm/Điều chỉnh States từ Bản Vá**
  const [showAdminBoundary, setShowAdminBoundary] = useState(false)

  // **END: Thêm/Điều chỉnh States từ Bản Vá**

  const [showSearch, setShowSearch] = useState(false) // Toggle search riêng
  const [selectedBoundaries, setSelectedBoundaries] = useState([]) // Để vẽ polygon từ search (chồng lớp)
  const [boundaryOpacities, setBoundaryOpacities] = useState({}) // Opacity riêng cho mỗi lớp (id: opacity)

  const [clickPointMode, setClickPointMode] = useState(false) // Mode chọn điểm trên map
  const [selectedPlace, setSelectedPlace] = useState(null) // Place info từ Nominatim
  const [placeDetailBoundaries, setPlaceDetailBoundaries] = useState([]) // Boundaries cho place
  const [clickMarker, setClickMarker] = useState(null) // Marker khi click

  // Callback khi map load xong
  const onLoad = useCallback((map) => {
    mapRef.current = map
  }, [])
  // Xóa một ranh giới cụ thể
  const handleRemoveBoundary = (id) => {
    setSelectedBoundaries(prev => prev.filter(b => b.id !== id))
    setBoundaryOpacities(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
    // ✅ Có thể gọi onBoundaryRemove nếu bạn muốn thông báo cho component cha (nếu có)
    // if (onBoundaryRemove) onBoundaryRemove(id)
    console.log("[v0] Boundary removed:", id)
  }
  // Xóa tất cả ranh giới
  const handleClearAllBoundaries = () => {
    setSelectedBoundaries([])
    setBoundaryOpacities({})
    // ✅ Có thể gọi onBoundaryRemove nếu bạn muốn thông báo cho component cha (nếu có)
    // if (onBoundaryRemove) onBoundaryRemove('all')
    console.log("[v0] All boundaries cleared.")
  }
  const loadLevel3sGeoJSON = async (level1_id, level1NameRomanized, level3Name) => {
    try {
      // Giữ nguyên filename không prefix (ví dụ: binhduong.json)
      const fileName = `${level1NameRomanized}.json`
      const response = await fetch(`/data/gis/level3s/${fileName}`)

      if (!response.ok) {
        console.warn(`[v0] Level3s file not found: ${fileName}`)
        return null
      }

      const geoJSON = await response.json()
      console.log(`[v0] Loaded level3s GeoJSON: ${fileName}`, geoJSON)

      // Lọc features theo NAME_3
      if (geoJSON.features && Array.isArray(geoJSON.features)) {
        // Chuẩn hóa tên Level 3 từ input và LOẠI BỎ KHOẢNG TRẮNG
        const level3NameNormalizedNoSpace = normalizeVietnamese(level3Name).replace(/\s+/g, "")

        const matchedFeature = geoJSON.features.find((f) => {
          const properties = f.properties || {}
          const name3 = properties.NAME_3 || ""

          // Chuẩn hóa tên NAME_3 từ GeoJSON và LOẠI BỎ KHOẢNG TRẮNG
          const name3NormalizedNoSpace = normalizeVietnamese(name3).replace(/\s+/g, "")

          // So sánh hai chuỗi KHÔNG DẤU và KHÔNG KHOẢNG TRẮNG
          return name3NormalizedNoSpace === level3NameNormalizedNoSpace
        })

        if (matchedFeature && matchedFeature.geometry) {
          console.log(`[v0] Found geometry for level3: ${level3Name}`)
          return { geometry: matchedFeature.geometry, matchedFeature };  // Return object để có properties
        } else {
          console.warn(`[v0] No geometry found for level3: ${level3Name}`)
          return null
        }
      }

      return null
    } catch (err) {
      console.error(`[v0] Error loading or parsing Level 3 GeoJSON:`, err.message);
      console.warn("[v0] No level3 geometry found, falling back to level2 parent.");
      return null
    }
  }

  const handleSearchSelect = async (result) => {
    try {
      if (!result.level1_id) {
        console.error("[v0] Missing level1_id in result:", result)
        return
      }

      const level1_id = result.level1_id
      console.log(
        "[v0] Loading GIS data for level1_id:",
        level1_id,
        "search level:",
        result.level,
        "level2_id:",
        result.level2_id,
      )

      const gisResponse = await fetch(`/data/gis/${level1_id}.json`)
      if (!gisResponse.ok) {
        console.error("[v0] GIS file not found:", `${level1_id}.json`)
        return
      }

      const gisData = await gisResponse.json()
      console.log("[v0] GIS data loaded successfully. Province:", gisData.name)

      let coords = []
      let bbox = null
      let displayName = result.name
      let level = result.level  // Init level từ result

      if (result.level === "level1") {
        // Tỉnh: dùng coordinates top-level
        const rawCoords = gisData.coordinates || []
        coords = convertCoordinates(rawCoords)
        bbox = gisData.bbox
        displayName = gisData.name
        console.log("[v0] Rendering level1 (province):", displayName, "raw coords length:", rawCoords.length, "converted length:", coords.length)
      } else if (result.level === "level2") {
        // Huyện/Quận: tìm trong level2s theo level2_id

        // Sửa đổi: Tìm kiếm theo level2_id (chuẩn) HOẶC internal_id (nội bộ, ví dụ: '760')
        const searchId = result.level2_id;

        const level2 = gisData.level2s?.find((l2) =>
          // 1. So sánh với ID mà SearchPanel gửi tới (ví dụ: '760')
          l2.level2_id === searchId ||
          // 2. PHẢI đảm bảo Level 2 trong gisData có trường internalId/id
          l2.id === searchId ||
          l2.internal_id === searchId
        );

        if (level2) {
          const rawCoords = level2.coordinates || []
          coords = convertCoordinates(rawCoords)
          bbox = level2.bbox
          // Luôn sử dụng tên từ file GIS để đảm bảo tính nhất quán
          displayName = level2.name
          console.log("[v1] Rendering level2 (district):", displayName, "raw coords length:", rawCoords.length, "converted length:", coords.length)
        } else {
          // Lỗi này giờ sẽ chỉ xảy ra nếu ID SearchPanel gửi tới không khớp với ID nào
          console.warn("[v1] level2_id not found:", searchId, "in province:", level1_id)
          return
        }
      } else if (result.level === "level3") {
        const rawProvinceName = gisData.name.replace(/^(Tỉnh|Thành phố)\s*/, ''); // Bỏ "Tỉnh" / "Thành phố"
        // Cần romanized name của tỉnh để build URL
        const level1NameRomanized = gisData.romanized || normalizeVietnamese(rawProvinceName).replace(/\s+/g, "").toLowerCase();

        const level3Data = await loadLevel3sGeoJSON(level1_id, level1NameRomanized, result.name)

        if (level3Data && level3Data.geometry) {
          // ✅ THÀNH CÔNG: SỬ DỤNG TỌA ĐỘ CHÍNH XÁC CẤP XÃ
          const rawCoords = level3Data.geometry.coordinates;
          coords = convertCoordinates(rawCoords);
          // 🛑 KIỂM TRA ĐỘ DÀI TỌA ĐỘ SAU KHI CHUYỂN ĐỔI
          if (coords.length === 0) {
            console.error("[v0] Level 3 Feature found, but coordinates are empty after conversion.");
            console.error("Tọa độ ranh giới cấp Xã không hợp lệ.");
            return;
          }
          bbox = level3Data.matchedFeature.properties.bbox || gisData.bbox;  // Sử dụng bbox từ matchedFeature nếu có
          displayName = level3Data.matchedFeature.properties.NAME_3 || result.name;  // Ưu tiên NAME_3, fallback result.name
          level = 'level3';
          console.log(`[v0] Rendering level3 (ward) successful: ${displayName}, converted paths: ${coords.length}`);
        } else {
          // 🛑 FALLBACK (SỬ DỤNG DỮ LIỆU TỈNH/HUYỆN)
          const level2 = gisData.level2s?.find(l2 =>
            // Dùng ID để tìm (phù hợp với cấu trúc '725' của Thuận An)
            l2.level2_id === result.level2_id ||
            l2.id === result.level2_id
          );

          if (level2) {
            const rawCoords = level2.coordinates || [];
            coords = convertCoordinates(rawCoords);
            // 🛑 KIỂM TRA ĐỘ DÀI TỌA ĐỘ FALLBACK
            if (coords.length === 0) {
              console.error(`[v0] Fallback Level 2 found (${level2.name}) but coordinates are empty/invalid.`);
              console.error(`Tọa độ ranh giới cấp Huyện (${level2.name}) không hợp lệ.`);
              return;
            }

            bbox = level2.bbox;
            displayName = result.name; // Tên Xã/Phường
            level = 'level3_fallback';
            console.warn(`[v0] Fallback to Level 2 parent: ${level2.name} successful. Converted paths: ${coords.length}`);
          } else {
            console.error(`[v0] Could not find Level 2 parent for Level 3 ID: ${result.id} (searching for: ${result.level2_id}).`);
            console.error("Lỗi: Không tìm thấy ranh giới cấp Huyện cho Xã này.");
            return;
          }
        }
      }

      if (coords.length === 0) {
        console.warn("[v0] No coordinates found for:", result.name)
        return
      }

      const BRIGHT_COLORS = ["#39FF14", "#7DF9FF", "#FF10F0", "#FF6700", "#FFFF54", "#FF00FF", "#00FFAA"]
      const uniqueId = `${result.level}-${result.id}-${Date.now()}`
      const selectedColor = BRIGHT_COLORS[selectedBoundaries.length % BRIGHT_COLORS.length]
      const newBoundary = {
        id: uniqueId,
        level: result.level,
        name: displayName,
        coordinates: coords,
        color: selectedColor,
      };
      setSelectedBoundaries((prev) => [
        ...prev,
        newBoundary,
      ])
      if (onBoundaryAdd) onBoundaryAdd(newBoundary);
      setBoundaryOpacities((prev) => ({ ...prev, [uniqueId]: 0.5 }))

      // Fit map bounds
      if (mapRef.current && bbox && bbox.length === 4) {
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend({ lat: bbox[1], lng: bbox[0] }) // SW
        bounds.extend({ lat: bbox[3], lng: bbox[2] }) // NE
        mapRef.current.fitBounds(bounds)
        console.log("[v0] Map fitted to bounds:", bbox)
      }

      console.log("[v0] Boundary added. Total boundaries:", selectedBoundaries.length + 1)
    } catch (err) {
      console.error("[v0] handleSearchSelect error:", err)
    }
  }

  // SearchPanel toggle 
  const handleToggleSearch = () => {
    if (showSearch) {
      // Đóng panel: xóa dữ liệu cũ
      setShowSearch(false)
      setSelectedBoundaries([])
      setBoundaryOpacities({})
    } else {
      // Mở panel
      setShowSearch(true)
    }
  }

  // Xóa đo đạc (giữ nguyên)
  const clearMeasurement = () => {
    setMeasurementPoints([])
    setMeasurementDistance(0)
    setMeasurementMode(false)
  }

  // Toggle measurement mode (giữ nguyên)
  const toggleMeasurementMode = () => {
    if (measurementMode) {
      clearMeasurement()
    } else {
      setMeasurementMode(true)
    }
  }

  // Toggle fullscreen (giữ nguyên)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Lắng nghe sự kiện fullscreen change (giữ nguyên)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (propertyBoundary && propertyBoundary.length > 0 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds()
      propertyBoundary.forEach((point) => {
        bounds.extend(point)
      })
      mapRef.current.fitBounds(bounds)

      // Tính tâm của bounds
      const centerPoint = bounds.getCenter()
      setPropertyCenter({
        lat: centerPoint.lat(),
        lng: centerPoint.lng(),
      })
    }
  }, [propertyBoundary])

  // Handle measurement layers manually (giữ nguyên)
  useEffect(() => {
    if (!mapRef.current) return // Chờ map load

    // Cleanup old layers
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (measurementMode && measurementPoints.length > 0) {
      // Tạo Markers
      measurementPoints.forEach((point, index) => {
        const marker = new window.google.maps.Marker({
          position: point,
          map: mapRef.current,
          label: {
            text: `${index + 1}`,
            color: "white",
            fontSize: "12px",
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        })
        markersRef.current.push(marker)
      })

      // Tạo Polyline nếu >1 points
      if (measurementPoints.length > 1) {
        polylineRef.current = new window.google.maps.Polyline({
          path: measurementPoints,
          strokeColor: "#4285F4",
          strokeOpacity: 1,
          strokeWeight: 3,
          geodesic: true,
        })
        polylineRef.current.setMap(mapRef.current)
      }
    }
  }, [measurementMode, measurementPoints, mapRef])

  // Handle route polyline manually (giữ nguyên)
  useEffect(() => {
    if (!mapRef.current) return

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null)
      routePolylineRef.current = null
    }

    if (routeData && routeData.coordinates) {
      routePolylineRef.current = new window.google.maps.Polyline({
        path: routeData.coordinates,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.9,
        strokeWeight: 4,
        zIndex: 1000,
      })
      routePolylineRef.current.setMap(mapRef.current)
    }
  }, [routeData, mapRef])

  const loadAllGISData = async () => {
    try {
      const allGISData = []

      // Load sorted.json để biết tất cả ID
      const sortedResponse = await fetch("/data/sorted.json")
      const sorted = await sortedResponse.json()

      // Duyệt từng tỉnh
      const level1Ids = new Set()
      sorted.forEach((item) => {
        const firstTwoDigits = item[0]?.slice(0, 2) // level2_id -> tỉnh
        if (firstTwoDigits) level1Ids.add(firstTwoDigits)
      })

      // Load tất cả GIS files
      for (const level1Id of level1Ids) {
        try {
          const response = await fetch(`/data/gis/${level1Id}.json`)
          if (response.ok) {
            const data = await response.json()
            allGISData.push(data)
          }
        } catch (err) {
          console.warn(`[v0] Could not load GIS ${level1Id}:`, err)
        }
      }

      console.log("[v0] Loaded", allGISData.length, "province GIS data")
      return allGISData
    } catch (error) {
      console.error("[v0] Error loading all GIS data:", error)
      return []
    }
  }

  const handleMapClickForPoint = useCallback(
    async (e) => {
      if (!clickPointMode) return

      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      const clickedPoint = { lat, lng }

      console.log("[v0] Click point mode - point clicked:", clickedPoint)

      // Tạo marker
      setClickMarker(clickedPoint)

      // Lấy thông tin địa điểm từ OSM
      const place = await getPlaceByCoordinates(lat, lng)

      if (place) {
        setSelectedPlace(place)

        // Tìm boundaries chứa điểm này
        const allGISData = await loadAllGISData()

        // Build danh sách GIS để check point-in-polygon
        const gisDataForCheck = []

        // Duyệt tất cả GIS files
        for (const provinceData of allGISData) {
          // Level1 (tỉnh)
          gisDataForCheck.push({
            level: 1,
            level1_id: provinceData.level1_id,
            name: provinceData.name,
            type: provinceData.type,
            coordinates: provinceData.coordinates,
          })

          // Level2 (huyện)
          if (provinceData.level2s && Array.isArray(provinceData.level2s)) {
            provinceData.level2s.forEach((level2) => {
              gisDataForCheck.push({
                level: 2,
                level1_id: provinceData.level1_id,
                level2_id: level2.level2_id,
                name: level2.name,
                type: level2.type,
                coordinates: level2.coordinates,
              })
            })
          }
        }

        // Find boundaries
        const boundaries = await findBoundariesByPoint(clickedPoint, gisDataForCheck)

        // Format boundaries cho PlaceDetailCard
        const formattedBoundaries = boundaries.map((b) => ({
          id: `${b.level1_id}_${b.level2_id || ""}`,
          name: b.name,
          type: b.type,
          level: b.level,
          level1Id: b.level1_id,
          level2Id: b.level2_id,
        }))

        setPlaceDetailBoundaries(formattedBoundaries)

        console.log("[v0] Found", formattedBoundaries.length, "boundaries for point")
      }

      // Exit click-point mode
      setClickPointMode(false)
    },
    [clickPointMode],
  )

  // Override handleMapClick để include click-point mode
  const handleMapClickOverride = useCallback(
    (e) => {
      handleMapClickForPoint(e)

      if (measurementMode) {
        const newPoint = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        }
        const newPoints = [...measurementPoints, newPoint]
        setMeasurementPoints(newPoints)

        if (newPoints.length > 1) {
          let totalDistance = 0
          for (let i = 0; i < newPoints.length - 1; i++) {
            totalDistance += calculateDistance(newPoints[i], newPoints[i + 1])
          }
          setMeasurementDistance(totalDistance)
        }
      }

      if (onMapClick) {
        onMapClick(e)
      }
    },
    [handleMapClickForPoint, measurementMode, measurementPoints, onMapClick],
  )

  if (loadError) {
    return (
      <div className="map-error">
        <p>Lỗi khi tải Google Maps. Vui lòng kiểm tra API key hoặc kết nối internet.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải bản đồ...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`google-map-container ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Controls */}
      {showControls && (
        <div className="map-controls-redesign">
          {/* Loại bản đồ (giữ nguyên) */}
          <div className="control-section">
            <div className="control-label">Loại bản đồ</div>
            <div className="icon-button-group">
              <button
                className={`icon-button ${mapType === "roadmap" ? "active" : ""}`}
                onClick={() => setMapType("roadmap")}
                title="Bản đồ thường"
              >
                <FaMap />
              </button>
              <button
                className={`icon-button ${mapType === "satellite" ? "active" : ""}`}
                onClick={() => setMapType("satellite")}
                title="Bản đồ vệ tinh"
              >
                <FaSatellite />
              </button>
            </div>
          </div>

          {/* Các lớp bản đồ (giữ nguyên) */}
          <div className="control-section">
            <div className="control-label">Lớp bản đồ</div>

            {planningData && (
              <>
                <button
                  className={`icon-button ${showPlanningLayer ? "active" : ""}`}
                  onClick={() => setShowPlanningLayer(!showPlanningLayer)}
                  title="Lớp quy hoạch"
                >
                  <FaLayerGroup />
                  <span className="button-text">Quy hoạch</span>
                </button>

                {showPlanningLayer && (
                  <div className="opacity-slider-vertical" style={{ marginLeft: "8px" }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={planningOpacity * 100}
                      onChange={(e) => setPlanningOpacity(Number.parseInt(e.target.value) / 100)}
                      orient="vertical"
                      title="Độ mờ lớp quy hoạch"
                    />
                    <span className="opacity-value">{Math.round(planningOpacity * 100)}%</span>
                  </div>
                )}
              </>
            )}

            {/* Lớp khung viền (giữ nguyên) */}
            {propertyBoundary && (
              <button
                className={`icon-button ${showBoundaryLayer ? "active" : ""}`}
                onClick={() => setShowBoundaryLayer(!showBoundaryLayer)}
                title="Khung viền thửa đất"
              >
                <FaDrawPolygon />
                <span className="button-text">Khung viền</span>
              </button>
            )}
          </div>

          {/* Thanh opacity dọc (giữ nguyên) */}
          {propertyBoundary && showBoundaryLayer && (
            <div className="control-section opacity-section">
              <div className="control-label">Độ mờ</div>
              <div className="opacity-slider-vertical">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={boundaryOpacity * 100}
                  onChange={(e) => setBoundaryOpacity(Number.parseInt(e.target.value) / 100)}
                  orient="vertical"
                />
                <span className="opacity-value">{Math.round(boundaryOpacity * 100)}%</span>
              </div>
            </div>
          )}

          {/* Công cụ */}
          <div className="control-section">
            <div className="control-label">Công cụ</div>
            <button className="icon-button" onClick={toggleFullscreen} title="Toàn màn hình">
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
            <button
              className={`icon-button ${showSearch ? "active" : ""}`}
              onClick={handleToggleSearch}
              title="Tìm kiếm địa chỉ"
            >
              <FaSearch />
            </button>
            <button
              className={`icon-button ${clickPointMode ? "active" : ""}`}
              onClick={() => setClickPointMode(!clickPointMode)}
              title="Click trên map để chọn ranh"
            >
              <FaMapMarkerAlt />
            </button>
            <button
              className={`icon-button ${measurementMode ? "active" : ""}`}
              onClick={toggleMeasurementMode}
              title="Đo khoảng cách"
            >
              <FaRuler />
            </button>
            {propertyCenter && (
              <>
                <button
                  className={`icon-button ${showDirections ? "active" : ""}`}
                  onClick={() => setShowDirections(!showDirections)}
                  title="Tìm đường"
                >
                  <FaDirections />
                </button>
                <button
                  className={`icon-button ${showNearbyPlaces ? "active" : ""}`}
                  onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}
                  title="Tham khảo vị trí"
                >
                  <FaMapMarkerAlt />
                </button>
              </>
            )}
          </div>

          {/* Thông tin đo (giữ nguyên) */}
          {measurementMode && measurementPoints.length > 0 && (
            <div className="measurement-info-compact">
              <div className="measurement-distance">{measurementDistance.toFixed(2)}m</div>
              <button onClick={clearMeasurement} className="clear-btn">
                Xóa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Directions Panel (giữ nguyên) */}
      {showDirections && propertyCenter && (
        <DirectionsPanel
          propertyCenter={propertyCenter}
          mapRef={mapRef}
          onClose={() => {
            setShowDirections(false)
            setRouteData(null)
          }}
          onRouteChange={setRouteData}
        />
      )}

      {/* Nearby Places Panel (giữ nguyên) */}
      {showNearbyPlaces && propertyCenter && (
        <NearbyPlacesPanel propertyCenter={propertyCenter} mapRef={mapRef} onClose={() => setShowNearbyPlaces(false)} />
      )}

      {/* Fix SearchPanel - đóng nên không overlap */}
      {showSearch && (
        <SearchPanel
          onClose={() => setShowSearch(false)}
          onSelect={handleSearchSelect}
          onDistrictSelect={onDistrictSelect}
        />
      )}

      {selectedPlace && (
        <div className="place-detail-wrapper">
          <PlaceDetailCard
            place={selectedPlace}
            boundaries={placeDetailBoundaries}
            onClose={() => {
              setSelectedPlace(null)
              setClickMarker(null)
              setPlaceDetailBoundaries([])
            }}
            onBoundaryClick={(boundary) => {
              console.log("[v0] User clicked boundary from detail card:", boundary)
              // TODO: Có thể thêm logic để vẽ ranh tương ứng
            }}
          />
        </div>
      )}

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: isFullscreen ? "100vh" : height }}
        center={propertyCenter}
        zoom={zoom}
        mapTypeId={mapType}
        onClick={handleMapClickOverride}
        onLoad={onLoad}
        options={{
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {/* Render property boundary */}
        {propertyBoundary && showBoundaryLayer && (
          <Polygon
            paths={propertyBoundary}
            options={{
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#FF0000",
              fillOpacity: boundaryOpacity,
            }}
          />
        )}

        {/* Render admin boundaries từ search */}
        {selectedBoundaries.length > 0 &&
          selectedBoundaries.map((boundary) => (
            <Polygon
              key={boundary.id}
              paths={boundary.coordinates}
              options={{
                strokeColor: boundary.color,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: boundary.color,
                fillOpacity: boundaryOpacities[boundary.id] || 0.5,
              }}
            />
          ))}

        {/* Render click marker */}
        {clickMarker && (
          <Marker position={clickMarker} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 10 }}>
            <InfoWindow position={clickMarker}>
              <div>
                <h4>Điểm được chọn</h4>
                <p>Latitude: {clickMarker.lat}</p>
                <p>Longitude: {clickMarker.lng}</p>
              </div>
            </InfoWindow>
          </Marker>
        )}

        {/* Planning Overlay */}
        <PlanningOverlay
          mapRef={mapRef} // Truyền ref bản đồ
          planningData={planningData} // Truyền đúng tên prop
          showPlanningLayer={showPlanningLayer} // Truyền state hiển thị
          planningOpacity={planningOpacity} // Truyền state độ mờ
        />
      </GoogleMap>

      {/* Thêm Sliders Opacity cho từng lớp boundary được chọn */}
      {selectedBoundaries.length > 0 && (
        <div className="boundary-opacity-panel">
          <h4>Độ mờ các lớp ranh giới</h4>

          {/* THÊM NÚT XÓA TẤT CẢ */}
          <div className="boundary-panel-header">
            <button className="clear-all-btn" onClick={handleClearAllBoundaries}>Xóa tất cả</button>
          </div>

          {selectedBoundaries.map((boundary) => (
            <div key={boundary.id} className="opacity-control-item">
              <label>
                {boundary.name} ({Math.round((boundaryOpacities[boundary.id] || 0.5) * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={boundaryOpacities[boundary.id] || 0.5}
                onChange={(e) =>
                  setBoundaryOpacities((prev) => ({ ...prev, [boundary.id]: Number.parseFloat(e.target.value) }))
                }
              />
              {/* THÊM NÚT TẮT VÀ XÓA TỪNG RANH GIỚI */}
              <div className="opacity-control-buttons">
                <button onClick={() => handleRemoveBoundary(boundary.id)}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GoogleMapComponent