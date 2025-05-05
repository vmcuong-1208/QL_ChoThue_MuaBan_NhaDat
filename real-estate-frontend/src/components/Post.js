"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { FaPlus, FaEllipsisV, FaEdit, FaTrash, FaEye, FaMapMarkerAlt, FaRulerCombined } from "react-icons/fa"
import "../styles/Post.css"
import { useAuth } from "../context/AuthContext"
import locationService from "../services/locationService"
const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000" 
const Post = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [locationNames, setLocationNames] = useState({})
  const [propertyTypes, setPropertyTypes] = useState([])
  useEffect(() => {
    if (!currentUser) {
      navigate("/auth")
    }
  }, [navigate, currentUser])

  // Lấy danh sách loại nhà đất
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setPropertyTypes(response.data)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại nhà đất:", error)
      }
    }

    fetchPropertyTypes()
  }, [])
  // Lấy danh sách bài đăng của người dùng
  useEffect(() => {
    const fetchUserProperties = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          navigate("/auth")
          return
        }

        const response = await axios.get(`${API_URL}/properties/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        // Debug log
        console.log("User properties:", response.data)
        // Lưu danh sách bài đăng
        setProperties(response.data)
        
        // Lấy thông tin địa điểm cho mỗi bài đăng
        const propertiesWithLocations = [...response.data]
        const locationNamesObj = {}

        // Lấy thông tin tỉnh/thành phố
        const provinces = await locationService.getProvinces()

        for (const property of propertiesWithLocations) {
          if (property.MaTinh) {
            // Tìm tên tỉnh
            const province = provinces.find((p) => p.MaTinh === Number.parseInt(property.MaTinh))
            if (province) {
              locationNamesObj[`province_${property.MaTinh}`] = province.TenTinh

              // Lấy thông tin quận/huyện
              if (property.MaHuyen) {
                try {
                  const districts = await locationService.getDistricts(property.MaTinh)
                  const district = districts.find((d) => d.MaHuyen === Number.parseInt(property.MaHuyen))
                  if (district) {
                    locationNamesObj[`district_${property.MaHuyen}`] = district.TenHuyen

                    // Lấy thông tin phường/xã
                    if (property.MaXa) {
                      try {
                        const wards = await locationService.getWards(property.MaHuyen)
                        const ward = wards.find((w) => w.MaXa === Number.parseInt(property.MaXa))
                        if (ward) {
                          locationNamesObj[`ward_${property.MaXa}`] = ward.TenXa
                        }
                      } catch (error) {
                        console.error("Lỗi khi lấy thông tin phường/xã:", error)
                      }
                    }
                  }
                } catch (error) {
                  console.error("Lỗi khi lấy thông tin quận/huyện:", error)
                }
              }
            }
          }
        }

        setLocationNames(locationNamesObj)
        setLoading(false)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bài đăng:", error)
        if (error.response) {
          setError(error.response.status === 404 ? "Không tìm thấy bài đăng." : "Lỗi server. Vui lòng thử lại sau.")
        } else if (error.request) {
          setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.")
        } else {
          setError("Đã xảy ra lỗi. Vui lòng thử lại sau.")
        }
        setLoading(false)
      }
    }

    fetchUserProperties()
  }, [navigate])

  // Xử lý hiển thị menu
  const toggleMenu = (id) => {
    if (activeMenu === id) {
      setActiveMenu(null)
    } else {
      setActiveMenu(id)
    }
  }

  // Xử lý xóa bài đăng
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_URL}/properties/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Cập nhật danh sách sau khi xóa
      setProperties(properties.filter((property) => property.MaTTND !== id))
      setConfirmDelete(null)
    } catch (error) {
      console.error("Lỗi khi xóa bài đăng:", error)
      alert("Không thể xóa bài đăng. Vui lòng thử lại sau.")
    }
  }

  // Xử lý chỉnh sửa bài đăng
  const handleEdit = (id) => {
    navigate(`/chinh-sua-tin/${id}`)
  }

  // Xử lý xem chi tiết bài đăng
  const handleView = async (id) => {
    try {
      // Gọi API tăng lượt xem
      await axios.post(`${API_URL}/properties/${id}/view`)

      // Chuyển đến trang chi tiết
      navigate(`/bat-dong-san/${id}`)
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem:", error)
      // Vẫn chuyển đến trang chi tiết ngay cả khi có lỗi
      navigate(`/bat-dong-san/${id}`)
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

  // Lấy địa chỉ đầy đủ
  const getFullAddress = (property) => {
    const addressParts = []

    // Thêm địa chỉ chi tiết
    if (property.DiaChi) {
      addressParts.push(property.DiaChi)
    }

    // Thêm phường/xã
    if (property.MaXa && locationNames[`ward_${property.MaXa}`]) {
      addressParts.push(locationNames[`ward_${property.MaXa}`])
    }

    // Thêm quận/huyện
    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`])
    }

    // Thêm tỉnh/thành phố
    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`])
    }

    return addressParts.join(", ")
  }
  
  // Lấy tên loại bất động sản
  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND)
    return type ? type.TenLoai : "Không xác định"
  }
  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>
  }

  if (error) {
    return <div className="error-container">{error}</div>
  }

  return (
    <div className="post-management-container">
      <div className="post-management-header">
        <h1>Quản lý bài đăng</h1>
        <Link to="/dang-tin" className="add-post-button">
          <FaPlus /> Đăng tin mới
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="no-posts">
          <p>Bạn chưa có bài đăng nào.</p>
          <Link to="/dang-tin" className="add-first-post-button">
            Đăng tin ngay
          </Link>
        </div>
      ) : (
        <div className="property-list">
          {properties.map((property) => {
            // Debug log để kiểm tra dữ liệu hình ảnh
            console.log(`Property ${property.MaTTND} image:`, property.HinhAnh)

            return (
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
                    console.error(`Error loading image for property ${property.MaTTND}`)
                    e.target.src = "/placeholder.svg?height=200&width=400"
                  }}
                />
                <span className="property-status">{property.TrangThai || "Đang đăng"}</span>
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

                <div className="property-actions">
                  <button className="action-menu-button" onClick={() => toggleMenu(property.MaTTND)}>
                    <FaEllipsisV />
                  </button>

                  {activeMenu === property.MaTTND && (
                    <div className="action-menu">
                      <button className="action-item" onClick={() => handleView(property.MaTTND)}>
                        <FaEye /> Xem
                      </button>
                      <button className="action-item" onClick={() => handleEdit(property.MaTTND)}>
                        <FaEdit /> Chỉnh sửa
                      </button>
                      <button className="action-item delete" onClick={() => setConfirmDelete(property.MaTTND)}>
                        <FaTrash /> Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {confirmDelete === property.MaTTND && (
                <div className="delete-confirm">
                  <p>Bạn có chắc chắn muốn xóa bài đăng này?</p>
                  <div className="confirm-actions">
                    <button className="confirm-yes" onClick={() => handleDelete(property.MaTTND)}>
                      Có
                    </button>
                    <button className="confirm-no" onClick={() => setConfirmDelete(null)}>
                      Không
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}

export default Post
