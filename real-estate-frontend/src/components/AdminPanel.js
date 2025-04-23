"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaUsers, FaHome, FaTachometerAlt, FaSignOutAlt, FaChevronDown } from "react-icons/fa"
import "../styles/AdminPanel.css"
import PropertyTypeManager from "./PropertyTypeManager"
import UserManager from "./UserManager"
import { useAuth } from "../context/AuthContext" // Corrected import path

const AdminPanel = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { currentUser } = useAuth()

  useEffect(() => {
    // Kiểm tra xem người dùng có đăng nhập chưa
    if (!currentUser) {
      navigate("/auth")
      return
    }

    // Kiểm tra quyền admin (giả sử LoaiTaiKhoan = "Admin" là admin)
    if (currentUser.LoaiTaiKhoan !== "admin") {
      navigate("/")
      alert("Bạn không có quyền truy cập trang quản trị")
    }
  }, [navigate, currentUser])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userInfo")
    navigate("/auth")
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Hiển thị nội dung tương ứng với tab đang active
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "property-types":
        return <PropertyTypeManager />
      case "users":
        return <UserManager />
      default:
        return <Dashboard />
    }
  }

  if (!currentUser) {
    return <div className="admin-loading">Đang tải...</div>
  }

  return (
    <div className={`admin-container ${isSidebarOpen ? "" : "sidebar-collapsed"}`}>
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>BĐS Admin</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FaChevronDown />
          </button>
        </div>

        <div className="admin-user">
          <div className="admin-avatar">
            <img src={currentUser.AnhDaiDien || "https://via.placeholder.com/40"} alt="Admin" />
          </div>
          <div className="admin-info">
            <p className="admin-name">{currentUser.HoTen || currentUser.Email}</p>
            <p className="admin-role">{currentUser.LoaiTaiKhoan}</p>
          </div>
        </div>

        <nav className="admin-nav">
          <ul>
            <li className={activeTab === "dashboard" ? "active" : ""}>
              <button onClick={() => setActiveTab("dashboard")}>
                <FaTachometerAlt /> <span>Tổng quan</span>
              </button>
            </li>
            <li className={activeTab === "property-types" ? "active" : ""}>
              <button onClick={() => setActiveTab("property-types")}>
                <FaHome /> <span>Quản lý loại nhà đất</span>
              </button>
            </li>
            <li className={activeTab === "users" ? "active" : ""}>
              <button onClick={() => setActiveTab("users")}>
                <FaUsers /> <span>Quản lý người dùng</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>{getTabTitle(activeTab)}</h1>
        </div>

        <div className="admin-main">{renderContent()}</div>
      </div>
    </div>
  )
}

// Component Dashboard
const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="stats-container">
        <div className="stat-card">
          <h3>Tổng số người dùng</h3>
          <p className="stat-value">125</p>
        </div>
        <div className="stat-card">
          <h3>Bài đăng mới trong tháng</h3>
          <p className="stat-value">48</p>
        </div>
        <div className="stat-card">
          <h3>Tổng số bài đăng</h3>
          <p className="stat-value">356</p>
        </div>
        <div className="stat-card">
          <h3>Loại nhà đất</h3>
          <p className="stat-value">8</p>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Hoạt động gần đây</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-time">10:30 AM</div>
            <div className="activity-content">
              <strong>Nguyễn Văn A</strong> đã đăng một bài đăng mới: <span>Nhà phố Quận 1</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-time">09:15 AM</div>
            <div className="activity-content">
              <strong>Trần Thị B</strong> đã cập nhật thông tin cá nhân
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-time">Hôm qua</div>
            <div className="activity-content">
              <strong>Admin</strong> đã thêm loại nhà đất mới: <span>Penthouse</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-time">Hôm qua</div>
            <div className="activity-content">
              <strong>Lê Văn C</strong> đã đăng ký tài khoản mới
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-time">2 ngày trước</div>
            <div className="activity-content">
              <strong>Phạm Thị D</strong> đã cập nhật bài đăng: <span>Biệt thự Quận 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hàm lấy tiêu đề cho tab
const getTabTitle = (tab) => {
  switch (tab) {
    case "dashboard":
      return "Tổng quan"
    case "property-types":
      return "Quản lý loại nhà đất"
    case "users":
      return "Quản lý người dùng"
    default:
      return "Tổng quan"
  }
}

export default AdminPanel
