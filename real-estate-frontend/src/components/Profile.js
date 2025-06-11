"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPen, FaCheck, FaTimes } from "react-icons/fa"
import "../styles/Profile.css"
import PaymentModal from "./PaymentModal"

const Profile = () => {
  const { currentUser, updateProfile, loading, loadUserInfo, token } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    HoTen: "",
    SDT: "",
    DiaChi: "",
    MoTaBanThan: "",
    AnhDaiDien: null,
  })
  const [previewImage, setPreviewImage] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Load user info when component mounts or when user changes
  useEffect(() => {
    const loadData = async () => {
      if (token && !currentUser) {
        await loadUserInfo(token)
      }
    }
    loadData()
  }, [token, currentUser, loadUserInfo])

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        HoTen: currentUser.HoTen || "",
        SDT: currentUser.SDT || "",
        DiaChi: currentUser.DiaChi || "",
        MoTaBanThan: currentUser.MoTaBanThan || "",
        AnhDaiDien: null, // Always null for file input
      })
      // Chỉ hiển thị avatar nếu có và là local file
      setPreviewImage(currentUser.AnhDaiDien || "")
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/auth")
    }
  }, [currentUser, loading, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPreviewImage(URL.createObjectURL(file))
      setFormData({
        ...formData,
        AnhDaiDien: file,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const formDataToSend = new FormData()

      // Thêm tất cả các field vào FormData
      formDataToSend.append("HoTen", formData.HoTen)
      formDataToSend.append("SDT", formData.SDT)
      formDataToSend.append("DiaChi", formData.DiaChi)
      formDataToSend.append("MoTaBanThan", formData.MoTaBanThan)

      // Chỉ thêm file nếu user đã chọn file mới
      if (formData.AnhDaiDien instanceof File) {
        formDataToSend.append("AnhDaiDien", formData.AnhDaiDien)
      }

      await updateProfile(formDataToSend)
      setIsEditing(false)
      alert("Cập nhật thông tin thành công!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Có lỗi xảy ra khi cập nhật thông tin!")
    }
  }

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        HoTen: currentUser.HoTen || "",
        SDT: currentUser.SDT || "",
        DiaChi: currentUser.DiaChi || "",
        MoTaBanThan: currentUser.MoTaBanThan || "",
        AnhDaiDien: null,
      })
      setPreviewImage(currentUser.AnhDaiDien || "")
    }
    setIsEditing(false)
  }

  const handleUpgradeToBroker = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (token, method) => {
    try {
      // Call API to upgrade account
      const formDataToSend = new FormData()
      formDataToSend.append("paymentToken", token)
      formDataToSend.append("paymentMethod", method)
      formDataToSend.append("upgradeType", "broker")

      await updateProfile(formDataToSend)
      alert("Nâng cấp tài khoản thành công! Bạn đã trở thành môi giới.")
    } catch (error) {
      alert("Có lỗi xảy ra khi nâng cấp tài khoản. Vui lòng liên hệ hỗ trợ.")
    }
  }

  if (loading) {
    return <div className="loading-container">Đang tải...</div>
  }

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <h1>Thông tin cá nhân</h1>
        </div>
        <div className="profile-message error">Bạn cần đăng nhập để xem thông tin cá nhân.</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Thông tin cá nhân</h1>
        <div className="profile-header-actions">
          {currentUser?.LoaiTaiKhoan?.toLowerCase() === "thường" && (
            <button className="upgrade-button" onClick={handleUpgradeToBroker}>
              Trở thành môi giới
            </button>
          )}
          {!isEditing && (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              <FaPen /> Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <img
              src={previewImage || "https://via.placeholder.com/150"}
              alt="Avatar"
              className="avatar-image"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150"
              }}
            />
            {isEditing && (
              <label className="avatar-upload">
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                <FaPen /> {previewImage ? "Thay đổi" : "Thêm ảnh"}
              </label>
            )}
          </div>
          <div className="profile-basic-info">
            <h2>{currentUser.HoTen || currentUser.Email}</h2>
            <p className="user-role">{currentUser.LoaiTaiKhoan || "Người dùng"}</p>
            <p className="user-email">
              <FaEnvelope /> {currentUser.Email}
            </p>
            {!currentUser.AnhDaiDien && (
              <p className="avatar-note">
                <small>💡 Bạn có thể thêm ảnh đại diện bằng cách nhấn "Chỉnh sửa"</small>
              </p>
            )}
          </div>
        </div>

        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="HoTen">Họ và tên</label>
                <input
                  type="text"
                  id="HoTen"
                  name="HoTen"
                  value={formData.HoTen}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-group">
                <label htmlFor="SDT">Số điện thoại</label>
                <input
                  type="tel"
                  id="SDT"
                  name="SDT"
                  value={formData.SDT}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label htmlFor="DiaChi">Địa chỉ</label>
                <input
                  type="text"
                  id="DiaChi"
                  name="DiaChi"
                  value={formData.DiaChi}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="form-group">
                <label htmlFor="MoTaBanThan">Giới thiệu bản thân</label>
                <textarea
                  id="MoTaBanThan"
                  name="MoTaBanThan"
                  value={formData.MoTaBanThan}
                  onChange={handleChange}
                  placeholder="Viết giới thiệu ngắn về bản thân"
                  rows="4"
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  <FaTimes /> Hủy
                </button>
                <button type="submit" className="save-button">
                  <FaCheck /> Lưu
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <div className="info-label">
                  <FaUser /> Họ và tên
                </div>
                <div className="info-value">{currentUser.HoTen || "Chưa cập nhật"}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <FaPhone /> Số điện thoại
                </div>
                <div className="info-value">{currentUser.SDT || "Chưa cập nhật"}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <FaMapMarkerAlt /> Địa chỉ
                </div>
                <div className="info-value">{currentUser.DiaChi || "Chưa cập nhật"}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Giới thiệu bản thân</div>
                <div className="info-value bio">{currentUser.MoTaBanThan || "Chưa cập nhật"}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        amount={500000}
        purpose="Nâng cấp tài khoản môi giới"
      />
    </div>
  )
}

export default Profile
