"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { FaPlus, FaEllipsisV, FaEdit, FaTrash, FaEye, FaMapMarkerAlt, FaRulerCombined } from "react-icons/fa"
import "../styles/Post.css"

const API_URL = "http://localhost:5000/api"

const Post = () => {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

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

        setProperties(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bài đăng:", error)
        if (error.response) {
          // Server responded with a status other than 2xx
          setError(
            error.response.status === 404
              ? "Không tìm thấy bài đăng."
              : "Lỗi server. Vui lòng thử lại sau."
          );
        } else if (error.request) {
          // Request was made but no response received
          setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        } else {
          // Something else caused the error
          setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
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
      setProperties(properties.filter((property) => property.MaBaiDang !== id))
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
  const handleView = (id) => {
    navigate(`/bat-dong-san/${id}`)
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
          {properties.map((property) => (
            <div key={property.MaBaiDang} className="property-card">
              <div className="property-image-container">
                <img
                  src={
                    property.HinhAnh && property.HinhAnh.length > 0
                      ? property.HinhAnh[0]
                      : "/placeholder.svg?height=200&width=400"
                  }
                  alt={property.TieuDe}
                  className="property-image"
                />
                <span className="property-status">{property.TrangThai || "Đang đăng"}</span>
              </div>
              <div className="property-info">
                <h3 className="property-title">{property.TieuDe}</h3>
                <p className="property-address">
                  <FaMapMarkerAlt className="icon" /> {property.DiaChi}
                </p>
                <div className="property-details">
                  <div className="property-price">{formatPrice(property.Gia)}</div>
                  <div className="property-area">
                    <FaRulerCombined className="icon" /> {property.DienTich} m²
                  </div>
                </div>
                <div className="property-meta">
                  <span className="property-type">{property.LoaiBDS}</span>
                  <span className="property-views">
                    <FaEye className="icon" /> {property.LuotXem || 0}
                  </span>
                </div>

                <div className="property-actions">
                  <button className="action-menu-button" onClick={() => toggleMenu(property.MaBaiDang)}>
                    <FaEllipsisV />
                  </button>

                  {activeMenu === property.MaBaiDang && (
                    <div className="action-menu">
                      <button className="action-item" onClick={() => handleView(property.MaBaiDang)}>
                        <FaEye /> Xem
                      </button>
                      <button className="action-item" onClick={() => handleEdit(property.MaBaiDang)}>
                        <FaEdit /> Chỉnh sửa
                      </button>
                      <button className="action-item delete" onClick={() => setConfirmDelete(property.MaBaiDang)}>
                        <FaTrash /> Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {confirmDelete === property.MaBaiDang && (
                <div className="delete-confirm">
                  <p>Bạn có chắc chắn muốn xóa bài đăng này?</p>
                  <div className="confirm-actions">
                    <button className="confirm-yes" onClick={() => handleDelete(property.MaBaiDang)}>
                      Có
                    </button>
                    <button className="confirm-no" onClick={() => setConfirmDelete(null)}>
                      Không
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Post
