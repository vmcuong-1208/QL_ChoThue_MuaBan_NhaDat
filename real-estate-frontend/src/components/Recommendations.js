"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { FaHeart, FaRegHeart, FaEye, FaMapMarkerAlt, FaRulerCombined, FaLightbulb } from "react-icons/fa"
import "../styles/Recommendations.css"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import locationService from "../services/locationService"

const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

const Recommendations = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [locationNames, setLocationNames] = useState({})
  const [propertyTypes, setPropertyTypes] = useState([])
  const [reason, setReason] = useState("")

  // Lấy danh sách loại nhà đất từ API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        setPropertyTypes(response.data)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại nhà đất:", error)
      }
    }

    fetchPropertyTypes()
  }, [])

  // Lấy gợi ý bất động sản
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)

        if (currentUser) {
          // Nếu đã đăng nhập, lấy gợi ý cá nhân hóa
          const token = localStorage.getItem("token")
          const response = await axios.get(`${API_URL}/recommendations`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          setRecommendations(response.data.recommendations || [])
          setReason(response.data.reason || "Gợi ý cho bạn")
        } else {
          // Nếu chưa đăng nhập, lấy bài đăng phổ biến
          const response = await axios.get(`${API_URL}/properties?limit=20&sort=views-desc`)
          setRecommendations(response.data.properties || [])
          setReason("Bất động sản phổ biến")
        }

        // Lấy thông tin địa điểm
        await fetchLocationNames(recommendations)
      } catch (err) {
        console.error("Lỗi lấy gợi ý:", err)
        // Fallback: lấy bài đăng mới nhất
        try {
          const response = await axios.get(`${API_URL}/properties?limit=20`)
          setRecommendations(response.data.properties || [])
          setReason("Bất động sản mới nhất")
        } catch (fallbackError) {
          console.error("Lỗi fallback:", fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [currentUser])

  // Lấy thông tin địa điểm
  const fetchLocationNames = async (properties) => {
    try {
      const locationNamesObj = {}
      const provinces = await locationService.getProvinces()

      for (const property of properties) {
        if (property.MaTinh) {
          const province = provinces.find((p) => p.MaTinh === Number.parseInt(property.MaTinh))
          if (province) {
            locationNamesObj[`province_${property.MaTinh}`] = province.TenTinh

            if (property.MaHuyen) {
              try {
                const districts = await locationService.getDistricts(property.MaTinh)
                const district = districts.find((d) => d.MaHuyen === Number.parseInt(property.MaHuyen))
                if (district) {
                  locationNamesObj[`district_${property.MaHuyen}`] = district.TenHuyen
                }
              } catch (error) {
                console.error("Lỗi khi lấy thông tin quận/huyện:", error)
              }
            }
          }
        }
      }

      setLocationNames(locationNamesObj)
    } catch (error) {
      console.error("Lỗi khi lấy thông tin địa điểm:", error)
    }
  }

  // Lấy trạng thái yêu thích
  useEffect(() => {
    const checkFavorites = async () => {
      if (!currentUser || recommendations.length === 0) return

      const token = localStorage.getItem("token")
      const favoriteStatuses = {}

      for (const property of recommendations) {
        try {
          const response = await axios.get(`${API_URL}/favorites/check/${property.MaTTND}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          favoriteStatuses[property.MaTTND] = response.data.isFavorite
        } catch (error) {
          console.error("Error checking favorite status:", error)
        }
      }

      setFavorites(
        Object.keys(favoriteStatuses)
          .filter((id) => favoriteStatuses[id])
          .map(Number),
      )
    }

    checkFavorites()
  }, [recommendations, currentUser])

  // Xử lý toggle yêu thích
  const toggleFavorite = async (id) => {
    if (!currentUser) {
      navigate("/auth")
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (favorites.includes(id)) {
        await axios.delete(`${API_URL}/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setFavorites(favorites.filter((favId) => favId !== id))
      } else {
        await axios.post(
          `${API_URL}/favorites/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setFavorites([...favorites, id])
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      alert("Có lỗi xảy ra khi cập nhật yêu thích")
    }
  }

  // Xử lý xem chi tiết
  const handleViewDetails = async (id) => {
    try {
      console.log(`Viewing property details for ID: ${id}`)
      // Tăng lượt xem
      await axios.post(`${API_URL}/properties/${id}/view`, {
        viewerId: currentUser?.MaNgDung,
      })

      navigate(`/bat-dong-san/${id}`)
    } catch (error) {
      console.error("Lỗi khi xử lý xem chi tiết:", error)
      navigate(`/bat-dong-san/${id}`)
    }
  }

  // Utility functions
  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ"
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu"
    }
    return price.toLocaleString() + " VNĐ"
  }

  const getFullAddress = (property) => {
    const addressParts = []
    if (property.DiaChi) addressParts.push(property.DiaChi)
    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`])
    }
    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`])
    }
    return addressParts.join(", ")
  }

  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND)
    return type ? type.TenLoai : "Không xác định"
  }

  if (loading) {
    return <div className="loading-container">Đang tải gợi ý...</div>
  }

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <div className="header-content">
          <FaLightbulb className="recommendation-icon" />
          <div>
            <h2>Bất động sản được gợi ý</h2>
            <p className="recommendation-reason">{reason}</p>
          </div>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <div className="recommendations-grid">
          {recommendations.map((property) => (
            <div key={property.MaTTND} className="property-card">
              <div className="property-image-container">
                <img
                  src={
                    property.HinhAnh && property.HinhAnh.length > 0
                      ? `${SERVER_URL}${property.HinhAnh[0]}`
                      : "/placeholder.svg?height=200&width=400"
                  }
                  alt={property.TieuDe}
                  className="property-image"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=200&width=400"
                  }}
                />
                <button
                  className="favorite-button"
                  onClick={() => toggleFavorite(property.MaTTND)}
                  aria-label={favorites.includes(property.MaTTND) ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                >
                  {favorites.includes(property.MaTTND) ? (
                    <FaHeart className="favorite-icon active" />
                  ) : (
                    <FaRegHeart className="favorite-icon" />
                  )}
                </button>
                <span className="property-status">{property.TrangThai}</span>
                {property.score && property.score > 3 && <span className="recommendation-badge">Phù hợp</span>}
              </div>

              <div className="property-info">
                <h3 className="property-title">{property.TieuDe}</h3>
                <p className="property-address">
                  <FaMapMarkerAlt className="icon" /> {getFullAddress(property)}
                </p>
                <div className="property-details">
                  <div className="property-price">{formatPrice(property.Gia)}</div>
                  <div className="property-area">
                    <FaRulerCombined className="icon" /> {property.DienTich} m²
                  </div>
                </div>
                <div className="property-meta">
                  <span className="property-type">{getPropertyTypeName(property.MaLoaiND)}</span>
                  <span className="property-views">
                    <FaEye className="icon" /> {property.SoLuotXem || 0}
                  </span>
                </div>
                <button className="view-details-button" onClick={() => handleViewDetails(property.MaTTND)}>
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-recommendations">
          <p>Không có gợi ý nào phù hợp lúc này.</p>
        </div>
      )}
    </div>
  )
}

export default Recommendations
