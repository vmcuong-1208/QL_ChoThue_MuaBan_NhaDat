"use client"

// Component Google Maps chính với 4 layers
import { useState, useCallback, useRef, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Polygon, Polyline, Marker, InfoWindow } from "@react-google-maps/api"
import { FaMap, FaSatellite, FaRuler, FaExpand, FaCompress, FaDrawPolygon, FaLayerGroup } from "react-icons/fa"
import { calculateDistance } from "../utils/coordinateConverter"
import PlanningOverlay from "./PlanningOverlay"
import "../styles/GoogleMapComponent.css"

const GOOGLE_MAPS_API_KEY = "AIzaSyDhjP2YOGxpCbsp7HatnQXGsKutiIXwmuo"

// Các thư viện Google Maps cần load
const libraries = ["drawing", "geometry", "places"]

const GoogleMapComponent = ({
  center = { lat: 10.8231, lng: 106.6297 }, // Mặc định TP.HCM
  zoom = 15,
  propertyBoundary = null, // Tọa độ khung viền thửa đất [{lat, lng}, ...]
  propertyArea = null, // Diện tích thửa đất (m²)
  planningKmzUrl = null, // Deprecated: sử dụng planningData thay vào
  planningData = null, // Thêm prop planningData (JSON Index)
  height = "500px",
  showControls = true,
  onMapClick = null,
}) => {
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  })

  // State quản lý layers
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

  // Ref cho map
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  // State để load KMZ
  const [kmlLayer, setKmlLayer] = useState(null)

  const [planningOpacity, setPlanningOpacity] = useState(0.7)

  // Callback khi map load xong
  const onLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  // Xử lý click trên map (cho công cụ đo)
  const handleMapClick = useCallback(
    (e) => {
      if (measurementMode) {
        const newPoint = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        }
        const newPoints = [...measurementPoints, newPoint]
        setMeasurementPoints(newPoints)

        // Tính tổng khoảng cách
        if (newPoints.length > 1) {
          let totalDistance = 0
          for (let i = 0; i < newPoints.length - 1; i++) {
            totalDistance += calculateDistance(newPoints[i], newPoints[i + 1])
          }
          setMeasurementDistance(totalDistance)
        }
      }

      // Callback tùy chỉnh
      if (onMapClick) {
        onMapClick(e)
      }
    },
    [measurementMode, measurementPoints, onMapClick],
  )

  // Xóa đo đạc
  const clearMeasurement = () => {
    setMeasurementPoints([])
    setMeasurementDistance(0)
    setMeasurementMode(false)
  }

  // Toggle measurement mode
  const toggleMeasurementMode = () => {
    if (measurementMode) {
      clearMeasurement()
    } else {
      setMeasurementMode(true)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Lắng nghe sự kiện fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Tính tâm của boundary để center map
  useEffect(() => {
    if (propertyBoundary && propertyBoundary.length > 0 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds()
      propertyBoundary.forEach((point) => {
        bounds.extend(point)
      })
      mapRef.current.fitBounds(bounds)
    }
  }, [propertyBoundary])

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
          {/* Loại bản đồ */}
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

          {/* Các lớp bản đồ */}
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

            {/* Lớp khung viền */}
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

          {/* Thanh opacity dọc */}
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
            <button
              className={`icon-button ${measurementMode ? "active" : ""}`}
              onClick={toggleMeasurementMode}
              title="Đo khoảng cách"
            >
              <FaRuler />
            </button>
            <button className="icon-button" onClick={toggleFullscreen} title="Toàn màn hình">
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>

          {/* Thông tin đo */}
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

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: isFullscreen ? "100vh" : height }}
        center={center}
        zoom={zoom}
        mapTypeId={mapType}
        onClick={handleMapClick}
        onLoad={onLoad}
        options={{
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {/* Lớp 4: Khung viền thửa đất */}
        {propertyBoundary && showBoundaryLayer && (
          <>
            {/* Polygon với fill */}
            <Polygon
              paths={propertyBoundary}
              options={{
                fillColor: "#FF6B6B",
                fillOpacity: boundaryOpacity * 0.3,
                strokeColor: "#FF0000",
                strokeOpacity: boundaryOpacity,
                strokeWeight: 3,
              }}
            />

            {/* Markers tại các điểm góc */}
            {propertyBoundary.map((point, index) => (
              <Marker
                key={index}
                position={point}
                label={{
                  text: `${index + 1}`,
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#FF0000",
                  fillOpacity: boundaryOpacity,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedPoint({ ...point, index })}
              />
            ))}

            {/* Hiển thị khoảng cách giữa các điểm */}
            {propertyBoundary.map((point, index) => {
              const nextIndex = (index + 1) % propertyBoundary.length
              const nextPoint = propertyBoundary[nextIndex]
              const distance = calculateDistance(point, nextPoint)
              const midPoint = {
                lat: (point.lat + nextPoint.lat) / 2,
                lng: (point.lng + nextPoint.lng) / 2,
              }

              return (
                <Marker
                  key={`distance-${index}`}
                  position={midPoint}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 0,
                  }}
                  label={{
                    text: `${distance.toFixed(2)}m`,
                    color: "#FF0000",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                />
              )
            })}

            {/* Info window cho điểm được chọn */}
            {selectedPoint && (
              <InfoWindow position={selectedPoint} onCloseClick={() => setSelectedPoint(null)}>
                <div className="point-info">
                  <h4>Điểm {selectedPoint.index + 1}</h4>
                  <p>
                    Lat: {selectedPoint.lat.toFixed(6)}
                    <br />
                    Lng: {selectedPoint.lng.toFixed(6)}
                  </p>
                </div>
              </InfoWindow>
            )}

            {/* Hiển thị diện tích ở tâm */}
            {propertyArea && (
              <Marker
                position={center}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 0,
                }}
                label={{
                  text: `${propertyArea.toFixed(2)} m²`,
                  color: "#FF0000",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              />
            )}
          </>
        )}

        {/* Công cụ đo: Hiển thị các điểm và đường nối */}
        {measurementMode && measurementPoints.length > 0 && (
          <>
            {/* Markers cho các điểm đo */}
            {measurementPoints.map((point, index) => (
              <Marker
                key={`measure-${index}`}
                position={point}
                label={{
                  text: `${index + 1}`,
                  color: "white",
                  fontSize: "12px",
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                }}
              />
            ))}

            {/* Đường nối các điểm đo */}
            {measurementPoints.length > 1 && (
              <Polyline
                key={`polyline-${measurementPoints.length}`}
                path={measurementPoints}
                options={{
                  strokeColor: "#4285F4",
                  strokeOpacity: 1,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
            )}
          </>
        )}

        {/* Lớp 3: Quy hoạch (KMZ) */}
        {showPlanningLayer && planningData && (
          <PlanningOverlay
            mapRef={mapRef}
            planningData={planningData}
            showPlanningLayer={showPlanningLayer}
            planningOpacity={planningOpacity}
          />
        )}
      </GoogleMap>

      {/* Hướng dẫn sử dụng công cụ đo */}
      {measurementMode && (
        <div className="measurement-guide">
          <p>Click trên bản đồ để đo khoảng cách. Click "Xóa" để bắt đầu lại.</p>
        </div>
      )}
    </div>
  )
}

export default GoogleMapComponent
