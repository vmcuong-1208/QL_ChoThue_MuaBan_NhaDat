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
  FaFileAlt,
} from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import locationService from "../services/locationService"
import ChatBox from "./ChatBox"
import GoogleMapComponent from "./GoogleMapComponent"
import { loadPlanningData } from "../utils/planningDataLoader"
import PromotionalPopup from "./PromotionalPopup"
import "../styles/PropertyDetail.css"

const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

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
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 10.8231, lng: 106.6297 })
  const sliderRef = useRef(null)

  const [currentDocumentImageIndex, setCurrentDocumentImageIndex] = useState(0)
  const [showDocumentImages, setShowDocumentImages] = useState(false)
  const [planningData, setPlanningData] = useState(null)

  const [showPromotionalPopup, setShowPromotionalPopup] = useState(false)

  const getFullAddress = (property) => {
    if (!property) return ""

    const addressParts = []

    if (property.DiaChi) {
      addressParts.push(property.DiaChi)
    }

    if (locationNames.ward) {
      addressParts.push(locationNames.ward)
    }

    if (locationNames.district) {
      addressParts.push(locationNames.district)
    }

    if (locationNames.province) {
      addressParts.push(locationNames.province)
    }

    return addressParts.join(", ")
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

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

        if (response.data.ToaDoVN2000) {
          try {
            const parsedCoordinates = JSON.parse(response.data.ToaDoVN2000)
            response.data.ToaDoVN2000 = parsedCoordinates
          } catch (e) {
            console.error("Error parsing ToaDoVN2000:", e)
          }
        }

        if (response.data.GPS_Lat && response.data.GPS_Lng) {
          setMapCoordinates({
            lat: Number.parseFloat(response.data.GPS_Lat),
            lng: Number.parseFloat(response.data.GPS_Lng),
          })
        } else if (response.data.ToaDoVN2000?.wgs84Coordinates?.length > 0) {
          setMapCoordinates(response.data.ToaDoVN2000.wgs84Coordinates[0])
        }

        if (response.data.MaNgDung) {
          try {
            console.log(`Đang lấy thông tin người bán có ID: ${response.data.MaNgDung}`)
            const token = localStorage.getItem("token")
            const headers = token ? { Authorization: `Bearer ${token}` } : {}

            const sellerResponse = await axios.get(`${API_URL}/users/${response.data.MaNgDung}`, { headers })
            console.log("Dữ liệu người bán:", sellerResponse.data)

            if (sellerResponse.data.MaNgDung !== currentUser?.MaNgDung) {
              setSeller(sellerResponse.data)
            } else {
              setSeller({
                ...sellerResponse.data,
                HoTen: sellerResponse.data.HoTen + " (Bạn)",
              })
            }
          } catch (error) {
            console.error("Lỗi khi lấy thông tin người bán:", error)
          }
        }

        const locationData = await fetchLocationNames(response.data)
        if (locationData.province && locationData.district) {
          const planning = await loadPlanningData(locationData.province, locationData.district)
          setPlanningData(planning)
          if (!planning) {
            console.log("Không có dữ liệu quy hoạch cho Tỉnh/Huyện này.")
          }
        } else {
          setPlanningData(null)
        }
        setLoading(false)

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

  useEffect(() => {
    if (!currentUser) {
      setShowPromotionalPopup(true)
    }
  }, [currentUser])

  const fetchLocationNames = async (property) => {
    try {
      const locationNamesObj = {}

      if (property.MaTinh) {
        const provinces = await locationService.getProvinces()
        const province = provinces.find((p) => p.MaTinh === Number.parseInt(property.MaTinh))
        if (province) {
          locationNamesObj.province = province.TenTinh

          if (property.MaHuyen) {
            const districts = await locationService.getDistricts(property.MaTinh)
            const district = districts.find((d) => d.MaHuyen === Number.parseInt(property.MaHuyen))
            if (district) {
              locationNamesObj.district = district.TenHuyen



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
      return locationNamesObj
    } catch (error) {
      console.error("Lỗi khi lấy thông tin địa điểm:", error)
      return {}
    }
  }

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

  const handlePrevDocumentImage = () => {
    if (property?.HinhAnhGiayTo?.length > 0) {
      setCurrentDocumentImageIndex((prevIndex) => (prevIndex === 0 ? property.HinhAnhGiayTo.length - 1 : prevIndex - 1))
    }
  }

  const handleNextDocumentImage = () => {
    if (property?.HinhAnhGiayTo?.length > 0) {
      setCurrentDocumentImageIndex((prevIndex) => (prevIndex === property.HinhAnhGiayTo.length - 1 ? 0 : prevIndex + 1))
    }
  }

  const toggleFavorite = async () => {
    if (!currentUser) {
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

  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ"
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu"
    }
    return price.toLocaleString() + " VNĐ"
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.TieuDe,
        text: `Xem bất động sản: ${property?.TieuDe}`,
        url: window.location.href,
      })
    } else {
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

  const boundary = property.ToaDoVN2000?.wgs84Coordinates || null
  const area = property.ToaDoVN2000?.area || property.DienTich
  console.log("Property ToaDoVN2000 (no parse needed):", property.ToaDoVN2000)

  return (
    <div className="property-detail-container">
      {showPromotionalPopup && <PromotionalPopup onClose={() => setShowPromotionalPopup(false)} />}

      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link> &gt; <Link to="/bat-dong-san">Bất động sản</Link> &gt;{" "}
        <span>{property?.TieuDe || `Bất động sản #${id}`}</span>
      </div>

      <div className="property-detail-content">
        <div className="property-detail-main">
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

          {property.HinhAnhGiayTo && property.HinhAnhGiayTo.length > 0 && (
            <div className="property-section">
              <h2 className="section-title">
                <FaFileAlt /> Giấy tờ pháp lý
              </h2>
              <button className="toggle-documents-button" onClick={() => setShowDocumentImages(!showDocumentImages)}>
                {showDocumentImages ? "Ẩn giấy tờ" : "Xem giấy tờ"}
              </button>

              {showDocumentImages && (
                <>
                  <div className="property-image-slider document-slider">
                    <img
                      src={`${SERVER_URL}${property.HinhAnhGiayTo[currentDocumentImageIndex]}`}
                      alt={`Giấy tờ ${currentDocumentImageIndex + 1}`}
                      className="property-detail-image"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=500&width=800"
                      }}
                    />
                    {property.HinhAnhGiayTo.length > 1 && (
                      <>
                        <button className="slider-button prev" onClick={handlePrevDocumentImage}>
                          <FaChevronLeft />
                        </button>
                        <button className="slider-button next" onClick={handleNextDocumentImage}>
                          <FaChevronRight />
                        </button>
                        <div className="image-counter">
                          {currentDocumentImageIndex + 1}/{property.HinhAnhGiayTo.length}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="property-thumbnails">
                    {property.HinhAnhGiayTo.map((image, index) => (
                      <div
                        key={index}
                        className={`thumbnail ${index === currentDocumentImageIndex ? "active" : ""}`}
                        onClick={() => setCurrentDocumentImageIndex(index)}
                      >
                        <img
                          src={`${SERVER_URL}${image}`}
                          alt={`Giấy tờ thumbnail ${index + 1}`}
                          onError={(e) => {
                            e.target.src = "/placeholder.svg?height=80&width=80"
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {property.VideoThuaDat && (
            <div className="property-section">
              <h2 className="section-title">Video thửa đất</h2>
              <div className="property-video">
                <video controls width="100%">
                  <source src={`${SERVER_URL}${property.VideoThuaDat}`} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              </div>
            </div>
          )}

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
            </div>

            <p className="property-address">
              <FaMapMarkerAlt /> {getFullAddress(property)}
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

          <div className="property-section">
            <h2 className="section-title">Mô tả chi tiết</h2>
            <div className="property-description">
              {property.MoTa ? <p>{property.MoTa}</p> : <p className="no-description">Không có mô tả chi tiết.</p>}
            </div>
          </div>

          <div className="property-section">
            <h2 className="section-title">Vị trí trên bản đồ</h2>
            <div className="property-map">
              <GoogleMapComponent
                center={boundary?.[0] || { lat: property.GPS_Lat, lng: property.GPS_Lng }}
                zoom={property.ToaDoVN2000?.wgs84Coordinates ? 18 : 15}
                propertyBoundary={boundary}
                propertyArea={area}
                planningData={planningData}
                height="500px"
                showControls={true}
                showMode="property"
                propertyProvince={property.MaTinh}
                propertyDistrict={property.MaHuyen}
              />
              <p className="map-address">
                <FaMapMarkerAlt /> {getFullAddress(property)}
              </p>
              {property.ToaDoVN2000?.muiChieu && (
                <div className="coordinate-info">
                  <p>
                    <strong>Múi chiếu VN2000:</strong> {property.ToaDoVN2000.muiChieu}
                  </p>
                  {property.ToaDoVN2000.area && (
                    <p>
                      <strong>Diện tích tính từ tọa độ:</strong> {property.ToaDoVN2000.area.toFixed(2)} m²
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="property-detail-sidebar">
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

          <div className="property-actions-card">
            <button className="action-button share" onClick={handleShare}>
              <FaShareAlt /> Chia sẻ
            </button>
            <button className="action-button favorite" onClick={toggleFavorite}>
              {isFavorite ? <FaHeart className="active" /> : <FaRegHeart />} Yêu thích
            </button>
          </div>
        </div>
      </div>

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
