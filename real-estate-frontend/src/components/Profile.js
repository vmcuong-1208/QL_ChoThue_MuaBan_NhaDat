"use client"

import { useState, useEffect } from "react"
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPen, FaCheck, FaTimes } from "react-icons/fa"
import "../styles/Profile.css"
import axios from "axios"

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [formData, setFormData] = useState({
    HoTen: "",
    SDT: "",
    DiaChi: "",
    MoTaBanThan: "",
    AnhDaiDien: "",
  })
  const [previewImage, setPreviewImage] = useState("")

  // Lấy thông tin người dùng từ API
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = response.data;
        const fullImageUrl = user.AnhDaiDien ? `http://localhost:5000${user.AnhDaiDien}` : "";
        setCurrentUser(user);
        setFormData({
          HoTen: user.HoTen || "",
          SDT: user.SDT || "",
          DiaChi: user.DiaChi || "",
          MoTaBanThan: user.MoTaBanThan || "",
          AnhDaiDien: user.AnhDaiDien || "",
        });
        setPreviewImage(fullImageUrl);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        setMessage({ type: "error", text: "Không thể tải thông tin người dùng." });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Xử lý thay đổi ảnh đại diện
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

  // Xử lý lưu thông tin
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const token = localStorage.getItem("token")
      const formDataToSend = new FormData()
      formDataToSend.append("HoTen", formData.HoTen)
      formDataToSend.append("DiaChi", formData.DiaChi)
      formDataToSend.append("MoTaBanThan", formData.MoTaBanThan)
      if (formData.AnhDaiDien instanceof File) {
        formDataToSend.append("AnhDaiDien", formData.AnhDaiDien)
      }

      const response = await axios.put(
        "http://localhost:5000/api/auth/update", // Thay URL này bằng endpoint backend thực tế
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      )

      const updatedUser = response.data
      localStorage.setItem("userInfo", JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" })
      setIsEditing(false)
    } catch (error) {
      console.error("Lỗi cập nhật:", error)
      setMessage({ type: "error", text: "Có lỗi xảy ra khi cập nhật thông tin." })
    } finally {
      setLoading(false)
    }
  }

  // Hủy chỉnh sửa
  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        HoTen: currentUser.HoTen || "",
        SDT: currentUser.SDT || "",
        DiaChi: currentUser.DiaChi || "",
        MoTaBanThan: currentUser.MoTaBanThan || "",
        AnhDaiDien: currentUser.AnhDaiDien || "",
      })
      setPreviewImage(currentUser.AnhDaiDien || "")
    }
    setIsEditing(false)
    setMessage({ type: "", text: "" })
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
        {!isEditing && (
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            <FaPen /> Chỉnh sửa
          </button>
        )}
      </div>

      {message.text && <div className={`profile-message ${message.type}`}>{message.text}</div>}

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <img src={previewImage || "https://via.placeholder.com/150"} alt="Avatar" className="avatar-image" />
            {isEditing && (
              <label className="avatar-upload">
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                <FaPen /> Thay đổi
              </label>
            )}
          </div>
          <div className="profile-basic-info">
            <h2>{currentUser.HoTen || currentUser.Email}</h2>
            <p className="user-role">{currentUser.LoaiTaiKhoan || "Người dùng"}</p>
            <p className="user-email">
              <FaEnvelope /> {currentUser.Email}
            </p>
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
                <button type="button" className="cancel-button" onClick={handleCancel} disabled={loading}>
                  <FaTimes /> Hủy
                </button>
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? (
                    <span className="spinner"></span>
                  ) : (
                    <>
                      <FaCheck /> Lưu
                    </>
                  )}
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
    </div>
  )
}

export default Profile
