"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Import useAuth
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPen, FaCheck, FaTimes } from "react-icons/fa";
import "../styles/Profile.css";

const Profile = () => {
  const { currentUser, updateProfile, loading } = useAuth(); // Use AuthContext
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    HoTen: currentUser?.HoTen || "",
    SDT: currentUser?.SDT || "",
    DiaChi: currentUser?.DiaChi || "",
    MoTaBanThan: currentUser?.MoTaBanThan || "",
    AnhDaiDien: currentUser?.AnhDaiDien || "",
  });
  const [previewImage, setPreviewImage] = useState(currentUser?.AnhDaiDien || "");

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setFormData({
        ...formData,
        AnhDaiDien: file,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });
    await updateProfile(formDataToSend);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      HoTen: currentUser?.HoTen || "",
      SDT: currentUser?.SDT || "",
      DiaChi: currentUser?.DiaChi || "",
      MoTaBanThan: currentUser?.MoTaBanThan || "",
      AnhDaiDien: currentUser?.AnhDaiDien || "",
    });
    setPreviewImage(currentUser?.AnhDaiDien || "");
    setIsEditing(false);
  };

  if (loading) {
    return <div className="loading-container">Đang tải...</div>;
  }

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <h1>Thông tin cá nhân</h1>
        </div>
        <div className="profile-message error">Bạn cần đăng nhập để xem thông tin cá nhân.</div>
      </div>
    );
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
    </div>
  );
};

export default Profile;
