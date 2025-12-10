"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBell,
  FaCheckDouble,
  FaUser,
  FaPhoneAlt,
  FaHome,
  FaClock,
  FaAngleRight,
  FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { API_URL } from "../../services/api";

const NotificationBell = ({ isTransparent = false }) => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Tải danh sách thông báo từ API
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/notifications?limit=20`, {
        headers: getAuthHeaders(),
      });
      if (res.data) {
        setNotifications(res.data.items || []);
        setUnreadCount(Number(res.data.unreadCount) || 0);
      }
    } catch (err) {
      console.warn("[NotificationBell] Lỗi lấy thông báo:", err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
    // Tự động đồng bộ mỗi 15 giây
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 2. Lắng nghe thông báo Realtime từ Socket.IO
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Sự kiện có thông báo chung
    const handleNewNotification = (data) => {
      if (data && Number(data.MaNgDung) === Number(currentUser.MaNgDung)) {
        setNotifications((prev) => [data, ...prev.filter((n) => n.MaTB !== data.MaTB)]);
        setUnreadCount((prev) => prev + 1);

        // Toast thông báo nổi bật
        toast.info(
          <div>
            <div className="font-bold text-sm text-blue-900">🔔 {data.TieuDe}</div>
            <div className="text-xs text-slate-700 mt-1 line-clamp-2">
              {data.DuLieuThem?.HoTen
                ? `Khách hàng: ${data.DuLieuThem.HoTen} - SĐT: ${data.DuLieuThem.SoDienThoai}`
                : data.NoiDung}
            </div>
          </div>,
          { autoClose: 6000 }
        );
      }
    };

    // Sự kiện đặc thù có khách hàng mới gửi yêu cầu tư vấn
    const handleNewContactRequest = (data) => {
      if (data && Number(data.MaMoiGioi) === Number(currentUser.MaNgDung)) {
        setUnreadCount((prev) => prev + 1);
        fetchNotifications();

        toast.success(
          <div>
            <div className="font-bold text-sm text-emerald-800">
              ⚡ Có khách hàng mới liên hệ tư vấn!
            </div>
            <div className="text-xs text-slate-700 mt-1">
              <div><strong>Khách:</strong> {data.HoTen} ({data.SoDienThoai})</div>
              <div className="truncate"><strong>Tin:</strong> {data.TieuDe}</div>
            </div>
          </div>,
          { autoClose: 7000 }
        );
      }
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("new_contact_request", handleNewContactRequest);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("new_contact_request", handleNewContactRequest);
    };
  }, [socket, currentUser, fetchNotifications]);

  // 3. Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 4. Đánh dấu tất cả đã đọc
  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await axios.patch(`${API_URL}/notifications/read-all`, {}, {
        headers: getAuthHeaders(),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, TrangThaiDoc: 1 }))
      );
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
    } catch (err) {
      toast.error("Không thể đánh dấu đã đọc. Vui lòng thử lại!");
    }
  };

  // 5. Click vào từng thông báo
  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.TrangThaiDoc) {
        axios.patch(`${API_URL}/notifications/${notif.MaTB}/read`, {}, {
          headers: getAuthHeaders(),
        }).catch(() => {});

        setNotifications((prev) =>
          prev.map((n) => (n.MaTB === notif.MaTB ? { ...n, TrangThaiDoc: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setIsOpen(false);
      if (notif.LienKet) {
        navigate(notif.LienKet);
      } else {
        navigate("/yeu-cau-lien-he");
      }
    } catch (err) {
      console.warn("Lỗi xử lý click thông báo:", err);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => {
            if (!prev) {
              fetchNotifications();
            }
            return !prev;
          });
        }}
        className={`relative p-2.5 rounded-full transition-all duration-200 focus:outline-none ${
          isTransparent
            ? "text-white hover:bg-white/20"
            : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"
        }`}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <FaBell className="text-xl" />

        {/* Badge số lượng thông báo chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white shadow-md ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Thông Báo */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden animate-slideDown text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <FaBell className="text-white text-base" />
              <span className="font-bold text-sm tracking-wide">Thông báo</span>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90 hover:text-white hover:underline transition-colors"
                title="Đánh dấu tất cả đã đọc"
              >
                <FaCheckDouble className="text-xs" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 text-xl">
                  <FaBell />
                </div>
                <p className="text-xs font-semibold text-slate-600">Bạn chưa có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Khi khách hàng gửi yêu cầu tư vấn tin đăng của bạn, thông báo sẽ hiển thị ở đây.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.TrangThaiDoc;
                const extra = item.DuLieuThem || {};
                return (
                  <div
                    key={item.MaTB}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-left relative ${
                      isUnread
                        ? "bg-blue-50/70 hover:bg-blue-100/70"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {/* Icon đại diện */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-xs ${
                        isUnread
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.LoaiTB === "LIEN_HE" ? (
                        <FaPhoneAlt />
                      ) : item.LoaiTB === "TIN_NOI_BAT" ? (
                        <span className="text-amber-500 font-black text-xs">⭐</span>
                      ) : (
                        <FaInfoCircle />
                      )}
                    </div>

                    {/* Nội dung thông báo theo đúng mẫu chuẩn */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isUnread ? "text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {item.TieuDe}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </div>

                      {/* Thông tin chi tiết khách hàng và tin đăng */}
                      {extra.HoTen ? (
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <FaUser className="text-[10px] text-slate-400" />
                            <span>Khách hàng: {extra.HoTen}</span>
                          </div>
                          {extra.SoDienThoai && (
                            <div className="flex items-center gap-1 text-blue-700 font-semibold">
                              <FaPhoneAlt className="text-[9px] text-emerald-600" />
                              <span>SĐT: {extra.SoDienThoai}</span>
                            </div>
                          )}
                          {extra.TieuDe && (
                            <div className="flex items-center gap-1 text-slate-600 truncate">
                              <FaHome className="text-[10px] text-slate-400 flex-shrink-0" />
                              <span className="truncate">Tin: {extra.TieuDe}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                            <FaClock className="text-[9px]" />
                            <span>{extra.ThoiGian || new Date(item.NgayTao).toLocaleString("vi-VN")}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-600 line-clamp-3 whitespace-pre-line">
                          {item.NoiDung}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                            <FaClock className="text-[9px]" />
                            <span>{new Date(item.NgayTao).toLocaleString("vi-VN")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/yeu-cau-lien-he");
              }}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Xem tất cả yêu cầu liên hệ</span>
              <FaAngleRight className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
