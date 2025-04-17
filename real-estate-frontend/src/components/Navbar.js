"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "../styles/Navbar.css"

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token")
      const userInfo = localStorage.getItem("userInfo")

      if (token && userInfo) {
        try {
          setCurrentUser(JSON.parse(userInfo))
        } catch (error) {
          console.error("Lỗi parse userInfo:", error)
          // Nếu có lỗi parse, tạo một đối tượng user cơ bản
          setCurrentUser({ Email: "Người dùng" })
        }
      } else {
        setCurrentUser(null)
      }
    }

    // Kiểm tra khi component mount
    checkLoginStatus()

    // Thêm event listener để kiểm tra khi localStorage thay đổi
    window.addEventListener("storage", checkLoginStatus)
    // Thêm một custom event listener để cập nhật ngay lập tức
    window.addEventListener("login-success", checkLoginStatus)

    // Cleanup
    return () => {
      window.removeEventListener("storage", checkLoginStatus)
      window.removeEventListener("login-success", checkLoginStatus)
    }
  }, [])

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userInfo")
    setCurrentUser(null)
    setShowDropdown(false)
    window.location.href = "/" // Chuyển hướng về trang chủ
  }

  const defaultAvatar = "https://via.placeholder.com/40"

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          BĐS<span>Online</span>
        </Link>

        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">
              Trang chủ
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/bat-dong-san" className="navbar-link">
              Bất động sản
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
                <img src={currentUser.AnhDaiDien || defaultAvatar} alt="Avatar" className="user-avatar" />
              </div>

              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="user-name">{currentUser.HoTen || currentUser.Email}</p>
                    <p className="user-role">{currentUser.LoaiTaiKhoan || "Người dùng"}</p>
                  </div>
                  <Link to="/ho-so" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Thông tin cá nhân
                  </Link>
                  <Link to="/yeu-thich" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Bất động sản yêu thích
                  </Link>
                  <Link to="/quan-ly-bai-dang" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Quản lý bài đăng
                  </Link>
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
