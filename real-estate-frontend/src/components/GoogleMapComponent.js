"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Polygon, Marker, InfoWindow, OverlayView } from "@react-google-maps/api"
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
import { calculatePolygonArea } from "../utils/gisUtils"
import PlanningOverlay from "./PlanningOverlay"
import DirectionsPanel from "./DirectionsPanel"
import NearbyPlacesPanel from "./NearbyPlacesPanel"
import SearchPanel from "./SearchPanel"
import PlaceDetailCard from "./PlaceDetailCard"
import { getPlaceByCoordinates } from "../utils/nominatimService"
import "../styles/GoogleMapComponent.css"
import useGISLogic from "../hooks/useGISLogic"
import usePropertyLogic from "../hooks/usePropertyLogic"

const GOOGLE_MAPS_API_KEY = "AIzaSyDhjP2YOGxpCbsp7HatnQXGsKutiIXwmuo"
const libraries = ["drawing", "geometry", "places"]

const GoogleMapComponent = ({
  center = { lat: 10.8231, lng: 106.6297 },
  zoom = 15,
  propertyBoundary = null,
  propertyArea = null,
  planningData = null,
  height = "500px",
  showControls = true,
  onMapClick = null,
  showMode = "property",
  onBoundaryAdd,
  onDistrictSelect,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const [propertyCenter, setPropertyCenter] = useState(center)
  const [mapType, setMapType] = useState("roadmap")
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true)
  const [showPlanningLayer, setShowPlanningLayer] = useState(false)
  const [boundaryOpacity, setBoundaryOpacity] = useState(0.5)

  const [measurementMode, setMeasurementMode] = useState(false)
  const [measurementPoints, setMeasurementPoints] = useState([])
  const [measurementDistance, setMeasurementDistance] = useState(0)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [showDirections, setShowDirections] = useState(false)
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false)
  const [routeData, setRouteData] = useState(null)
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const polylineRef = useRef(null)
  const markersRef = useRef([])
  const routePolylineRef = useRef(null)
  const [planningOpacity, setPlanningOpacity] = useState(0.7)
  const [showAdminBoundary, setShowAdminBoundary] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [clickPointMode, setClickPointMode] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [placeDetailBoundaries, setPlaceDetailBoundaries] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [clickMarker, setClickMarker] = useState(null)

  const [boundaryCalculatedArea, setBoundaryCalculatedArea] = useState(null)

  const {
    selectedBoundaries,
    boundaryOpacities,
    setBoundaryOpacities,
    handleSearchSelect,
    handleRemoveBoundary,
    handleClearAllBoundaries,
    calculatedArea,
    sortedData,
    mapNameToId,
    handleSelectByCoordinates,
  } = useGISLogic(mapRef, setPlaceDetailBoundaries)

  const {
    selectedProperty,
    setSelectedProperty,
    propertyMarkers,
    relatedProperties,
    fetchProperties,
    handlePropertySelect,
  } = usePropertyLogic(mapRef)

  const onLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  useEffect(() => {
    if (propertyBoundary && propertyBoundary.length >= 3 && isLoaded) {
      // propertyBoundary là mảng [{lat, lng}, ...] - cần chuyển sang format đúng
      const area = calculatePolygonArea([propertyBoundary])
      setBoundaryCalculatedArea(area)
    }
  }, [propertyBoundary, isLoaded])

  const getPolygonCenter = useCallback((coords) => {
    if (!coords || coords.length === 0) return null

    let totalLat = 0
    let totalLng = 0
    const points = Array.isArray(coords[0]) ? coords.flat() : coords

    points.forEach((point) => {
      totalLat += point.lat
      totalLng += point.lng
    })

    return {
      lat: totalLat / points.length,
      lng: totalLng / points.length,
    }
  }, [])

  const handleSearchCommit = async (query) => {
    setSearchLoading(true)
    setSearchError(null)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=1&addressdetails=1`
      const response = await fetch(url)
      const data = await response.json()
      const result = data.length > 0 ? data[0] : null

      if (result) {
        const place = {
          ...result,
          lat: Number.parseFloat(result.lat),
          lng: Number.parseFloat(result.lon || result.lng),
        }
        setSelectedPlace(place)
        setSelectedProperty(null)

        if (mapRef.current) {
          mapRef.current.panTo({ lat: place.lat, lng: place.lng })
          mapRef.current.setZoom(16)
        }

        const address = result.address || {}
        const queryParts = query
          .split(",")
          .map((part) => part.trim())
          .reverse()
        const levels = []

        const level1_name =
          queryParts.length > 0 ? queryParts.shift() : address.state || address.province || address.county || ""

        const level1s = mapNameToId("level1", level1_name, sortedData)
        if (level1s.length > 0) levels.push(...level1s)

        const level1_ids = level1s.map((l) => l.id)
        const level2_name = queryParts.length > 0 ? queryParts.shift() : null
        const level2 =
          level2_name && level1_ids.length > 0 ? mapNameToId("level2", level2_name, sortedData, { level1_ids }) : null
        if (level2) levels.push(level2)

        const level2_ids = level2 ? [level2.id] : []
        const level3_name = queryParts.length > 0 ? queryParts.shift() : null
        const level3 =
          level2_ids.length > 0 && level3_name ? mapNameToId("level3", level3_name, sortedData, { level2_ids }) : null
        if (level3) levels.push(level3)

        await Promise.all(levels.map((level) => handleSearchSelect(level)))
        setPlaceDetailBoundaries(levels)

        const provinceId = level1s.length > 0 ? level1s[0].id : null
        const districtId = level2 ? level2.id : null

        if (provinceId) {
          await fetchProperties(provinceId, districtId)
        }
      } else {
        setSearchError("Không tìm thấy địa điểm.")
      }
    } catch (err) {
      console.error("[v0] Search error:", err)
      setSearchError("Lỗi khi tìm kiếm.")
    } finally {
      setSearchLoading(false)
    }
  }

  const processMapClick = useCallback(
    async (lat, lng) => {
      try {
        // A. Lấy thông tin địa điểm (Nominatim) để hiển thị tên đẹp
        const placeInfo = await getPlaceByCoordinates(lat, lng)
        const place = {
          ...(placeInfo || {}),
          lat,
          lng,
          display_name: placeInfo?.display_name || `Vị trí: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          type: placeInfo?.type || "Selected Location",
        }
        setSelectedPlace(place)
        setSelectedProperty(null)

        // B. Tìm ranh giới GIS bằng tọa độ (PIP) và lấy kết quả
        const foundBoundaries = await handleSelectByCoordinates(lat, lng)

        // C. Nếu tìm được ranh giới, gọi API lấy BĐS
        if (foundBoundaries && foundBoundaries.length > 0) {
          const province = foundBoundaries.find((b) => b.level === 1)
          const district = foundBoundaries.find((b) => b.level === 2)

          if (province) {
            await fetchProperties(province.level1_id, district?.level2_id)
          }
        }
      } catch (err) {
        console.error("[v0] Lỗi xử lý click:", err)
      }
    },
    [handleSelectByCoordinates, fetchProperties, setSelectedPlace, setSelectedProperty],
  )

  const handleMapClickOverride = useCallback(
    async (e) => {
      // 1. Xử lý POI (Click vào icon có sẵn của Google)
      if (e.placeId) {
        e.stop() // Chặn bảng thông tin mặc định của Google

        // Nếu đang đo đạc thì cứ đo tiếp
        if (measurementMode) {
          const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          setMeasurementPoints((prev) => [...prev, newPoint])
          return
        }

        // Logic xử lý giống click điểm thường
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setClickMarker({ lat, lng })

        // Gọi hàm xử lý chính
        await processMapClick(lat, lng)
        return
      }

      // 2. Xử lý đo đạc
      if (measurementMode) {
        const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        setMeasurementPoints((prev) => [...prev, newPoint])
        return
      }

      // 3. Xử lý Click chọn điểm (Click Point Mode)
      if (clickPointMode) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setClickMarker({ lat, lng })

        // Gọi hàm xử lý chính
        await processMapClick(lat, lng)
        return
      }

      // 4. Fallback
      if (onMapClick) onMapClick(e)
      setSelectedPoint(null)
    },
    [measurementMode, clickPointMode, onMapClick, processMapClick],
  )

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    if (measurementPoints.length > 1) {
      let totalDistance = 0
      for (let i = 0; i < measurementPoints.length - 1; i++) {
        totalDistance += calculateDistance(measurementPoints[i], measurementPoints[i + 1])
      }
      setMeasurementDistance(totalDistance)
    } else {
      setMeasurementDistance(0)
    }
  }, [measurementPoints])

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

  const boundaryCenter = propertyBoundary ? getPolygonCenter(propertyBoundary) : null
  // Ưu tiên propertyArea (từ props), sau đó mới dùng boundaryCalculatedArea
  const displayArea = propertyArea || boundaryCalculatedArea

  return (
    <div
      ref={containerRef}
      className={`google-map-container ${isFullscreen ? "fullscreen" : ""}`}
      style={{ height, position: "relative" }}
    >
      {showControls && (
        <div className="map-controls-redesign">
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

          <div className="control-section">
            <div className="control-label">Công cụ</div>
            <button className="icon-button" onClick={toggleFullscreen} title="Toàn màn hình">
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
            <button
              className={`icon-button ${showSearch ? "active" : ""}`}
              onClick={() => setShowSearch(!showSearch)}
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
              onClick={() => setMeasurementMode(!measurementMode)}
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

          {measurementMode && measurementPoints.length > 0 && (
            <div className="measurement-info-compact">
              <div className="measurement-distance">{measurementDistance.toFixed(2)}m</div>
              <button onClick={() => setMeasurementPoints([])} className="clear-btn">
                Xóa
              </button>
            </div>
          )}
        </div>
      )}

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

      {showNearbyPlaces && propertyCenter && (
        <NearbyPlacesPanel propertyCenter={propertyCenter} mapRef={mapRef} onClose={() => setShowNearbyPlaces(false)} />
      )}

      {showSearch && (
        <SearchPanel
          onClose={() => setShowSearch(false)}
          onSearchCommit={handleSearchCommit}
          onToggleClickMode={() => setClickPointMode(!clickPointMode)}
          isClickModeActive={clickPointMode}
          onBoundaryAdd={onBoundaryAdd}
          searchLoading={searchLoading}
          searchError={searchError}
        />
      )}

      {(selectedPlace || selectedProperty) && (
        <div className="place-detail-wrapper">
          <PlaceDetailCard
            place={selectedPlace}
            propertySummary={selectedProperty}
            relatedProperties={relatedProperties}
            boundaries={placeDetailBoundaries}
            onClose={() => {
              setSelectedPlace(null)
              setSelectedProperty(null)
              setClickMarker(null)
              setPlaceDetailBoundaries([])
            }}
            onBoundaryClick={(boundary) => {
              if (boundary.MaTTND) {
                handlePropertySelect(boundary)
              }
            }}
            calculatedArea={calculatedArea}
          />
        </div>
      )}

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
        {propertyBoundary && showBoundaryLayer && (
          <>
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
            {propertyBoundary.map((point, idx) => (
              <Marker
                key={`corner-${idx}`}
                position={point}
                label={{
                  text: `${idx + 1}`,
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: "#FF0000",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                  scale: 12,
                }}
              />
            ))}
            {boundaryCenter && displayArea && (
              <OverlayView position={boundaryCenter} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    padding: "8px",
                    paddingRight:"120px",
                    borderRadius: "4px",
                    border: "1px solid #FF0000",
                    fontWeight: "bold",
                    fontSize: "24px",
                    whiteSpace: "nowrap",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {displayArea.toFixed(2)} m²
                </div>
              </OverlayView>
            )}
          </>
        )}

        {showBoundaryLayer &&
          selectedBoundaries.length > 0 &&
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

        {propertyMarkers.map((property) => {
          const isSelected = selectedProperty?.MaTTND === property.MaTTND
          const lat = Number.parseFloat(property.GPS_Lat || 0)
          const lng = Number.parseFloat(property.GPS_Lng || 0)

          // Bỏ qua nếu không có tọa độ hợp lệ
          if (!lat || !lng) return null

          const markerIcon = isSelected
            ? {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#FF5733",
                fillOpacity: 1.0,
                strokeColor: "#FFFFFF",
                strokeWeight: 4,
                scale: 14,
              }
            : {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#007BFF",
                fillOpacity: 0.8,
                strokeWeight: 0,
                scale: 9,
              }

          return (
            <Marker
              key={property.MaTTND}
              position={{ lat, lng }}
              onClick={() => handlePropertySelect(property)}
              animation={isSelected ? window.google.maps.Animation.BOUNCE : null}
              icon={markerIcon}
            />
          )
        })}

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

        <PlanningOverlay
          mapRef={mapRef}
          planningData={planningData}
          showPlanningLayer={showPlanningLayer}
          planningOpacity={planningOpacity}
        />

        {measurementPoints.length > 0 && (
          <>
            <Polygon
              paths={measurementPoints}
              options={{
                strokeColor: "#0000FF",
                strokeOpacity: 1.0,
                strokeWeight: 2,
                fillOpacity: 0,
              }}
            />
            {measurementPoints.map((pt, idx) => (
              <Marker key={idx} position={pt} label={`${idx + 1}`} />
            ))}
          </>
        )}
      </GoogleMap>

      {selectedBoundaries.length > 0 && (
        <div className="boundary-opacity-panel">
          <h4>Độ mờ các lớp ranh giới</h4>

          <div className="boundary-panel-header">
            <button className="clear-all-btn" onClick={handleClearAllBoundaries}>
              Xóa tất cả
            </button>
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
