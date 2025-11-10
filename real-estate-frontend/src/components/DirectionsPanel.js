"use client"

import { useState, useEffect, useRef } from "react"
import { FaTimes, FaRoad, FaMapMarkerAlt, FaLocationArrow, FaCar, FaMotorcycle, FaWalking } from "react-icons/fa"
import { getRouteFromOSRM, formatDistance, formatDuration } from "../utils/osmRoutingService"
import "../styles/DirectionsPanel.css"

const DirectionsPanel = ({ propertyCenter, mapRef, onClose, onRouteChange }) => {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mapClickMode, setMapClickMode] = useState(null)
  const [profile, setProfile] = useState("driving")
  const [originText, setOriginText] = useState("")
  const [destinationText, setDestinationText] = useState("")

  const mapClickListenerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (mapClickListenerRef.current && mapRef?.current) {
        window.google.maps.event.removeListener(mapClickListenerRef.current)
        mapClickListenerRef.current = null
      }
    }
  }, [mapRef])

  const geocodeAddress = async (address, mode) => {
    if (!address) return
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=vn`
      console.log("OSRM Request URL:", url);
      const response = await fetch(url, {
        headers: { "User-Agent": "RealEstateApp/1.0" },
      })
      const data = await response.json()
      if (data.length > 0) {
        const loc = { lat: Number.parseFloat(data[0].lat), lng: Number.parseFloat(data[0].lon) }
        if (mode === "origin") {
          setOrigin(loc)
          setOriginText(address)
        } else {
          setDestination(loc)
          setDestinationText(address)
        }
      } else {
        setError("Không tìm thấy địa chỉ")
      }
    } catch (err) {
      setError("Lỗi tìm địa chỉ: " + err.message)
    }
  }

  useEffect(() => {
    if (origin && destination) {
      console.log("Profile Changed. Recalculating route with profile:", profile);
      calculateDirections()
    } else {
      setRoute(null)
      if (onRouteChange) {
        onRouteChange(null)
      }
    }
  }, [origin, destination, profile])

  const getUserLocation = (mode) => {
    setLoading(true)
    setError(null)
    setRoute(null)
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ Geolocation")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        const coordText = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        if (mode === "origin") {
          setOrigin(location)
          setOriginText(coordText)
        } else if (mode === "destination") {
          setDestination(location)
          setDestinationText(coordText)
        }
        setLoading(false)
      },
      (err) => {
        setError(`Lỗi lấy vị trí: ${err.message}`)
        setLoading(false)
      },
    )
  }

  const handleMapSelection = (mode) => {  
    if (mapClickListenerRef.current) {
      window.google.maps.event.removeListener(mapClickListenerRef.current)
      mapClickListenerRef.current = null
    }

    setMapClickMode(mode)

    if (mapRef?.current) {
      mapClickListenerRef.current = mapRef.current.addListener("click", (e) => {
        const clickedLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        }
        const coordText = `${clickedLocation.lat.toFixed(6)}, ${clickedLocation.lng.toFixed(6)}`
        if (mode === "origin") {
          setOrigin(clickedLocation)
          setOriginText(coordText)
        } else if (mode === "destination") {
          setDestination(clickedLocation)
          setDestinationText(coordText)
        }

        if (mapClickListenerRef.current) {
          window.google.maps.event.removeListener(mapClickListenerRef.current)
          mapClickListenerRef.current = null
        }
        setMapClickMode(null)
      })
    }
  }

  const handleCurrentLocation = (mode) => {
    getUserLocation(mode)
  }

  const handlePropertyLocation = (mode) => {
    const coordText = `${propertyCenter.lat.toFixed(6)}, ${propertyCenter.lng.toFixed(6)}`
    if (mode === "origin") {
      setOrigin(propertyCenter)
      setOriginText(coordText)
    } else if (mode === "destination") {
      setDestination(propertyCenter)
      setDestinationText(coordText)
    }
  }

  const calculateDirections = async () => {
    if (!origin || !destination) {
      setError("Vui lòng chọn điểm đi và điểm đến")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("Calling OSRM with Profile:", profile);
      // KIỂM TRA GIÁ TRỊ CỦA ORIGIN/DESTINATION NGAY TẠI ĐÂY
      if (!origin.lng || !destination.lng) {
          console.error("Origin/Destination objects are invalid.");
          setError("Tọa độ không hợp lệ.");
          setLoading(false);
          return;
      }

      // Đảm bảo profile luôn là string hợp lệ
      const currentProfile = profile || "driving";

      const routeData = await getRouteFromOSRM(origin.lng, origin.lat, destination.lng, destination.lat, currentProfile);
      console.log("OSRM Data Received (Duration):", formatDuration(routeData.duration));
      setRoute(routeData)

      if (routeData?.coordinates && mapRef?.current) {
        const bounds = new window.google.maps.LatLngBounds()
        routeData.coordinates.forEach((coord) => {
          bounds.extend({ lat: coord[1], lng: coord[0] })
        })
        mapRef.current.fitBounds(bounds, { padding: 50 })

        if (onRouteChange) {
          onRouteChange({
            coordinates: routeData.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0],
            })),
            bounds,
          })
        }
      }
    } catch (err) {
      setError(`Không thể tính toán đường đi: ${err.message}`)
      setRoute(null);
    } finally {
      setLoading(false)
    }
  }

  const handleOriginChange = (e) => {
    const value = e.target.value
    setOriginText(value)
    if (value === "") {
      setOrigin(null)
    }
  }

  const handleDestinationChange = (e) => {
    const value = e.target.value
    setDestinationText(value)
    if (value === "") {
      setDestination(null)
    }
  }

  return (
    <div className="directions-panel">
      <div className="panel-header">
        <h3>
          <FaRoad /> Tìm đường
        </h3>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="panel-content">
        {/* Box Điểm đi */}
        <div className="location-box">
          <label className="box-label">
            <FaMapMarkerAlt className="label-icon" /> Điểm đi
          </label>
          <input
            type="text"
            className="location-input"
            value={originText || (origin ? `${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}` : "")}
            placeholder="Nhập địa chỉ hoặc chọn"
            onChange={handleOriginChange}
            onBlur={(e) => {
              if (e.target.value && !origin) {
                geocodeAddress(e.target.value, "origin")
              }
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && e.target.value) {
                geocodeAddress(e.target.value, "origin")
              }
            }}
          />
          <div className="button-group">
            <button className="selection-btn" onClick={() => handleCurrentLocation("origin")} disabled={loading}>
              <FaLocationArrow /> Vị trí hiện tại
            </button>
            <button className="selection-btn" onClick={() => handleMapSelection("origin")} disabled={loading}>
              <FaMapMarkerAlt /> Chọn trên bản đồ
            </button>
            <button className="selection-btn" onClick={() => handlePropertyLocation("origin")} disabled={loading}>
              BĐS
            </button>
          </div>
        </div>

        {origin && (
          <div className="location-box">
            <label className="box-label">
              <FaMapMarkerAlt className="label-icon" /> Điểm đến
            </label>
            <input
              type="text"
              className="location-input"
              value={destinationText || (destination ? `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}` : "")}
              placeholder="Nhập địa chỉ hoặc chọn"
              onChange={handleDestinationChange}
              onBlur={(e) => {
                if (e.target.value && !destination) {
                  geocodeAddress(e.target.value, "destination")
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && e.target.value) {
                  geocodeAddress(e.target.value, "destination")
                }
              }}
            />
            <div className="button-group">
              <button className="selection-btn" onClick={() => handleCurrentLocation("destination")} disabled={loading}>
                <FaLocationArrow /> Vị trí hiện tại
              </button>
              <button className="selection-btn" onClick={() => handleMapSelection("destination")} disabled={loading}>
                <FaMapMarkerAlt /> Chọn trên bản đồ
              </button>
              <button
                className="selection-btn"
                onClick={() => handlePropertyLocation("destination")}
                disabled={loading}
              >
                BĐS
              </button>
            </div>
          </div>
        )}

        <div className="profile-select">
          <label>Chế độ di chuyển:</label>
          <div className="profile-buttons">
            {/* Ô tô (driving) */}
            <button
              className={`profile-btn ${profile === "driving" ? "active" : ""}`}
              onClick={() => setProfile("driving")}
              disabled={loading}
              title="Ô tô"
            >
              <FaCar size={20} />
            </button>
            {/* Xe máy (cycling) - dùng cho các khu vực giao thông hỗn hợp */}
            <button
              className={`profile-btn ${profile === "cycling" ? "active" : ""}`}
              onClick={() => setProfile("cycling")}
              disabled={loading}
              title="Xe máy"
            >
              <FaMotorcycle size={20} />
            </button>
            {/* Đi bộ (walking) */}
            <button
              className={`profile-btn ${profile === "walking" ? "active" : ""}`}
              onClick={() => setProfile("walking")}
              disabled={loading}
              title="Đi bộ"
            >
              <FaWalking size={20} />
            </button>
          </div>
        </div>

        {/* Hint khi đang chọn trên bản đồ */}
        {mapClickMode && (
          <div className="map-click-hint">
            <FaMapMarkerAlt /> Click trên bản đồ để chọn {mapClickMode === "origin" ? "điểm đi" : "điểm đến"}
          </div>
        )}

        {/* Hiển thị lỗi */}
        {error && <div className="error-message">{error}</div>}

        {/* Hiển thị loading */}
        {loading && <div className="loading-message">Đang tính toán...</div>}

        {/* Thông tin route */}
        {route && (
          <div className="directions-info">
            <div className="info-item">
              <span className="label">Khoảng cách:</span>
              <span className="value">{formatDistance(route.distance)}</span>
            </div>
            <div className="info-item">
              <span className="label">Thời gian:</span>
              <span className="value">{formatDuration(route.duration)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DirectionsPanel
