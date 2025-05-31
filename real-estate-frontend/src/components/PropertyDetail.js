"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import {
  FaMapMarkerAlt,
  FaRulerCombined,
  FaCalendarAlt,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaPhone,
  FaEnvelope,
  FaChevronLeft,
  FaChevronRight,
  FaShareAlt,
  FaCommentDots,
  FaCheckCircle,
} from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import locationService from "../services/locationService"
import ChatBox from "./ChatBox"
import "../styles/PropertyDetail.css"

const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

const mapContainerStyle = {
  width: "100%",
  height: "400px",
}

const PropertyDetail = () => {
  const { id } = useParams()
  console.log("Property ID from URL:", id)
  const { currentUser } = useAuth()
  const [property, setProperty] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [locationNames, setLocationNames] = useState({})
  const [relatedProperties, setRelatedProperties] = useState([])
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 10.8231, lng: 106.6297 }) // Mặc định TP.HCM
  const sliderRef = useRef(null)

  // Lấy thông tin chi tiết bất động sản
  useEffect(() => {
    const fetchPropertyDetail = async () => {
      if (!id) {
        console.error("No property ID found in URL")
        setError("Không tìm thấy ID bất động sản")
        setLoading(false)

        return
      }
      try {
        setLoading(true)
        console.log(`Fetching property details for ID: ${id}`)
        const response = await axios.get(`${API_URL}/properties/${id}`)
        console.log("Property data:", response.data)

        if (!response.data) {
          setError("Không tìm thấy thông tin bất động sản")
          setLoading(false)
          return
        }

        setProperty(response.data)

        // Lấy thông tin người bán
        if (response.data.MaNgDung) {
          try {
            console.log(`Đang lấy thông tin người bán có ID: ${response.data.MaNgDung}`)
            const token = localStorage.getItem("token")
            const headers = token ? { Authorization: `Bearer ${token}` } : {}

            const sellerResponse = await axios.get(`${API_URL}/users/${response.data.MaNgDung}`, { headers })
            console.log("Dữ liệu người bán:", sellerResponse.data)

            // Kiểm tra xem người bán có phải là người dùng hiện tại không
            if (sellerResponse.data.MaNgDung !== currentUser?.MaNgDung) {
              setSeller(sellerResponse.data)
            } else {
              // Nếu người bán là người dùng hiện tại, hiển thị thông tin phù hợp
              setSeller({
                ...sellerResponse.data,
                HoTen: sellerResponse.data.HoTen + " (Bạn)",
              })
            }
          } catch (error) {
            console.error("Lỗi khi lấy thông tin người bán:", error)
          }
        }

        // Lấy thông tin địa điểm
        await fetchLocationNames(response.data)

        // Kiểm tra xem bất động sản có trong danh sách yêu thích không
        // const savedFavorites = localStorage.getItem("propertyFavorites")
        // if (savedFavorites) {
        //   const favorites = JSON.parse(savedFavorites)
        //   setIsFavorite(favorites.includes(Number.parseInt(id)))
        // }

        setLoading(false)

        // Thêm vào cuối hàm fetchPropertyDetail, sau setLoading(false)
        // Lưu lịch sử xem nếu đã đăng nhập
        if (currentUser && response.data) {
          try {
            const token = localStorage.getItem("token")
            await axios.post(
              `${API_URL}/recommendations/view-history`,
              { propertyId: id },
              { headers: { Authorization: `Bearer ${token}` } },
            )
            console.log("View history saved")
          } catch (error) {
            console.error("Error saving view history:", error)
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin chi tiết:", error)
        setError("Không thể tải thông tin bất động sản. Vui lòng thử lại sau.")
        setLoading(false)
      }
    }

    fetchPropertyDetail()
  }, [id])

  // Thay thế useEffect cho favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !id) return

      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/favorites/check/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setIsFavorite(response.data.isFavorite)
      } catch (error) {
        console.error("Error checking favorite status:", error)
      }
    }

    checkFavoriteStatus()
  }, [id, currentUser])

  // Lấy thông tin địa điểm
  const fetchLocationNames = async (property) => {
    try {
      const locationNamesObj = {}

      // Lấy thông tin tỉnh/thành phố
      if (property.MaTinh) {
        const provinces = await locationService.getProvinces()
        const province = provinces.find((p) => p.MaTinh === Number.parseInt(property.MaTinh))
        if (province) {
          locationNamesObj.province = province.TenTinh

          // Lấy thông tin quận/huyện
          if (property.MaHuyen) {
            const districts = await locationService.getDistricts(property.MaTinh)
            const district = districts.find((d) => d.MaHuyen === Number.parseInt(property.MaHuyen))
            if (district) {
              locationNamesObj.district = district.TenHuyen

              // Lấy thông tin phường/xã
              if (property.MaXa) {
                const wards = await locationService.getWards(property.MaHuyen)
                const ward = wards.find((w) => w.MaXa === Number.parseInt(property.MaXa))
                if (ward) {
                  locationNamesObj.ward = ward.TenXa
                }
              }
            }
          }
        }
      }

      setLocationNames(locationNamesObj)

      // Giả lập tọa độ dựa trên địa chỉ (trong thực tế nên dùng Geocoding API)
      // Đây chỉ là ví dụ, bạn nên thay thế bằng tọa độ thực từ API
      setMapCoordinates({
        lat: 10.8231 + Math.random() * 0.1,
        lng: 106.6297 + Math.random() * 0.1,
      })
    } catch (error) {
      console.error("Lỗi khi lấy thông tin địa điểm:", error)
    }
  }

  // Xử lý chuyển ảnh
  const handlePrevImage = () => {
    if (property?.HinhAnh?.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? property.HinhAnh.length - 1 : prevIndex - 1))
    }
  }

  const handleNextImage = () => {
    if (property?.HinhAnh?.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex === property.HinhAnh.length - 1 ? 0 : prevIndex + 1))
    }
  }

  // Xử lý thêm/xóa yêu thích
  const toggleFavorite = async () => {
    if (!currentUser) {
      // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
      window.location.href = "/auth"
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setIsFavorite(false)
      } else {
        await axios.post(
          `${API_URL}/favorites/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setIsFavorite(true)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      alert("Có lỗi xảy ra khi cập nhật yêu thích")
    }
  }

  // Định dạng giá tiền
  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ"
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu"
    }
    return price.toLocaleString() + " VNĐ"
  }

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Lấy địa chỉ đầy đủ
  const getFullAddress = () => {
    if (!property) return ""

    const addressParts = []

    // Thêm địa chỉ chi tiết
    if (property.DiaChi) {
      addressParts.push(property.DiaChi)
    }

    // Thêm phường/xã
    if (locationNames.ward) {
      addressParts.push(locationNames.ward)
    }

    // Thêm quận/huyện
    if (locationNames.district) {
      addressParts.push(locationNames.district)
    }

    // Thêm tỉnh/thành phố
    if (locationNames.province) {
      addressParts.push(locationNames.province)
    }

    return addressParts.join(", ")
  }

  // Xử lý chia sẻ
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.TieuDe,
        text: `Xem bất động sản: ${property?.TieuDe}`,
        url: window.location.href,
      })
    } else {
      // Fallback: Copy link to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Đã sao chép liên kết vào clipboard!")
    }
  }

  if (loading) {
    return (
      <div className="property-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin bất động sản...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="property-detail-error">
        <p>{error}</p>
        <Link to="/bat-dong-san" className="back-button">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="property-detail-error">
        <p>Không tìm thấy thông tin bất động sản.</p>
        <Link to="/bat-dong-san" className="back-button">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="property-detail-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link> &gt; <Link to="/bat-dong-san">Bất động sản</Link> &gt;{" "}
        <span>{property?.TieuDe || `Bất động sản #${id}`}</span>
      </div>

      <div className="property-detail-content">
        <div className="property-detail-main">
          {/* Slider hình ảnh */}
          <div className="property-image-slider" ref={sliderRef}>
            {property.HinhAnh && property.HinhAnh.length > 0 ? (
              <>
                <img
                  src={`${SERVER_URL}${property.HinhAnh[currentImageIndex]}`}
                  alt={`Hình ảnh ${currentImageIndex + 1} của ${property.TieuDe}`}
                  className="property-detail-image"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=500&width=800"
                  }}
                />
                {property.HinhAnh.length > 1 && (
                  <>
                    <button className="slider-button prev" onClick={handlePrevImage}>
                      <FaChevronLeft />
                    </button>
                    <button className="slider-button next" onClick={handleNextImage}>
                      <FaChevronRight />
                    </button>
                    <div className="image-counter">
                      {currentImageIndex + 1}/{property.HinhAnh.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <img
                src="/placeholder.svg?height=500&width=800"
                alt="Không có hình ảnh"
                className="property-detail-image"
              />
            )}
          </div>

          {/* Thumbnails */}
          {property.HinhAnh && property.HinhAnh.length > 1 && (
            <div className="property-thumbnails">
              {property.HinhAnh.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${index === currentImageIndex ? "active" : ""}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={`${SERVER_URL}${image}`}
                    alt={`Thumbnail ${index + 1}`}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=80&width=80"
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Thông tin chính */}
          <div className="property-main-info">
            <div className="property-header">
              <div className="property-title-section">
                <h1 className="property-title">{property.TieuDe}</h1>
                {property.TrangThaiXacThuc === "đã xác thực" && (
                  <div className="verified-badge" title="Bất động sản đã được xác thực">
                    <FaCheckCircle />
                    <span>Đã xác thực</span>
                  </div>
                )}
              </div>
              <div className="property-actions">
                <button className="action-button share" onClick={handleShare}>
                  <FaShareAlt /> Chia sẻ
                </button>
                <button className="action-button favorite" onClick={toggleFavorite}>
                  {isFavorite ? <FaHeart className="active" /> : <FaRegHeart />} Yêu thích
                </button>
              </div>
            </div>

            <p className="property-address">
              <FaMapMarkerAlt /> {getFullAddress()}
            </p>

            <div className="property-price-area">
              <div className="property-price">{formatPrice(property.Gia)}</div>
              <div className="property-area">
                <FaRulerCombined /> {property.DienTich} m²
              </div>
            </div>

            <div className="property-meta-info">
              <div className="meta-item">
                <FaCalendarAlt className="meta-icon" />
                <span>Đăng ngày: {formatDate(property.NgayTao)}</span>
              </div>
              <div className="meta-item">
                <FaEye className="meta-icon" />
                <span>{property.SoLuotXem || 0} lượt xem</span>
              </div>
              <div className="meta-item status">
                <span className={`status-badge ${property.TrangThai}`}>{property.TrangThai}</span>
              </div>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="property-section">
            <h2 className="section-title">Mô tả chi tiết</h2>
            <div className="property-description">
              {property.MoTa ? <p>{property.MoTa}</p> : <p className="no-description">Không có mô tả chi tiết.</p>}
            </div>
          </div>

          {/* Bản đồ */}
          <div className="property-section">
            <h2 className="section-title">Vị trí trên bản đồ</h2>
            <div className="property-map">
              {property.GoogleMapIframe ? (
                <div className="google-map-iframe" dangerouslySetInnerHTML={{ __html: property.GoogleMapIframe }}></div>
              ) : (
                <div className="no-map-container">
                  <FaMapMarkerAlt className="no-map-icon" />
                  <p>Không có bản đồ cho bất động sản này</p>
                </div>
              )}
              <p className="map-address">
                <FaMapMarkerAlt /> {getFullAddress()}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="property-detail-sidebar">
          {/* Thông tin người bán */}
          <div className="seller-info">
            <div className="seller-header">
              <div className="seller-avatar">
                <img
                  src={seller?.AnhDaiDien || "/placeholder.svg?height=60&width=60"}
                  alt={seller?.HoTen || "Người bán"}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=60&width=60"
                  }}
                />
              </div>
              <div className="seller-name-role">
                <h3>{seller?.HoTen || "Người bán"}</h3>
                <span className="seller-role">{seller?.LoaiTaiKhoan || "Người dùng"}</span>
              </div>
            </div>

            <div className="seller-contact">
              {seller?.SDT && (
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <span>{seller.SDT}</span>
                </div>
              )}
              {seller?.Email && (
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <span>{seller.Email}</span>
                </div>
              )}
            </div>

            <button className="chat-button" onClick={() => setShowChat(true)}>
              <FaCommentDots /> Nhắn tin cho người bán
            </button>
          </div>

          {/* Thông tin chi tiết */}
          <div className="property-details-card">
            <h3>Thông tin chi tiết</h3>
            <ul className="details-list">
              <li>
                <span className="detail-label">Loại bất động sản:</span>
                <span className="detail-value">{property.LoaiBDS || "Không xác định"}</span>
              </li>
              <li>
                <span className="detail-label">Diện tích:</span>
                <span className="detail-value">{property.DienTich} m²</span>
              </li>
              <li>
                <span className="detail-label">Giá:</span>
                <span className="detail-value">{formatPrice(property.Gia)}</span>
              </li>
              <li>
                <span className="detail-label">Trạng thái:</span>
                <span className="detail-value status">{property.TrangThai}</span>
              </li>
              <li>
                <span className="detail-label">Ngày đăng:</span>
                <span className="detail-value">{formatDate(property.NgayTao)}</span>
              </li>
              <li>
                <span className="detail-label">Cập nhật:</span>
                <span className="detail-value">
                  {property.NgayCapNhat ? formatDate(property.NgayCapNhat) : "Chưa cập nhật"}
                </span>
              </li>
              <li>
                <span className="detail-label">Mã tin:</span>
                <span className="detail-value">BDS{property.MaTTND}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chat box */}
      {showChat && (
        <ChatBox
          sellerId={property.MaNgDung}
          propertyId={property.MaTTND}
          propertyTitle={property.TieuDe}
          sellerName={seller?.HoTen || "Người bán"}
          sellerAvatar={seller?.AnhDaiDien}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  )
}

export default PropertyDetail
