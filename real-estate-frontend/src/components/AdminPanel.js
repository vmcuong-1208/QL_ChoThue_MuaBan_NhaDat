"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaUsers, FaHome, FaTachometerAlt, FaSignOutAlt, FaChevronDown, FaCheckCircle } from "react-icons/fa"
import "../styles/AdminPanel.css"
import PropertyTypeManager from "./PropertyTypeManager"
import UserManager from "./UserManager"
import VerificationManager from "./VerificationManager"
import { useAuth } from "../context/AuthContext"
import axios from "axios"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const AdminPanel = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { currentUser } = useAuth()

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth")
      return
    }

    if (!currentUser.LoaiTaiKhoan || currentUser.LoaiTaiKhoan.toLowerCase() !== "admin") {
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

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "property-types":
        return <PropertyTypeManager />
      case "users":
        return <UserManager />
      case "verification":
        return <VerificationManager />
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
            <li className={activeTab === "verification" ? "active" : ""}>
              <button onClick={() => setActiveTab("verification")}>
                <FaCheckCircle /> <span>Quản lý xác thực</span>
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

// Component Dashboard với dữ liệu động
const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token")
        console.log("Fetching stats with token:", token ? "exists" : "missing")

        const response = await axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setStats(response.data.stats)
        setRecentActivities(response.data.recentActivities)
      } catch (error) {
        console.error("Lỗi khi lấy thống kê:", error)
        if (error.response?.status === 403) {
          setError("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin.")
        } else {
          setError("Không thể tải thống kê. Vui lòng thử lại sau.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="admin-loading">Đang tải thống kê...</div>
  }

  if (error) {
    return <div className="admin-error">{error}</div>
  }

  return (
    <div className="dashboard">
      <div className="stats-container">
        <div className="stat-card">
          <h3>Tổng số người dùng</h3>
          <p className="stat-value">{stats?.totalUsers || 0}</p>
          <span className="stat-change">+{stats?.newUsersThisMonth || 0} trong tháng</span>
        </div>
        <div className="stat-card">
          <h3>Bài đăng mới trong tháng</h3>
          <p className="stat-value">{stats?.newPostsThisMonth || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Tổng số bài đăng</h3>
          <p className="stat-value">{stats?.totalPosts || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Loại nhà đất</h3>
          <p className="stat-value">{stats?.totalPropertyTypes || 0}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Hoạt động gần đây</h2>
        <div className="activity-list">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-time">{new Date(activity.createdAt).toLocaleDateString("vi-VN")}</div>
                <div className="activity-content">
                  <strong>{activity.userName}</strong> đã đăng bài:
                  <span> {activity.content}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="activity-item">
              <div className="activity-content">Chưa có hoạt động nào</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const getTabTitle = (tab) => {
  switch (tab) {
    case "dashboard":
      return "Tổng quan"
    case "property-types":
      return "Quản lý loại nhà đất"
    case "users":
      return "Quản lý người dùng"
    case "verification":
      return "Quản lý xác thực"
    default:
      return "Tổng quan"
  }
}

export default AdminPanel
