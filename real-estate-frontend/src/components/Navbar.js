"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FaHeart, FaMap } from "react-icons/fa"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/Navbar.css"

const Navbar = () => {
  const { currentUser, logout, loading, hasPermission } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Đăng xuất thành công!")
      navigate("/")
    } catch (error) {
      toast.error("Đăng xuất thất bại. Vui lòng thử lại.")
    }
  }

  if (loading) {
    return <div className="navbar-loading">Đang tải...</div>
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Bất Động Sản<span> Thuận Cường</span>
        </Link>

        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">
              Trang chủ
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/ban-do" className="navbar-link">
              <FaMap style={{ marginRight: "5px" }} /> Bản đồ
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/tim-kiem" className="navbar-link">
              Tìm kiếm
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/lien-he" className="navbar-link">
              Liên hệ
            </Link>
          </li>

          {currentUser ? (
            <li className="navbar-item user-profile">
              <div className="avatar-container" onClick={toggleDropdown}>
                <img src={currentUser?.AnhDaiDien || "/placeholder.svg"} alt="Avatar" className="user-avatar" />
              </div>

              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="user-name">{currentUser?.HoTen || currentUser?.Email}</p>
                    <p className="user-role">{currentUser?.LoaiTaiKhoan || "Người dùng"}</p>
                  </div>
                  <Link to="/ho-so" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Thông tin cá nhân
                  </Link>
                  <Link to="/yeu-thich" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <FaHeart /> Yêu thích
                  </Link>
                  <Link to="/quan-ly-bai-dang" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Quản lý bài đăng
                  </Link>
                  <Link to="/tin-nhan" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Tin nhắn
                  </Link>
                  {hasPermission(["admin"]) && (
                    <Link to="/admin-panel" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      Quản trị
                    </Link>
                  )}
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li className="navbar-item">
              <Link to="/auth" className="navbar-link auth-link">
                Đăng nhập / Đăng ký
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
