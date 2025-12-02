"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import "../styles/BrokerProfile.css"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000"

const formatPrice = (price) => {
  if (!price) return "Liên hệ"
  if (price >= 1000000000) {
    return (price / 1000000000).toFixed(1) + " tỷ"
  } else if (price >= 1000000) {
    return (price / 1000000).toFixed(0) + " triệu"
  }
  return price.toLocaleString() + " VNĐ"
}

const formatDate = (dateString) => {
  if (!dateString) return "Chưa xác định"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Chưa xác định"
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (e) {
    return "Chưa xác định"
  }
}

const BrokerProfile = () => {
  const { id } = useParams()
  const [broker, setBroker] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBrokerData = async () => {
      try {
        setLoading(true)

        let brokerData = null

        try {
          const brokerResponse = await axios.get(`${API_URL}/users/${id}`, {
            timeout: 5000,
          })

          if (brokerResponse.data && Object.keys(brokerResponse.data).length > 0) {
            brokerData = brokerResponse.data
          }
        } catch (apiError) {
          console.warn("[v0] API /users/{id} failed:", apiError.message)
        }

        if (!brokerData) {
          try {
            const allUsersResponse = await axios.get(`${API_URL}/users`, {
              timeout: 5000,
            })

            const users = Array.isArray(allUsersResponse.data)
              ? allUsersResponse.data
              : allUsersResponse.data.users || []

            brokerData = users.find((u) => u.MaNgDung === id || u.MaNgDung === Number.parseInt(id))

            if (brokerData) {
              console.log("[v0] Found broker in users list:", brokerData)
            }
          } catch (error) {
            console.warn("[v0] Fallback /users failed:", error.message)
          }
        }

        if (!brokerData) {
          throw new Error(`Không thể lấy thông tin người bán có ID: ${id}`)
        }

        setBroker(brokerData)

        let allProperties = []
        try {
          const propertiesResponse = await axios.get(`${API_URL}/properties?MaNgDung=${id}`, {
            timeout: 5000,
          })
          if (Array.isArray(propertiesResponse.data)) {
            allProperties = propertiesResponse.data
          } else if (propertiesResponse.data?.data && Array.isArray(propertiesResponse.data.data)) {
            allProperties = propertiesResponse.data.data
          } else if (propertiesResponse.data?.properties && Array.isArray(propertiesResponse.data.properties)) {
            allProperties = propertiesResponse.data.properties
          } else {
            allProperties = []
          }
        } catch (err) {
          try {
            const allPropsResponse = await axios.get(`${API_URL}/properties`, {
              timeout: 5000,
            })
            if (Array.isArray(allPropsResponse.data)) {
              allProperties = allPropsResponse.data
            } else if (allPropsResponse.data?.data && Array.isArray(allPropsResponse.data.data)) {
              allProperties = allPropsResponse.data.data
            } else if (allPropsResponse.data?.properties && Array.isArray(allPropsResponse.data.properties)) {
              allProperties = allPropsResponse.data.properties
            } else {
              allProperties = []
            }
          } catch (error) {
            allProperties = []
          }
        }

        const filteredProperties = Array.isArray(allProperties)
          ? allProperties.filter((p) => {
              const propertyMaNgDung = String(p.MaNgDung || p.MaGiaoDich || "")
              const sellerId = String(id)
              return propertyMaNgDung === sellerId || propertyMaNgDung === String(Number.parseInt(id))
            })
          : []

        if (filteredProperties.length > 0) {
          console.log("[v0] First property full data:", filteredProperties[0])
          console.log("[v0] All fields:", Object.keys(filteredProperties[0]))
          filteredProperties.forEach((p, idx) => {
            console.log(
              `[v0] Property ${idx} - HinhAnh:`,
              p.HinhAnh,
              "| HinhAnhDaiDien:",
              p.HinhAnhDaiDien,
              "| Anh:",
              p.Anh,
            )
          })
        }

        setProperties(filteredProperties)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching broker data:", err)
        setError(err.message || "Không thể lấy thông tin môi giới. Vui lòng thử lại sau.")
        setBroker(null)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBrokerData()
    }
  }, [id])

  if (loading) {
    return <div className="broker-profile-loading">Đang tải...</div>
  }

  if (error || !broker) {
    return (
      <div className="broker-profile-error">
        <p>{error || "Không tìm thấy thông tin môi giới"}</p>
        <p className="error-hint">ID: {id}</p>
      </div>
    )
  }

  let yearsActive = "N/A"
  let joinedDate = "Chưa xác định"

  if (properties.length > 0) {
    // Lấy bất động sản có NgayTao cũ nhất
    const oldestProperty = properties.reduce((oldest, current) => {
      if (!oldest || !current.NgayTao) return oldest
      const oldestDate = new Date(oldest.NgayTao).getTime()
      const currentDate = new Date(current.NgayTao).getTime()
      return currentDate < oldestDate ? current : oldest
    })

    if (oldestProperty?.NgayTao) {
      try {
        const date = new Date(oldestProperty.NgayTao)
        if (!isNaN(date.getTime())) {
          joinedDate = formatDate(oldestProperty.NgayTao)
          const now = new Date()
          const yearsDiff = now.getFullYear() - date.getFullYear()
          if (yearsDiff > 0) {
            yearsActive = yearsDiff.toString()
          } else {
            yearsActive = "< 1"
          }
        }
      } catch (e) {
        console.log("[v0] Error parsing oldest property date:", e)
      }
    }
  }

  return (
    <div className="broker-profile-container">
      {/* Header */}
      <div className="broker-profile-header">
        <div className="broker-header-content">
          <img
            src={broker.Avatar || broker.AnhDaiDien || "/placeholder.svg?height=120&width=120&query=broker"}
            alt={broker.HoTen || "Broker"}
            className="broker-avatar-large"
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=120&width=120"
            }}
          />
          <div className="broker-header-info">
            <h1>{broker.HoTen || broker.Email || "Không xác định"}</h1>
            <p className="broker-email">{broker.Email}</p>
            <p className="broker-phone">{broker.SDT || broker.SoDienThoai || "Chưa cập nhật"}</p>
            <p className="broker-joined">Tham gia từ {joinedDate}</p>
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="broker-stats">
        <div className="stat-card">
          <div className="stat-label">Năm hoạt động</div>
          <div className="stat-value">{yearsActive}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Số tin đăng</div>
          <div className="stat-value">{properties.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đánh giá</div>
          <div className="stat-value">{broker.DanhGia ? `${broker.DanhGia}/5` : "Chưa có"}</div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="broker-details">
        <div className="detail-section">
          <h2>Thông tin chi tiết</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Họ và tên:</span>
              <span className="detail-value">{broker.HoTen || "Chưa cập nhật"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{broker.Email || "Chưa cập nhật"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Số điện thoại:</span>
              <span className="detail-value">{broker.SDT || broker.SoDienThoai || "Chưa cập nhật"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ngày tham gia:</span>
              <span className="detail-value">{joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Danh sách bất động sản */}
        <div className="detail-section">
          <h2>Bất động sản đang bán ({properties.length})</h2>
          {properties.length > 0 ? (
            <div className="properties-grid">
              {properties.map((property) => {
                const firstImage = property.HinhAnh && property.HinhAnh.length > 0 ? property.HinhAnh[0] : null
                console.log("[v0] Property HinhAnh:", property.HinhAnh)
                console.log("[v0] First image:", firstImage)

                const imageUrl = firstImage ? `${SERVER_URL}${firstImage}` : "/placeholder.svg?height=200&width=300"

                console.log("[v0] Final image URL:", imageUrl)

                return (
                  <div key={property.MaTTND} className="property-card-minimal">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={property.TieuDe || "Bất động sản"}
                      className="property-image"
                      onError={(e) => {
                        console.log("[v0] Image failed to load:", e.target.src)
                        e.target.src = "/placeholder.svg?height=200&width=300"
                      }}
                    />
                    <div className="property-info">
                      <h3>{property.TieuDe || "Chưa có tên"}</h3>
                      <p className="property-price">{formatPrice(property.Gia)}</p>
                      <p className="property-area">{property.DienTich || "N/A"} m²</p>
                      <a href={`/bat-dong-san/${property.MaTTND}`} className="property-link">
                        Xem chi tiết
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="no-properties">Chưa có bất động sản nào</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BrokerProfile
