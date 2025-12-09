import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaHeart, FaMap, FaBars, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotificationBell from "./NotificationBell";

const SCROLL_TRIGGER = 480;

const Navbar = () => {
  const { currentUser, logout, loading, hasPermission } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
          <div className="items-center hidden gap-6 md:flex">
            {/* Desktop Menu */}
            <ul className="flex items-center gap-2 p-0 m-0 list-none">
              <li className="relative group">
                <Link
                  to="/"
                  className={`relative font-bold text-lg px-4 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
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
                  className={`relative font-bold text-lg px-4 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                    isTransparent ? "drop-shadow-md" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>Bản đồ</span>
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                  ></span>
                </Link>
              </li>

              <li className="relative group">
                <Link
                  to="/tham-khao-gia"
                  className={`relative font-bold text-lg px-4 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                    isTransparent ? "drop-shadow-md" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>Thao khảo giá</span>
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                  ></span>
                </Link>
              </li>

              <li className="relative group">
                <Link
                  to="/tim-kiem"
                  className={`relative font-bold text-lg px-4 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
                    isTransparent ? "drop-shadow-md" : ""
                  }`}
                >
                  Tìm kiếm
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor}`}
                  ></span>
                </Link>
              </li>

              <li className="relative group">
                <Link
                  to="/lien-he"
                  className={`relative font-bold text-lg px-4 py-2 block transition-colors duration-300 ${textColor} ${textHoverColor} ${
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

            {/* Avatar / Login Button */}
            {currentUser ? (
              <div className="relative flex items-center gap-3">
                <NotificationBell isTransparent={isTransparent} />
                <div
                  className="overflow-hidden transition-all duration-300 transform border-2 border-blue-600 rounded-full cursor-pointer w-11 h-11 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-200 hover:scale-110"
                  onClick={toggleDropdown}
                >
                  <img
                    src={currentUser?.AnhDaiDien || "/placeholder.svg"}
                    alt="Avatar"
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Desktop Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 z-50 overflow-hidden bg-white border-2 border-gray-200 shadow-xl top-16 w-72 rounded-xl animate-slideDown">
                    <div className="p-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="m-0 text-base font-extrabold text-gray-900 truncate">
                        {currentUser?.HoTen || currentUser?.Email}
                      </p>
                      <p className="mt-2 text-sm font-bold tracking-wide text-gray-600 uppercase">
                        {currentUser?.LoaiTaiKhoan || "Người dùng"}
                      </p>
                    </div>

                    <Link
                      to="/ho-so"
                      className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      👤 <span>Thông tin cá nhân</span>
                    </Link>
                    <Link
                      to="/yeu-thich"
                      className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaHeart className="text-red-500" />{" "}
                      <span>Yêu thích</span>
                    </Link>
                    <Link
                      to="/quan-ly-bai-dang"
                      className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-green-50 hover:text-green-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      📝 <span>Quản lý bài đăng</span>
                    </Link>
                    <Link
                      to="/yeu-cau-lien-he"
                      className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      📬 <span>Yêu cầu liên hệ</span>
                    </Link>
                    <Link
                      to="/tin-nhan"
                      className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      💬 <span>Tin nhắn</span>
                    </Link>
                    {hasPermission(["admin"]) && (
                      <Link
                        to="/admin-panel"
                        className="flex items-center gap-3 px-5 py-3.5 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-amber-50 hover:text-amber-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        ⚙️ <span>Quản trị</span>
                      </Link>
                    )}
                    <button
                      className="flex items-center gap-3 w-full px-5 py-3.5 font-bold text-red-600 text-base transition-all duration-200 hover:bg-red-50 border-t-2 border-gray-200 focus:outline-none"
                      onClick={handleLogout}
                    >
                      🚪 <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="relative px-5 py-2.5 text-sm font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="relative z-10">Đăng nhập / Đăng ký</span>
                
              </Link>
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
            to="/tim-kiem"
            className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
          >
            <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
              <span className="text-xl">🔍</span>
            </div>
            <span>Tìm kiếm</span>
          </Link>

          <Link
            to="/lien-he"
            className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
          >
            <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
              <span className="text-xl">📞</span>
            </div>
            <span>Liên hệ</span>
          </Link>

          {/* User-specific menu */}
          {currentUser ? (
            <>
              <div className="mt-4 mb-2 ml-5 text-xs font-bold tracking-wide text-gray-500 uppercase">
                Tài khoản
              </div>

              <Link
                to="/ho-so"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">👤</span>
                </div>
                <span>Thông tin cá nhân</span>
              </Link>

              <Link
                to="/yeu-thich"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-red-50 hover:text-red-600"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <FaHeart className="text-red-500" size={18} />
                </div>
                <span>Yêu thích</span>
              </Link>

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
                to="/yeu-cau-lien-he"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">📬</span>
                </div>
                <span>Yêu cầu liên hệ</span>
              </Link>

              <Link
                to="/tin-nhan"
                className="flex items-center gap-3 px-5 py-4 text-base font-bold text-gray-800 transition-all duration-200 border-b border-gray-100 hover:bg-purple-50 hover:text-purple-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <span className="text-xl">💬</span>
                </div>
                <span>Tin nhắn</span>
              </Link>

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
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 mx-5 my-4 text-sm font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg py-3 shadow-sm"
            >
              <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                <span className="text-xl">👤</span>
              </div>
              <span>Đăng nhập / Đăng ký</span>
            </Link>
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
    </>
  );
};

export default Navbar;
