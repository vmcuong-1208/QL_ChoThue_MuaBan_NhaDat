import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaHeart, FaMap, FaBars, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotificationBell from "./NotificationBell";
import ChangePasswordModal from "../auth/ChangePasswordModal";

const SCROLL_TRIGGER = 480;

const Navbar = () => {
  const { currentUser, logout, loading, hasPermission } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Check nếu đang ở trang chủ
  const isHomePage = location.pathname === "/";

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setShowMobileMenu(false);
    setShowDropdown(false);
  }, [location.pathname]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_TRIGGER);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDropdown = () => setShowDropdown((show) => !show);
  const toggleMobileMenu = () => setShowMobileMenu((show) => !show);

  // Phân quyền Môi giới / Admin
  const userRole = (currentUser?.LoaiTaiKhoan || "").toLowerCase();
  const isBroker = userRole.includes("môi") || userRole.includes("broker");
  const isBrokerOrAdmin =
    isBroker ||
    userRole.includes("admin") ||
    userRole.includes("đầu tư");

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công!");
      navigate("/");
    } catch (error) {
      toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-16">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ✅ LOGIC MÀU NAVBAR
  // Trang chủ chưa cuộn: transparent + text trắng
  // Trang chủ đã cuộn: white + text đen + viền
  // Trang khác: luôn white + text đen + viền
  const isTransparent = isHomePage && !scrolled;
  const navbarBg = isTransparent
    ? "bg-transparent"
    : "bg-white shadow-sm border-b border-gray-200";
  const textColor = isTransparent ? "text-white" : "text-gray-900";
  const textHoverColor = isTransparent
    ? "hover:text-blue-300"
    : "hover:text-blue-600";
  const underlineColor = isTransparent
    ? "bg-white"
    : "bg-gradient-to-r from-blue-500 to-blue-600";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBg}`}
      >
        <div className="flex items-center justify-between max-w-screen-xl px-4 py-4 mx-auto md:px-6">
          {/* ===== LEFT: HAMBURGER ICON (Mobile Only) ===== */}
          <button
            onClick={toggleMobileMenu}
            className={`flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg md:hidden hover:bg-opacity-10 hover:bg-gray-500 ${textColor}`}
          >
            {showMobileMenu ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* ===== CENTER: LOGO (Căn giữa trên mobile) ===== */}
          <Link
            to="/"
            className={`absolute left-1/2 -translate-x-1/2 md:relative md:left-0 md:translate-x-0 text-2xl font-extrabold tracking-tight transition-all duration-300 hover:scale-105 ${
              isTransparent ? "text-white drop-shadow-lg" : "text-gray-900"
            }`}
          >
            Bất Động Sản
            <span
              className={`ml-1 font-extrabold ${
                isTransparent ? "text-green-300" : "text-green-500"
              }`}
            >
              3MAN
            </span>
          </Link>

          {/* ===== RIGHT: DESKTOP MENU + AVATAR ===== */}
          <div className="items-center hidden gap-4 xl:gap-6 md:flex">
            {/* Desktop Menu */}
            {isBroker ? (
              <ul className="flex items-center gap-2 p-0 m-0 list-none lg:gap-4">
                <li className="relative group">
                  <Link
                    to="/"
                    className={`relative font-bold text-base px-3 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Trang chủ
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <Link
                    to="/ban-do"
                    className={`relative font-bold text-base px-3 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Bản đồ
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <Link
                    to="/dang-bai"
                    className={`relative font-bold text-base px-3 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Đăng tin
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="flex items-center gap-1 p-0 m-0 list-none xl:gap-2">
                <li className="relative group">
                  <Link
                    to="/"
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Trang chủ
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <Link
                    to="/ban-do"
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Bản đồ
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <Link
                    to="/tham-khao-gia"
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Tham khảo giá
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <Link
                    to="/mua-ban"
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Mua bán
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <Link
                    to="/cho-thue"
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Cho thuê
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <Link
                    to="/du-an"
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Dự án
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>

                <li className="relative group">
                  <a
                    href="#tin-tuc-bds"
                    onClick={(e) => {
                      if (location.pathname !== "/") {
                        navigate("/#tin-tuc-bds");
                      } else {
                        const el = document.getElementById("tin-tuc-bds");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block cursor-pointer transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Tin tức
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </a>
                </li>

                <li className="relative group">
                  <Link
                    to="/lien-he"
                    className={`relative font-bold text-sm lg:text-base px-2.5 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                      isTransparent ? "drop-shadow-md" : ""
                    }`}
                  >
                    Liên hệ
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                    ></span>
                  </Link>
                </li>
              </ul>
            )}

            {/* Avatar / Login Button */}
            {currentUser ? (
              <div className="relative flex items-center gap-3">
                {/* Nút Đăng tin dành riêng cho Admin (với Môi giới đã có sẵn trong menu chính) */}
                {!isBroker && isBrokerOrAdmin && (
                  <Link
                    to="/dang-bai"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold text-white transition-all duration-300 rounded-full shadow-md bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap"
                    title="Đăng tin bất động sản mới"
                  >
                    <span>➕</span>
                    <span>Đăng tin</span>
                  </Link>
                )}

                <NotificationBell isTransparent={isTransparent} />
                <div
                  className="overflow-hidden transition-all duration-300 transform border-2 border-blue-600 rounded-full cursor-pointer w-10 h-10 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-200 hover:scale-110"
                  onClick={toggleDropdown}
                  title="Menu tài khoản"
                >
                  <img
                    src={currentUser?.AnhDaiDien || "/placeholder.svg"}
                    alt="Avatar"
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Desktop Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 z-50 overflow-hidden bg-white border-2 border-gray-200 shadow-xl top-16 w-72 rounded-xl animate-slideDown max-h-[88vh] overflow-y-auto">
                    <div className="p-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="m-0 text-base font-extrabold text-gray-900 truncate">
                        {currentUser?.HoTen || currentUser?.Email}
                      </p>
                      <p className="mt-2 text-sm font-bold tracking-wide text-gray-600 uppercase">
                        {currentUser?.LoaiTaiKhoan || "Người dùng"}
                      </p>
                    </div>

                    {/* 1. Hồ sơ cá nhân */}
                    <Link
                      to="/ho-so"
                      className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      👤 <span>Hồ sơ cá nhân</span>
                    </Link>

                    {/* 2. Yêu thích */}
                    <Link
                      to="/yeu-thich"
                      className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaHeart className="text-red-500" />{" "}
                      <span>Yêu thích</span>
                    </Link>

                    {/* 3. Tin nhắn */}
                    <Link
                      to="/tin-nhan"
                      className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      💬 <span>Tin nhắn</span>
                    </Link>

                    {/* Dành riêng cho Môi giới / Admin */}
                    {isBrokerOrAdmin ? (
                      <>
                        <Link
                          to="/quan-ly-bai-dang"
                          className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-green-50 hover:text-green-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          📝 <span>Quản lý bài đăng</span>
                        </Link>
                        <Link
                          to="/quan-ly-khach-hang"
                          className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          👥 <span>Khách hàng quan tâm</span>
                        </Link>
                        <Link
                          to="/thong-ke"
                          className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          📊 <span>Xem thống kê</span>
                        </Link>
                      </>
                    ) : (
                      /* Dành riêng cho Tài khoản thường (User / Khách hàng) */
                      <>
                        {/* 4. Lịch sử đánh giá */}
                        <Link
                          to="/lich-su-danh-gia"
                          className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          ⭐ <span>Lịch sử đánh giá</span>
                        </Link>

                        {/* 5. Lịch sử báo cáo */}
                        <Link
                          to="/lich-su-bao-cao"
                          className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          🚩 <span>Lịch sử báo cáo</span>
                        </Link>
                      </>
                    )}

                    {/* 7. Đổi mật khẩu */}
                    <button
                      type="button"
                      className="flex items-center w-full gap-3 px-5 py-3 text-base font-bold text-left text-gray-800 transition-all duration-200 border-b border-gray-100 cursor-pointer hover:bg-slate-50 hover:text-slate-800"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowChangePasswordModal(true);
                      }}
                    >
                      🔒 <span>Đổi mật khẩu</span>
                    </button>

                    {hasPermission(["admin"]) && (
                      <Link
                        to="/admin-panel"
                        className="flex items-center gap-3 px-5 py-3 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-amber-50 hover:text-amber-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        ⚙️ <span>Quản trị</span>
                      </Link>
                    )}

                    {/* 8. Đăng xuất */}
                    <button
                      className="flex items-center gap-3 w-full px-5 py-3.5 font-bold text-red-600 text-base transition-all duration-200 hover:bg-red-50 border-t-2 border-gray-200 focus:outline-none cursor-pointer"
                      onClick={handleLogout}
                    >
                      🚪 <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth?mode=login"
                  className={`px-4 py-2 text-sm font-bold transition-all duration-200 rounded-lg whitespace-nowrap ${
                    isTransparent
                      ? "text-white hover:bg-white/20 border border-white/60 drop-shadow-sm"
                      : "text-blue-600 hover:bg-blue-50 border border-blue-200"
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="px-4 py-2 text-sm font-bold text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 whitespace-nowrap"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* ===== RIGHT: AVATAR (Mobile Only) ===== */}
          {currentUser && (
            <div className="flex items-center gap-2 md:hidden">
              <NotificationBell isTransparent={isTransparent} />
              <div
                className="w-10 h-10 overflow-hidden transition-all duration-300 transform border-2 border-blue-600 rounded-full cursor-pointer hover:border-blue-400 hover:shadow-lg hover:scale-110"
                onClick={toggleMobileMenu}
              >
                <img
                  src={currentUser?.AnhDaiDien || "/placeholder.svg"}
                  alt="Avatar"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}

          {/* ===== LOGIN BUTTON (Mobile, khi chưa đăng nhập) ===== */}
          {!currentUser && (
            <Link
              to="/auth"
              className="flex items-center justify-center w-10 h-10 text-white transition-all duration-300 transform rounded-full md:hidden bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-110"
            >
              👤
            </Link>
          )}
        </div>
      </nav>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden animate-fadeIn"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* ===== MOBILE MENU SIDEBAR ===== */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 md:hidden
          ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <button
              onClick={toggleMobileMenu}
              className="flex items-center justify-center w-10 h-10 text-white transition-all duration-300 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* User Info */}
          {currentUser && (
            <div className="flex items-center gap-3 mt-4">
              <img
                src={currentUser?.AnhDaiDien || "/placeholder.svg"}
                alt="Avatar"
                className="object-cover w-12 h-12 border-2 border-white rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {currentUser?.HoTen || currentUser?.Email}
                </p>
                <p className="text-xs font-semibold text-blue-100">
                  {currentUser?.LoaiTaiKhoan || "Người dùng"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="overflow-y-auto h-[calc(100%-180px)]">
          {isBroker ? (
            /* Phân quyền Môi giới trên Mobile: Chỉ có Trang chủ, Bản đồ, Đăng tin */
            <>
              <Link
                to="/"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">🏠</span>
                </div>
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/ban-do"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <FaMap className="text-blue-500" size={18} />
                </div>
                <span>Bản đồ</span>
              </Link>

              <Link
                to="/dang-bai"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">📝</span>
                </div>
                <span>Đăng tin</span>
              </Link>
            </>
          ) : (
            /* Menu đầy đủ cho người dùng khác / khách */
            <>
              <Link
                to="/"
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">🏠</span>
                </div>
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/ban-do"
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <FaMap className="text-blue-500" size={18} />
                </div>
                <span>Bản đồ</span>
              </Link>

              <Link
                to="/tham-khao-gia"
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">📊</span>
                </div>
                <span>Tham khảo giá</span>
              </Link>

              <Link
                to="/mua-ban"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">🏷️</span>
                </div>
                <span>Mua bán</span>
              </Link>

              <Link
                to="/cho-thue"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">🔑</span>
                </div>
                <span>Cho thuê</span>
              </Link>

              <Link
                to="/du-an"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">🏢</span>
                </div>
                <span>Dự án</span>
              </Link>

              <a
                href="#tin-tuc-bds"
                onClick={(e) => {
                  setShowMobileMenu(false);
                  if (location.pathname !== "/") {
                    navigate("/#tin-tuc-bds");
                  } else {
                    const el = document.getElementById("tin-tuc-bds");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">📰</span>
                </div>
                <span>Tin tức</span>
              </a>

              <Link
                to="/lien-he"
                className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">📞</span>
                </div>
                <span>Liên hệ</span>
              </Link>
            </>
          )}

          {/* User-specific menu */}
          {currentUser ? (
            <>
              <div className="mt-4 mb-2 ml-5 text-xs font-bold tracking-wide text-gray-500 uppercase">
                Tài khoản
              </div>

              {/* 1. Hồ sơ cá nhân */}
              <Link
                to="/ho-so"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">👤</span>
                </div>
                <span>Hồ sơ cá nhân</span>
              </Link>

              {/* 2. Yêu thích */}
              <Link
                to="/yeu-thich"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-red-50 hover:text-red-600"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <FaHeart className="text-red-500" size={18} />
                </div>
                <span>Yêu thích</span>
              </Link>

              {/* 3. Tin nhắn */}
              <Link
                to="/tin-nhan"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-purple-50 hover:text-purple-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">💬</span>
                </div>
                <span>Tin nhắn</span>
              </Link>

              {/* Dành riêng cho Môi giới / Admin */}
              {isBrokerOrAdmin ? (
                <>
                  <Link
                    to="/quan-ly-bai-dang"
                    className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-green-50 hover:text-green-700"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <span className="text-xl">📝</span>
                    </div>
                    <span>Quản lý bài đăng</span>
                  </Link>

                  <Link
                    to="/quan-ly-khach-hang"
                    className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <span className="text-xl">👥</span>
                    </div>
                    <span>Khách hàng quan tâm</span>
                  </Link>

                  <Link
                    to="/thong-ke"
                    className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <span className="text-xl">📊</span>
                    </div>
                    <span>Xem thống kê</span>
                  </Link>
                </>
              ) : (
                /* Dành riêng cho Tài khoản thường (User / Khách hàng) */
                <>
                  {/* 4. Lịch sử đánh giá */}
                  <Link
                    to="/lich-su-danh-gia"
                    className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-amber-50 hover:text-amber-700"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <span className="text-xl">⭐</span>
                    </div>
                    <span>Lịch sử đánh giá</span>
                  </Link>

                  {/* 5. Lịch sử báo cáo */}
                  <Link
                    to="/lich-su-bao-cao"
                    className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <span className="text-xl">🚩</span>
                    </div>
                    <span>Lịch sử báo cáo</span>
                  </Link>
                </>
              )}

              {/* 7. Đổi mật khẩu */}
              <button
                type="button"
                className="flex items-center w-full gap-3 px-5 py-4 text-base font-bold text-left text-gray-800 transition-all duration-200 border-b border-gray-100 cursor-pointer hover:bg-slate-50 hover:text-slate-800"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowChangePasswordModal(true);
                }}
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">🔒</span>
                </div>
                <span>Đổi mật khẩu</span>
              </button>

              {hasPermission(["admin"]) && (
                <Link
                  to="/admin-panel"
                  className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-amber-50 hover:text-amber-700"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                    <span className="text-xl">⚙️</span>
                  </div>
                  <span>Quản trị</span>
                </Link>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2.5 mx-5 my-4">
              <Link
                to="/auth?mode=login"
                className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-blue-600 transition-colors border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl"
              >
                <span>🔑</span>
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/auth?mode=register"
                className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-white transition-colors bg-blue-600 shadow-md hover:bg-blue-700 active:bg-blue-800 rounded-xl"
              >
                <span>📝</span>
                <span>Đăng ký tài khoản</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer - Logout */}
        {currentUser && (
          <div className="absolute bottom-0 left-0 right-0 border-t-2 border-gray-200">
            <button
              className="flex items-center justify-center w-full gap-3 py-4 text-base font-bold text-red-600 transition-all duration-200 hover:bg-red-50 focus:outline-none"
              onClick={handleLogout}
            >
              <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                <span className="text-xl">🚪</span>
              </div>
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal đổi mật khẩu */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

export default Navbar;
