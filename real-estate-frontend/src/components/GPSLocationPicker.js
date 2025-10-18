"use client"

// Component để lấy GPS location từ thiết bị
import { useState } from "react"
import { FaMapMarkerAlt, FaSpinner } from "react-icons/fa"
import "../styles/GPSLocationPicker.css"

const GPSLocationPicker = ({ onLocationChange, initialLat = "", initialLng = "" }) => {
  const [lat, setLat] = useState(initialLat)
  const [lng, setLng] = useState(initialLng)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Hàm lấy vị trí hiện tại từ GPS
  const getCurrentLocation = () => {
    // Kiểm tra trình duyệt có hỗ trợ Geolocation API không
    if (!navigator.geolocation) {
      setError("Trình duyệt của bạn không hỗ trợ định vị GPS")
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        setLat(latitude.toFixed(6))
        setLng(longitude.toFixed(6))

        // Gọi callback để cập nhật parent component
        if (onLocationChange) {
          onLocationChange({
            lat: latitude,
            lng: longitude,
          })
        }

        setLoading(false)
        console.log("[v0] GPS Location obtained:", { latitude, longitude })
      },
      // Error callback
      (error) => {
        setLoading(false)
        let errorMessage = "Không thể lấy vị trí GPS"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Thông tin vị trí không khả dụng"
            break
          case error.TIMEOUT:
            errorMessage = "Yêu cầu lấy vị trí đã hết thời gian chờ"
            break
          default:
            errorMessage = "Đã xảy ra lỗi không xác định khi lấy vị trí"
        }

        setError(errorMessage)
        console.error("[v0] GPS Error:", error)
      },
      // Options
      {
        enableHighAccuracy: true, // Yêu cầu độ chính xác cao
        timeout: 10000, // Timeout sau 10 giây
        maximumAge: 0, // Không sử dụng cache
      },
    )
  }

  return (
    <div className="gps-location-picker">
      <div className="gps-header">
        <h4>Vị trí GPS (tùy chọn)</h4>
        <button type="button" className="get-location-btn" onClick={getCurrentLocation} disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className="spinner" /> Đang lấy vị trí...
            </>
          ) : (
            <>
              <FaMapMarkerAlt /> Lấy vị trí hiện tại
            </>
          )}
        </button>
      </div>

      {error && <div className="gps-error">{error}</div>}

      <div className="gps-coordinates">
        <div className="gps-field">
          <label>Latitude (Vĩ độ)</label>
          <input type="text" value={lat} readOnly placeholder="VD: 10.762622" className="readonly-field" />
        </div>

        <div className="gps-field">
          <label>Longitude (Kinh độ)</label>
          <input type="text" value={lng} readOnly placeholder="VD: 106.660172" className="readonly-field" />
        </div>
      </div>

      <div className="gps-hint">
        <FaMapMarkerAlt /> Click "Lấy vị trí hiện tại" để tự động điền tọa độ GPS từ thiết bị của bạn. Trình duyệt sẽ
        yêu cầu quyền truy cập vị trí.
      </div>
    </div>
  )
}

export default GPSLocationPicker
