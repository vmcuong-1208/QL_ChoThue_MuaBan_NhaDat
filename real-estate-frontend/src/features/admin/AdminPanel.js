"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaHome,
  FaTachometerAlt,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaBuilding,
  FaCalendarAlt,
  FaBell,
  FaSearch,
  FaCog,
} from "react-icons/fa";
import PropertyTypeManager from "./PropertyTypeManager";
import UserManager from "./UserManager";
import VerificationManager from "./VerificationManager";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { API_URL, SERVER_URL } from "../../services/api";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    if (
      !currentUser.LoaiTaiKhoan ||
      currentUser.LoaiTaiKhoan.toLowerCase() !== "admin"
    ) {
      navigate("/");
      alert("Bạn không có quyền truy cập trang quản trị");
    }
  }, [navigate, currentUser]);

  const handleLogout = () => {
    navigate("/");
    logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "property-types":
        return <PropertyTypeManager />;
      case "users":
        return <UserManager />;
      case "verification":
        return <VerificationManager />;
      default:
        return <Dashboard />;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: "dashboard",
      icon: FaTachometerAlt,
      label: "Tổng quan",
      color: "blue",
    },
    {
      id: "property-types",
      icon: FaHome,
      label: "Quản lý loại nhà đất",
      color: "green",
    },
    {
      id: "users",
      icon: FaUsers,
      label: "Quản lý người dùng",
      color: "purple",
    },
    {
      id: "verification",
      icon: FaCheckCircle,
      label: "Quản lý xác thực",
      color: "orange",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 bg-white shadow-2xl
          ${isSidebarOpen ? "w-64" : "w-20"}
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Sidebar Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div
            className={`flex items-center gap-3 ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-lg">
              <FaBuilding className="text-xl text-blue-600" />
            </div>
            {isSidebarOpen && (
              <div className="animate-fadeIn">
                <h2 className="text-lg font-bold text-white">BĐS Admin</h2>
                <p className="text-xs text-blue-100">Dashboard v2.0</p>
              </div>
            )}
          </div>

          {/* Desktop Toggle */}
          <button
            onClick={toggleSidebar}
            className="items-center justify-center hidden w-8 h-8 text-white transition-all duration-300 rounded-lg lg:flex bg-white/20 hover:bg-white/30 active:scale-95"
          >
            {isSidebarOpen ? (
              <FaChevronLeft className="text-sm" />
            ) : (
              <FaChevronRight className="text-sm" />
            )}
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center w-8 h-8 text-white transition-all duration-300 rounded-lg lg:hidden bg-white/20 hover:bg-white/30"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* User Profile */}
        <div
          className={`p-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50
          ${!isSidebarOpen && "flex justify-center"}`}
        >
          <div
            className={`flex items-center gap-3 ${
              !isSidebarOpen && "flex-col"
            }`}
          >
            <div className="relative">
              <img
                src={currentUser.AnhDaiDien || "https://via.placeholder.com/40"}
                alt="Admin"
                className="w-12 h-12 border-2 border-blue-400 rounded-full shadow-md"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0 animate-fadeIn">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {currentUser.HoTen || currentUser.Email}
                </p>
                <p className="text-xs font-semibold text-blue-600">
                  {currentUser.LoaiTaiKhoan}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`group relative w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold transition-all duration-300 rounded-xl
                  ${
                    isActive
                      ? `bg-gradient-to-r from-${item.color}-600 to-${item.color}-500 text-white shadow-lg scale-105`
                      : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                  }
                  ${!isSidebarOpen && "justify-center"}
                  animate-fadeInUp`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon
                  className={`text-lg ${
                    !isActive && `group-hover:text-${item.color}-600`
                  } transition-colors duration-300`}
                />
                {isSidebarOpen && (
                  <span className="animate-fadeIn">{item.label}</span>
                )}

                {/* Active Indicator */}
                {isActive && !isSidebarOpen && (
                  <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full animate-scaleIn"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-red-600 transition-all duration-300 rounded-xl hover:bg-red-50 hover:scale-105 active:scale-95
              ${!isSidebarOpen && "justify-center"}`}
          >
            <FaSignOutAlt className="text-lg" />
            {isSidebarOpen && <span className="animate-fadeIn">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center w-10 h-10 text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg lg:hidden hover:bg-gray-200 active:scale-95"
          >
            <FaBars />
          </button>

          {/* Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800 lg:text-2xl">
              {getTabTitle(activeTab)}
            </h1>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Search (Desktop) */}
            <div className="items-center hidden gap-2 px-3 py-2 bg-gray-100 rounded-lg lg:flex">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="text-sm transition-all duration-300 bg-transparent border-none outline-none w-36 focus:w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative flex items-center justify-center w-10 h-10 text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-110 active:scale-95">
              <FaBell />
              <span className="absolute w-2 h-2 bg-red-500 border-2 border-white rounded-full top-1 right-1"></span>
            </button>

            {/* Settings */}
            <button className="flex items-center justify-center w-10 h-10 text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-110 active:scale-95">
              <FaCog />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 overflow-y-auto lg:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fadeIn"
        ></div>
      )}
    </div>
  );
};

// Modern Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats(response.data.stats);
        setRecentActivities(response.data.recentActivities);
      } catch (error) {
        console.error("Lỗi khi lấy thống kê:", error);
        if (error.response?.status === 403) {
          setError(
            "Không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin.",
          );
        } else {
          setError("Không thể tải thống kê. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">
            Đang tải thống kê...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="p-6 border-l-4 border-red-500 rounded-lg shadow-lg bg-red-50">
          <p className="text-lg font-semibold text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Tổng số người dùng",
      value: stats?.totalUsers || 0,
      change: `+${stats?.newUsersThisMonth || 0}`,
      changeLabel: "trong tháng",
      icon: FaUsers,
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Bài đăng mới",
      value: stats?.newPostsThisMonth || 0,
      change: "+12%",
      changeLabel: "so với tháng trước",
      icon: FaChartLine,
      color: "green",
      bgGradient: "from-green-500 to-emerald-600",
    },
    {
      title: "Tổng số bài đăng",
      value: stats?.totalPosts || 0,
      change: "+8%",
      changeLabel: "tăng trưởng",
      icon: FaHome,
      color: "purple",
      bgGradient: "from-purple-500 to-pink-600",
    },
    {
      title: "Loại nhà đất",
      value: stats?.totalPropertyTypes || 0,
      change: "Ổn định",
      changeLabel: "không thay đổi",
      icon: FaBuilding,
      color: "orange",
      bgGradient: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden transition-all duration-300 bg-white shadow-lg group rounded-2xl hover:shadow-2xl hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>

              <div className="relative p-6">
                {/* Icon */}
                <div className={`flex items-center justify-between mb-4`}>
                  <div
                    className={`flex items-center justify-center w-14 h-14 bg-gradient-to-br ${stat.bgGradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="text-2xl text-white" />
                  </div>
                  <div
                    className={`px-3 py-1 text-xs font-bold text-${stat.color}-700 bg-${stat.color}-100 rounded-full`}
                  >
                    {stat.change}
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-2 text-sm font-semibold text-gray-600">
                  {stat.title}
                </h3>
                <p className="mb-1 text-3xl font-bold text-gray-800">
                  {stat.value.toLocaleString()}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <FaArrowUp className="text-green-500" />
                  {stat.changeLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div
        className="p-6 bg-white shadow-lg rounded-2xl animate-fadeInUp"
        style={{ animationDelay: "400ms" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <FaCalendarAlt className="text-blue-600" />
            Hoạt động gần đây
          </h2>
          <button className="px-4 py-2 text-sm font-semibold text-blue-600 transition-all duration-300 rounded-lg bg-blue-50 hover:bg-blue-100 hover:scale-105">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 transition-all duration-300 bg-gray-50 rounded-xl hover:bg-gray-100 hover:scale-[1.02] animate-fadeInUp"
                style={{ animationDelay: `${(index + 5) * 100}ms` }}
              >
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-white rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                  <FaUserCircle className="text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <strong className="font-bold text-gray-900">
                      {activity.userName}
                    </strong>
                    {" đã đăng bài: "}
                    <span className="text-gray-600">{activity.content}</span>
                  </p>
                  <p className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <FaCalendarAlt className="text-gray-400" />
                    {new Date(activity.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center w-16 h-16 mb-4 text-gray-400 bg-gray-100 rounded-full">
                <FaCalendarAlt className="text-2xl" />
              </div>
              <p className="text-sm font-semibold text-gray-500">
                Chưa có hoạt động nào
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getTabTitle = (tab) => {
  const titles = {
    dashboard: "Tổng quan",
    "property-types": "Quản lý loại nhà đất",
    users: "Quản lý người dùng",
    verification: "Quản lý xác thực",
  };
  return titles[tab] || "Tổng quan";
};

export default AdminPanel;
