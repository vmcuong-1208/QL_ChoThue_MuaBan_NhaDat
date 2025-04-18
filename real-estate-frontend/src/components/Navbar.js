"use client"

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth
import "../styles/Navbar.css";

const Navbar = () => {
  const { currentUser, logout, loading, hasPermission } = useAuth(); // Use AuthContext
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  if (loading) {
    return <div className="navbar-loading">Đang tải...</div>;
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
                <img
                  src={currentUser?.AnhDaiDien || "/placeholder.svg"}
                  alt="Avatar"
                  className="user-avatar"
                />
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
                    Bất động sản yêu thích
                  </Link>
                  <Link to="/quan-ly-bai-dang" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Quản lý bài đăng
                  </Link>
                  {hasPermission(["admin"]) && (
                    <Link to="/admin-panel" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      Quản trị
                    </Link>
                  )}
                  <button className="dropdown-item logout" onClick={logout}>
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
  );
};

export default Navbar;
