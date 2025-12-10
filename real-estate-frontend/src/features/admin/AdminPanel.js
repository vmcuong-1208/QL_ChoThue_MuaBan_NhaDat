"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  FaExternalLinkAlt,
  FaShieldAlt,
  FaIdCard,
  FaClipboardList,
  FaLayerGroup,
  FaBullhorn,
  FaFlag,
  FaMoneyBillWave,
  FaCrown,
} from "react-icons/fa";
import CategoryManager from "./CategoryManager";
import ContentManager from "./ContentManager";
import UserManager from "./UserManager";
import PropertyModerationManager from "./PropertyModerationManager";
import BrokerVerificationManager from "./BrokerVerificationManager";
import ReportManager from "./ReportManager";
import RevenueManager from "./RevenueManager";
import FeaturedPostManager from "./FeaturedPostManager";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { API_URL } from "../../services/api";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
      case "categories":
      case "property-types":
        return <CategoryManager />;
      case "users":
        return <UserManager />;
      case "broker-verification":
        return <BrokerVerificationManager />;
      case "properties":
      case "verification":
        return <PropertyModerationManager />;
      case "reports":
        return <ReportManager />;
      case "revenue":
        return <RevenueManager />;
      case "featured-posts":
        return <FeaturedPostManager />;
      case "content":
        return <ContentManager />;
      default:
        return <Dashboard />;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-blue-600 rounded-full border-3 border-t-transparent animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: "dashboard",
      icon: FaTachometerAlt,
      label: "Tổng quan",
    },
    {
      id: "categories",
      icon: FaLayerGroup,
      label: "Quản lý danh mục",
    },
    {
      id: "users",
      icon: FaUsers,
      label: "Quản lý tài khoản",
    },
    {
      id: "broker-verification",
      icon: FaIdCard,
      label: "Xác minh môi giới",
    },
    {
      id: "revenue",
      icon: FaMoneyBillWave,
      label: "Quản lý doanh thu",
    },
    {
      id: "properties",
      icon: FaClipboardList,
      label: "Quản lý tin đăng",
    },
    {
      id: "featured-posts",
      icon: FaCrown,
      label: "Quản lý tin nổi bật",
    },
    {
      id: "reports",
      icon: FaFlag,
      label: "Báo cáo sai phạm",
    },
    {
      id: "content",
      icon: FaBullhorn,
      label: "Quản lý nội dung",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans antialiased bg-slate-50 text-slate-800">
      {/* Sidebar - Chuẩn Dark Navy Slate Doanh nghiệp */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 bg-slate-900 border-r border-slate-800 shadow-lg
          ${isSidebarOpen ? "w-64" : "w-20"}
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/60">
          <div
            className={`flex items-center gap-3 ${
              !isSidebarOpen && "justify-center w-full"
            }`}
          >
            <div className="flex items-center justify-center text-white bg-blue-600 rounded-lg shadow-xs w-9 h-9">
              <FaBuilding className="text-lg" />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight text-white truncate">
                  BĐS 3MAN
                </h2>
                <p className="text-[11px] font-medium text-slate-400">
                  Cổng Quản Trị
                </p>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          {isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="items-center justify-center hidden transition-colors rounded-md w-7 h-7 text-slate-400 lg:flex hover:text-white hover:bg-slate-800"
              title="Thu gọn menu"
            >
              <FaChevronLeft className="text-xs" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg text-slate-400 lg:hidden hover:text-white hover:bg-slate-800"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Khi thu nhỏ, nút mở rộng nằm ngay dưới header */}
        {!isSidebarOpen && (
          <div className="justify-center hidden py-2 border-b lg:flex border-slate-800">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-8 h-8 transition-colors rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              title="Mở rộng menu"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        )}

        {/* User Mini Profile */}
        <div
          className={`p-3.5 border-b border-slate-800/80 bg-slate-900/50
          ${!isSidebarOpen && "flex justify-center"}`}
        >
          <div
            className={`flex items-center gap-3 ${
              !isSidebarOpen && "flex-col"
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={currentUser.AnhDaiDien || "/placeholder.svg?height=40&width=40"}
                alt="Admin"
                className="object-cover border rounded-full w-9 h-9 border-slate-700"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff";
                }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser.HoTen || currentUser.Email}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <FaShieldAlt className="text-[10px] text-blue-400" />
                  <span className="text-[11px] font-medium text-blue-400">
                    Quản trị viên
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }
                  ${!isSidebarOpen && "justify-center px-2"}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon
                  className={`text-base flex-shrink-0 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  }`}
                />
                {isSidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-rose-400 transition-colors rounded-lg hover:bg-rose-950/30 hover:text-rose-300
              ${!isSidebarOpen && "justify-center px-2"}`}
            title="Đăng xuất"
          >
            <FaSignOutAlt className="flex-shrink-0 text-sm" />
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 min-w-0 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top Header - Chuẩn Trắng Tinh Tế & Phẳng */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200/90 shadow-2xs lg:px-6">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center justify-center transition-colors rounded-lg w-9 h-9 text-slate-600 bg-slate-100 lg:hidden hover:bg-slate-200"
            >
              <FaBars className="text-sm" />
            </button>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Link to Website */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              title="Mở trang chủ website trong tab mới"
            >
              <FaExternalLinkAlt className="text-[10px]" />
              <span>Xem Website</span>
            </Link>

            {/* Notifications */}
            <button
              className="relative flex items-center justify-center transition-colors border rounded-lg w-9 h-9 text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200"
              title="Thông báo hệ thống"
            >
              <FaBell className="text-xs" />
              <span className="absolute w-2 h-2 bg-blue-600 rounded-full top-2 right-2"></span>
            </button>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="hidden text-xs font-semibold md:inline text-slate-800">
                {currentUser.HoTen || "Admin"}
              </span>
              <img
                src={currentUser.AnhDaiDien || "/placeholder.svg?height=32&width=32"}
                alt="Avatar"
                className="object-cover w-8 h-8 border rounded-full border-slate-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff";
                }}
              />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 overflow-y-auto lg:p-6 bg-slate-50/70">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        ></div>
      )}
    </div>
  );
};

// =========================================================================
// DASHBOARD TỔNG QUAN - Chuẩn Thẻ Doanh Nghiệp (Corporate Metrics)
// =========================================================================
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
      } catch (err) {
        console.error("Lỗi khi lấy thống kê:", err);
        if (err.response?.status === 403) {
          setError("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin.");
        } else {
          setError("Không thể tải thống kê hệ thống. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-blue-600 rounded-full border-3 border-t-transparent animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-xs border bg-rose-50 border-rose-200 rounded-xl text-rose-700">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  // 4 Chỉ số KPI cốt lõi - Phối màu kinh doanh chuẩn mực
  const statCards = [
    {
      title: "Tổng số tài khoản",
      value: stats?.totalUsers || 0,
      badgeText: `+${stats?.newUsersThisMonth || 0} trong tháng`,
      isPositive: true,
      icon: FaUsers,
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      title: "Bài đăng mới trong tháng",
      value: stats?.newPostsThisMonth || 0,
      badgeText: "+12% so với tháng trước",
      isPositive: true,
      icon: FaChartLine,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      title: "Tổng số tin bất động sản",
      value: stats?.totalPosts || 0,
      badgeText: "+8% tăng trưởng",
      isPositive: true,
      icon: FaHome,
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      title: "Danh mục loại nhà đất",
      value: stats?.totalPropertyTypes || 0,
      badgeText: "Đang hoạt động",
      isPositive: null,
      icon: FaBuilding,
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 transition-colors bg-white border shadow-xs border-slate-200/90 rounded-xl hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                  {stat.title}
                </span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${stat.iconBg}`}>
                  <Icon className="text-base" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {stat.value.toLocaleString()}
                </span>
                {stat.badgeText && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      stat.isPositive === true
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : stat.isPositive === false
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : "text-slate-600 bg-slate-50 border-slate-200"
                    }`}
                  >
                    {stat.isPositive === true && <FaArrowUp className="text-[9px]" />}
                    {stat.isPositive === false && <FaArrowDown className="text-[9px]" />}
                    <span>{stat.badgeText}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Recent Activities Section */}
      <div className="overflow-hidden bg-white border shadow-xs border-slate-200/90 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b sm:px-6 border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-sm text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">
              Hoạt động đăng tin gần đây
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Cập nhật tự động theo thời gian thực
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities.length > 0 ? (
            recentActivities.map((act, index) => (
              <div
                key={index}
                className="flex items-start gap-3.5 p-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200">
                  <FaUserCircle className="text-base" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-normal sm:text-sm text-slate-800">
                    <strong className="font-semibold text-slate-900">
                      {act.userName}
                    </strong>
                    {" vừa đăng bất động sản mới: "}
                    <span className="font-medium text-blue-700">
                      {act.content}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(act.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-xs font-medium text-center text-slate-400">
              Chưa có dữ liệu hoạt động nào gần đây.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getTabTitle = (tab) => {
  const titles = {
    dashboard: "Tổng quan thống kê",
    categories: "Quản lý danh mục",
    "property-types": "Quản lý danh mục",
    users: "Quản lý tài khoản",
    "broker-verification": "Xác minh môi giới",
    properties: "Quản lý tin đăng",
    verification: "Quản lý tin đăng",
    reports: "Quản lý Báo cáo tin sai phạm",
    content: "Quản lý nội dung",
  };
  return titles[tab] || "Tổng quan";
};

export default AdminPanel;
