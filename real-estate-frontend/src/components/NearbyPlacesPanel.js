"use client"

import { useState, useEffect } from "react"
import { FaTimes, FaMapMarkerAlt } from "react-icons/fa"
import { searchNearbyPlacesNominatim, getSupportedPOITypes } from "../utils/overpassService"
import { Marker } from "@react-google-maps/api"
import "../styles/NearbyPlacesPanel.css"

const NearbyPlacesPanel = ({ propertyCenter, mapRef, onClose }) => {
  const [fixedPlaces, setFixedPlaces] = useState({
    highway: [],
    school: [],
    market: [],
  })
  const [customPlaces, setCustomPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [radius, setRadius] = useState(2000)
  const [searchType, setSearchType] = useState("school")
  const [selectedPlace, setSelectedPlace] = useState(null)

  const radiusOptions = [
    { value: 1000, label: "1km" },
    { value: 2000, label: "2km" },
    { value: 5000, label: "5km" },
    { value: 10000, label: "10km" },
  ]

  const placeTypes = getSupportedPOITypes()

  useEffect(() => {
    loadFixedPlaces()
  }, [propertyCenter])

  const loadFixedPlaces = async () => {
    setLoading(true)
    try {
      const [highways, schools, markets] = await Promise.all([
        searchNearbyPlacesNominatim(propertyCenter.lat, propertyCenter.lng, "gas_station", 5000),
        searchNearbyPlacesNominatim(propertyCenter.lat, propertyCenter.lng, "school", 5000),
        searchNearbyPlacesNominatim(propertyCenter.lat, propertyCenter.lng, "market", 5000),
      ])

      setFixedPlaces({
        highway: highways.slice(0, 1),
        school: schools.slice(0, 1),
        market: markets.slice(0, 1),
      })
    } catch (err) {
      console.error("Lỗi load fixed places:", err)
    } finally {
      setLoading(false)
    }
  }

  const searchNearbyPlaces = async () => {
    setLoading(true)
    setError(null)
    setCustomPlaces([])

    try {
      const results = await searchNearbyPlacesNominatim(propertyCenter.lat, propertyCenter.lng, searchType, radius)
      setCustomPlaces(results)
      if (results.length === 0) {
        setError("Không tìm thấy địa điểm nào trong bán kính này")
      }
    } catch (err) {
      setError(`Lỗi tìm kiếm: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat, lng) => {
    const R = 6371
    const dLat = ((lat - propertyCenter.lat) * Math.PI) / 180
    const dLng = ((lng - propertyCenter.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((propertyCenter.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(2)} km`
  }

  const sortedCustomPlaces = [...customPlaces].sort((a, b) => {
    const distA = Number.parseFloat(calculateDistance(a.lat, a.lng))
    const distB = Number.parseFloat(calculateDistance(b.lat, b.lng))
    return distA - distB
  })

  const renderPlaceCard = (place) => (
    <div key={place.id} className="place-card">
      <h4>{place.name}</h4>
      <p className="place-type">{place.type}</p>
      <p className="place-distance">
        <strong>{calculateDistance(place.lat, place.lng)}</strong>
      </p>
      <button
        className="map-btn"
        onClick={() => {
          setSelectedPlace(place)
          if (mapRef.current) {
            mapRef.current.panTo({ lat: place.lat, lng: place.lng })
            mapRef.current.setZoom(17)
          }
        }}
      >
        Xem trên bản đồ
      </button>
    </div>
  )

  return (
    <div className="nearby-places-panel">
      <div className="panel-header">
        <h3>
          <FaMapMarkerAlt /> Tham khảo vị trí
        </h3>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="panel-content">
        <div className="fixed-places">
          <div className="place-section">
            <h4>Cao tốc gần nhất</h4>
            {fixedPlaces.highway.length > 0 ? renderPlaceCard(fixedPlaces.highway[0]) : <p>Không tìm thấy</p>}
          </div>
          <div className="place-section">
            <h4>Trường học gần nhất</h4>
            {fixedPlaces.school.length > 0 ? renderPlaceCard(fixedPlaces.school[0]) : <p>Không tìm thấy</p>}
          </div>
          <div className="place-section">
            <h4>Chợ gần nhất</h4>
            {fixedPlaces.market.length > 0 ? renderPlaceCard(fixedPlaces.market[0]) : <p>Không tìm thấy</p>}
          </div>
        </div>

        <hr />

        <div className="search-controls">
          <div className="control-group">
            <label>Loại địa điểm:</label>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              {placeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Bán kính:</label>
            <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
              {radiusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button className="search-btn" onClick={searchNearbyPlaces} disabled={loading}>
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="custom-places">
          {sortedCustomPlaces.length > 0 && <h4>Kết quả tìm kiếm</h4>}
          {sortedCustomPlaces.map(renderPlaceCard)}
        </div>
      </div>

      {[...Object.values(fixedPlaces).flat(), ...customPlaces].map((place) => (
        <Marker
          key={place.id}
          position={{ lat: place.lat, lng: place.lng }}
          title={place.name}
          onClick={() => {
            setSelectedPlace(place)
            if (mapRef.current) {
              mapRef.current.panTo({ lat: place.lat, lng: place.lng })
              mapRef.current.setZoom(17)
            }
          }}
        />
      ))}
    </div>
  )
}

export default NearbyPlacesPanel
