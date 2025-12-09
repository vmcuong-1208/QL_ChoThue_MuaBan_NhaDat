"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FaEnvelopeOpenText,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaExternalLinkAlt,
  FaUser,
  FaFilter,
  FaEdit,
  FaPaperPlane,
  FaInfoCircle,
  FaHistory,
  FaExchangeAlt,
  FaComments,
  FaRegCalendarAlt,
  FaCheck,
  FaStar,
  FaEye,
  FaHandshake,
  FaHome,
  FaUsers,
  FaCalendarCheck,
  FaBan,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { API_URL, SERVER_URL } from "../../services/api";
import ReviewModal from "../auth/ReviewModal";

const STATUS_CONFIG = {
  MOI_NHAN: {
    label: "Mới nhận",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
    icon: FaClock,
  },
  CHUA_XU_LY: {
    label: "Mới nhận",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
    icon: FaClock,
  },
  DANG_LIEN_HE: {
    label: "Đang liên hệ",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
    icon: FaPhoneAlt,
  },
  DANG_TU_VAN: {
    label: "Đang tư vấn",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
    icon: FaComments,
  },
  DA_TU_VAN: {
    label: "Đang tư vấn",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
    icon: FaComments,
  },
  DA_LIEN_HE: {
    label: "Đang tư vấn",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
    icon: FaComments,
  },
  DA_XEM_NHA: {
    label: "Đã xem nhà",
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
    dotClass: "bg-cyan-500",
    icon: FaEye,
  },
  DA_GIAO_DICH: {
    label: "Đã giao dịch",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
    icon: FaCheckCircle,
  },
  HOAN_THANH: {
    label: "Đã giao dịch",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
    icon: FaCheckCircle,
  },
  KHONG_NHU_CAU: {
    label: "Không có nhu cầu",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    dotClass: "bg-slate-400",
    icon: FaBan,
  },
  DA_HUY: {
    label: "Không có nhu cầu",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    dotClass: "bg-slate-400",
    icon: FaBan,
  },
};

const ContactRequestManager = () => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'received' (Môi giới) | 'sent' (Khách hàng)
  const isBrokerOrAdmin = useMemo(() => {
    const role = (currentUser?.LoaiTaiKhoan || "").toLowerCase();
    return (
      role.includes("môi") ||
      role.includes("broker") ||
      role.includes("admin") ||
      role.includes("đầu tư")
    );
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState(isBrokerOrAdmin ? "received" : "sent");

  // Data states
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [brokerProperties, setBrokerProperties] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    moiNhan: 0,
    dangLienHe: 0,
    dangTuVan: 0,
    daXemNha: 0,
    daGiaoDich: 0,
    khongNhuCau: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProperty, setFilterProperty] = useState("all");

  // Modal Note / Status Update
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedBrokerForReview, setSelectedBrokerForReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    TrangThai: "DANG_LIEN_HE",
    GhiChuMoiGioi: "",
  });
  const [updating, setUpdating] = useState(false);

  // Toast
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch Received Requests (Môi giới) & Stats & Properties
  const fetchReceivedRequests = useCallback(async () => {
    try {
      setLoading(true);
      const [res, statsRes, propsRes] = await Promise.all([
        axios.get(`${API_URL}/contact-requests/broker?limit=200`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_URL}/contact-requests/broker/stats`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_URL}/contact-requests/broker/properties`, {
          headers: getAuthHeaders(),
        }),
      ]);
      const items = res.data?.items || [];
      setReceivedRequests(items);
      setBrokerProperties(propsRes.data?.properties || []);
      setStats(
        statsRes.data || {
          total: 0,
          moiNhan: 0,
          dangLienHe: 0,
          dangTuVan: 0,
          daXemNha: 0,
          daGiaoDich: 0,
          khongNhuCau: 0,
        }
      );

      // Kiểm tra URL search param ?id= để tự động mở popup chi tiết
      const paramId = searchParams.get("id");
      if (paramId) {
        const found = items.find((it) => String(it.MaYCLH) === String(paramId));
        if (found) {
          setEditingRequest(found);
          setStatusForm({
            TrangThai:
              found.TrangThai === "MOI_NHAN" || found.TrangThai === "CHUA_XU_LY"
                ? "DANG_LIEN_HE"
                : found.TrangThai,
            GhiChuMoiGioi: "",
          });
        }
      }
    } catch (err) {
      console.warn("Lỗi tải yêu cầu môi giới:", err.message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // 2. Fetch Sent Requests (Khách hàng)
  const fetchSentRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/contact-requests/customer?limit=200`, {
        headers: getAuthHeaders(),
      });
      setSentRequests(res.data?.items || []);
    } catch (err) {
      console.warn("Lỗi tải yêu cầu khách hàng:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    if (activeTab === "received") {
      fetchReceivedRequests();
    } else {
      fetchSentRequests();
    }
  }, [activeTab, currentUser, navigate, fetchReceivedRequests, fetchSentRequests]);

  // 3. Lắng nghe Realtime Socket.IO khi có khách mới gửi yêu cầu
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewRequest = (data) => {
      if (data && Number(data.MaMoiGioi) === Number(currentUser.MaNgDung)) {
        showToast(
          `⚡ Có khách hàng ${data.HoTen} vừa gửi yêu cầu tư vấn tin "${data.TieuDe}"!`,
          "success"
        );
        fetchReceivedRequests();
      }
    };

    socket.on("new_contact_request", handleNewRequest);
    return () => {
      socket.off("new_contact_request", handleNewRequest);
    };
  }, [socket, currentUser, fetchReceivedRequests]);

  // 4. Mở modal chi tiết & xử lý yêu cầu
  const openDetailModal = (item) => {
    setEditingRequest(item);
    setStatusForm({
      TrangThai:
        item.TrangThai === "MOI_NHAN" || item.TrangThai === "CHUA_XU_LY"
          ? "DANG_LIEN_HE"
          : item.TrangThai,
      GhiChuMoiGioi: "",
    });
  };

  const closeDetailModal = () => {
    setEditingRequest(null);
    if (searchParams.get("id")) {
      searchParams.delete("id");
      setSearchParams(searchParams);
    }
  };

  // 5. Cập nhật trạng thái xử lý & lịch sử tư vấn
  const handleUpdateStatus = async (e, overrideStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingRequest) return;

    const targetStatus = overrideStatus || statusForm.TrangThai;

    try {
      setUpdating(true);
      await axios.patch(
        `${API_URL}/contact-requests/${editingRequest.MaYCLH}/status`,
        {
          TrangThai: targetStatus,
          GhiChuMoiGioi: statusForm.GhiChuMoiGioi.trim(),
        },
        { headers: getAuthHeaders() }
      );

      showToast("Cập nhật trạng thái & ghi chép lịch sử tư vấn thành công!");
      closeDetailModal();
      fetchReceivedRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi cập nhật trạng thái", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Format currency
  const formatPrice = (price) => {
    if (!price || Number(price) === 0) return "Thỏa thuận";
    const num = Number(price);
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2).replace(/\.00$/, "")} tỷ`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(0)} triệu`;
    }
    return num.toLocaleString("vi-VN") + " đ";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderImageUrl = (url) => {
    if (!url) return "/placeholder.svg?height=80&width=120";
    if (url.startsWith("http")) return url;
    return `${SERVER_URL}${url}`;
  };

  // Render Status Badge
  const renderStatusBadge = (statusKey) => {
    const config = STATUS_CONFIG[statusKey] || {
      label: statusKey || "Chưa xác định",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      dotClass: "bg-slate-400",
      icon: FaInfoCircle,
    };
    const Icon = config.icon;
    const isNew = statusKey === "MOI_NHAN" || statusKey === "CHUA_XU_LY";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
          config.badgeClass
        } ${isNew ? "animate-pulse" : ""}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        <Icon className="text-[10px]" />
        <span>{config.label}</span>
      </span>
    );
  };

  // Filtered lists for broker
  const filteredReceived = useMemo(() => {
    return receivedRequests.filter((item) => {
      // Tìm kiếm theo tên khách hàng hoặc số điện thoại (và email, tiêu đề)
      const kw = searchTerm.trim().toLowerCase();
      const matchSearch =
        !kw ||
        item.HoTen?.toLowerCase().includes(kw) ||
        item.SoDienThoai?.includes(kw) ||
        (item.Email && item.Email.toLowerCase().includes(kw)) ||
        (item.TieuDe && item.TieuDe.toLowerCase().includes(kw)) ||
        String(item.MaTTND) === kw;

      // Lọc theo trạng thái xử lý
      let matchStatus = true;
      if (filterStatus !== "all") {
        if (filterStatus === "MOI_NHAN") {
          matchStatus = item.TrangThai === "MOI_NHAN" || item.TrangThai === "CHUA_XU_LY";
        } else if (filterStatus === "DANG_LIEN_HE") {
          matchStatus = item.TrangThai === "DANG_LIEN_HE";
        } else if (filterStatus === "DANG_TU_VAN") {
          matchStatus =
            item.TrangThai === "DANG_TU_VAN" ||
            item.TrangThai === "DA_TU_VAN" ||
            item.TrangThai === "DA_LIEN_HE";
        } else if (filterStatus === "DA_XEM_NHA") {
          matchStatus = item.TrangThai === "DA_XEM_NHA";
        } else if (filterStatus === "DA_GIAO_DICH") {
          matchStatus = item.TrangThai === "DA_GIAO_DICH" || item.TrangThai === "HOAN_THANH";
        } else if (filterStatus === "KHONG_NHU_CAU") {
          matchStatus = item.TrangThai === "KHONG_NHU_CAU" || item.TrangThai === "DA_HUY";
        } else {
          matchStatus = item.TrangThai === filterStatus;
        }
      }

      // Lọc theo tin đăng bất động sản
      let matchProperty = true;
      if (filterProperty !== "all") {
        matchProperty = String(item.MaTTND) === String(filterProperty);
      }

      return matchSearch && matchStatus && matchProperty;
    });
  }, [receivedRequests, searchTerm, filterStatus, filterProperty]);

  const filteredSent = useMemo(() => {
    return sentRequests.filter((item) => {
      const kw = searchTerm.trim().toLowerCase();
      const matchSearch =
        !kw ||
        (item.TieuDe && item.TieuDe.toLowerCase().includes(kw)) ||
        (item.TenMoiGioi && item.TenMoiGioi.toLowerCase().includes(kw));
      const matchStatus = filterStatus === "all" || item.TrangThai === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [sentRequests, searchTerm, filterStatus]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16 font-sans text-slate-800">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.type === "error" ? <FaTimesCircle /> : <FaCheckCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* TOP HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-sm">
                <FaUsers />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Quản lý khách hàng quan tâm
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Theo dõi nhu cầu, lưu trữ lịch sử liên hệ và cập nhật tiến độ chăm sóc khách hàng tiềm năng (Leads)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReceivedRequests}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            >
              <FaClock className="text-slate-400" />
              <span>Làm mới dữ liệu</span>
            </button>
            <Link
              to="/tim-kiem"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <FaSearch />
              <span>Tìm kiếm nhà đất</span>
            </Link>
          </div>
        </div>

        {/* 6 TRẠNG THÁI KPI STRIP CHO MÔI GIỚI (CRM LEADS PIPELINE) */}
        {activeTab === "received" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Tổng số khách */}
            <div
              onClick={() => {
                setFilterStatus("all");
                setFilterProperty("all");
              }}
              className={`bg-white p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "all" ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">Tổng khách hàng</div>
              <div className="text-xl font-black mt-1">{stats.total}</div>
            </div>

            {/* 1. Mới nhận */}
            <div
              onClick={() => setFilterStatus("MOI_NHAN")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "MOI_NHAN"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-slate-800 border-slate-200 hover:border-blue-300"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                <span>Mới nhận</span>
              </div>
              <div className={`text-xl font-black mt-1 ${filterStatus === "MOI_NHAN" ? "text-white" : "text-blue-600"}`}>
                {stats.moiNhan || 0}
              </div>
            </div>

            {/* 2. Đang liên hệ */}
            <div
              onClick={() => setFilterStatus("DANG_LIEN_HE")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "DANG_LIEN_HE"
                  ? "bg-amber-600 text-white border-amber-600 shadow-md"
                  : "bg-white text-slate-800 border-slate-200 hover:border-amber-300"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">Đang liên hệ</div>
              <div className={`text-xl font-black mt-1 ${filterStatus === "DANG_LIEN_HE" ? "text-white" : "text-amber-600"}`}>
                {stats.dangLienHe || 0}
              </div>
            </div>

            {/* 3. Đang tư vấn */}
            <div
              onClick={() => setFilterStatus("DANG_TU_VAN")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "DANG_TU_VAN"
                  ? "bg-purple-600 text-white border-purple-600 shadow-md"
                  : "bg-white text-slate-800 border-slate-200 hover:border-purple-300"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">Đang tư vấn</div>
              <div className={`text-xl font-black mt-1 ${filterStatus === "DANG_TU_VAN" ? "text-white" : "text-purple-600"}`}>
                {stats.dangTuVan || 0}
              </div>
            </div>

            {/* 4. Đã xem nhà */}
            <div
              onClick={() => setFilterStatus("DA_XEM_NHA")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "DA_XEM_NHA"
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-md"
                  : "bg-white text-slate-800 border-slate-200 hover:border-cyan-300"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">Đã xem nhà</div>
              <div className={`text-xl font-black mt-1 ${filterStatus === "DA_XEM_NHA" ? "text-white" : "text-cyan-600"}`}>
                {stats.daXemNha || 0}
              </div>
            </div>

            {/* 5. Đã giao dịch */}
            <div
              onClick={() => setFilterStatus("DA_GIAO_DICH")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "DA_GIAO_DICH"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-white text-slate-800 border-slate-200 hover:border-emerald-300"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">Đã giao dịch</div>
              <div className={`text-xl font-black mt-1 ${filterStatus === "DA_GIAO_DICH" ? "text-white" : "text-emerald-600"}`}>
                {stats.daGiaoDich || 0}
              </div>
            </div>

            {/* 6. Không có nhu cầu */}
            <div
              onClick={() => setFilterStatus("KHONG_NHU_CAU")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "KHONG_NHU_CAU"
                  ? "bg-slate-700 text-white border-slate-700 shadow-md"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">Không có nhu cầu</div>
              <div className={`text-xl font-black mt-1 ${filterStatus === "KHONG_NHU_CAU" ? "text-white" : "text-slate-500"}`}>
                {stats.khongNhuCau || 0}
              </div>
            </div>
          </div>
        )}

        {/* TABS & FILTER BAR */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-4">
            <button
              onClick={() => {
                setActiveTab("received");
                setSearchTerm("");
                setFilterStatus("all");
                setFilterProperty("all");
              }}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "received"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaUsers />
              <span>Khách hàng quan tâm ({receivedRequests.length})</span>
              {Number(stats.moiNhan) > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {stats.moiNhan}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("sent");
                setSearchTerm("");
                setFilterStatus("all");
                setFilterProperty("all");
              }}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "sent"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaPaperPlane />
              <span>Yêu cầu bạn đã gửi đi ({sentRequests.length})</span>
            </button>
          </div>

          {/* Filter Bar: Tìm kiếm theo tên hoặc SĐT + Lọc theo trạng thái + Lọc theo tin đăng */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
            {/* 1. Tìm kiếm theo tên hoặc số điện thoại */}
            <div className="relative w-full md:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder={
                  activeTab === "received"
                    ? "Tìm theo tên khách hoặc số điện thoại..."
                    : "Tìm theo tiêu đề tin, môi giới..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>

            {/* 2. Bộ lọc trạng thái & Bộ lọc tin đăng BĐS */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              {/* Lọc theo tin đăng BĐS (chỉ dành cho tab nhận yêu cầu của môi giới) */}
              {activeTab === "received" && (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <FaHome className="text-slate-400 text-xs hidden sm:block" />
                  <select
                    value={filterProperty}
                    onChange={(e) => setFilterProperty(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-60 truncate"
                  >
                    <option value="all">Tất cả tin đăng bất động sản</option>
                    {brokerProperties.map((prop) => (
                      <option key={prop.MaTTND} value={prop.MaTTND}>
                        #{prop.MaTTND} - {prop.TieuDe?.slice(0, 32)} ({prop.totalLeads} khách)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lọc theo trạng thái xử lý */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <FaFilter className="text-slate-400 text-xs hidden sm:block" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="MOI_NHAN">1. Mới nhận ({stats.moiNhan || 0})</option>
                  <option value="DANG_LIEN_HE">2. Đang liên hệ ({stats.dangLienHe || 0})</option>
                  <option value="DANG_TU_VAN">3. Đang tư vấn ({stats.dangTuVan || 0})</option>
                  <option value="DA_XEM_NHA">4. Đã xem nhà ({stats.daXemNha || 0})</option>
                  <option value="DA_GIAO_DICH">5. Đã giao dịch ({stats.daGiaoDich || 0})</option>
                  <option value="KHONG_NHU_CAU">6. Không có nhu cầu ({stats.khongNhuCau || 0})</option>
                </select>
              </div>
            </div>
          </div>

          {/* TAB 1: DANH SÁCH KHÁCH HÀNG QUAN TÂM (MÔI GIỚI) */}
          {activeTab === "received" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-52">Khách hàng</th>
                    <th className="py-3 px-4">Tin đăng quan tâm</th>
                    <th className="py-3 px-4">Nội dung yêu cầu</th>
                    <th className="py-3 px-4 text-center w-36">Trạng thái xử lý</th>
                    <th className="py-3 px-4 text-center w-32">Ngày gửi</th>
                    <th className="py-3 px-4 text-right w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredReceived.length > 0 ? (
                    filteredReceived.map((item, idx) => {
                      const isTargeted =
                        searchParams.get("id") &&
                        String(item.MaYCLH) === String(searchParams.get("id"));

                      return (
                        <tr
                          key={item.MaYCLH}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isTargeted ? "bg-blue-50/60 ring-2 ring-blue-400" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>

                          {/* Khách hàng: Họ và tên, SĐT, Email */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <FaUser className="text-slate-400 text-xs flex-shrink-0" />
                              <span>{item.HoTen}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-slate-600">
                              <FaPhoneAlt className="text-emerald-600 text-[10px]" />
                              <a
                                href={`tel:${item.SoDienThoai}`}
                                className="font-semibold text-blue-600 hover:underline"
                                title="Nhấn để gọi cho khách hàng"
                              >
                                {item.SoDienThoai}
                              </a>
                            </div>
                            {item.Email && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-[11px] truncate">
                                <FaEnvelope className="text-slate-400 text-[10px]" />
                                <span className="truncate">{item.Email}</span>
                              </div>
                            )}
                          </td>

                          {/* Tin đăng quan tâm */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-2.5 max-w-xs">
                              <img
                                src={renderImageUrl(item.HinhAnhBDS)}
                                alt="BĐS"
                                className="w-12 h-10 rounded object-cover flex-shrink-0 border border-slate-200"
                                onError={(e) => {
                                  e.target.src = "/placeholder.svg?height=40&width=48";
                                }}
                              />
                              <div className="min-w-0">
                                <Link
                                  to={`/bat-dong-san/${item.MaTTND}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1 flex items-center gap-1"
                                  title={item.TieuDe}
                                >
                                  <span>{item.TieuDe || `BDS#${item.MaTTND}`}</span>
                                  <FaExternalLinkAlt className="text-[9px] text-slate-400 flex-shrink-0" />
                                </Link>
                                <div className="text-red-600 font-bold text-xs mt-0.5">
                                  {formatPrice(item.Gia)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Nội dung yêu cầu */}
                          <td className="py-3.5 px-4">
                            <p className="text-slate-800 leading-relaxed whitespace-pre-line max-w-sm line-clamp-2">
                              "{item.NoiDung}"
                            </p>
                            {item.GhiChuMoiGioi && (
                              <div className="mt-1 p-1 bg-amber-50/80 border border-amber-200 rounded text-[11px] text-amber-900 truncate">
                                <strong>Ghi chú:</strong> {item.GhiChuMoiGioi}
                              </div>
                            )}
                          </td>

                          {/* Trạng thái xử lý */}
                          <td className="py-3.5 px-4 text-center">
                            {renderStatusBadge(item.TrangThai)}
                          </td>

                          {/* Ngày gửi yêu cầu */}
                          <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                            {formatDate(item.NgayGui)}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openDetailModal(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                              title="Xem chi tiết & Quản lý chăm sóc khách hàng"
                            >
                              <FaEdit className="text-[10px]" />
                              <span>Chăm sóc</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <FaEnvelopeOpenText className="text-3xl mx-auto mb-2 text-slate-300" />
                        <p>Không tìm thấy khách hàng nào phù hợp với bộ lọc.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: DANH SÁCH YÊU CẦU ĐÃ GỬI (CHO KHÁCH HÀNG) */}
          {activeTab === "sent" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Bất động sản đã hỏi</th>
                    <th className="py-3 px-4 w-52">Môi giới phụ trách</th>
                    <th className="py-3 px-4">Nội dung bạn gửi</th>
                    <th className="py-3 px-4 text-center w-36">Trạng thái</th>
                    <th className="py-3 px-4 text-center w-32">Thời gian gửi</th>
                    <th className="py-3 px-4 text-right w-28">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredSent.length > 0 ? (
                    filteredSent.map((item, idx) => (
                      <tr key={item.MaYCLH} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5 max-w-sm">
                            <img
                              src={renderImageUrl(item.HinhAnhBDS)}
                              alt="BĐS"
                              className="w-14 h-11 rounded object-cover flex-shrink-0 border border-slate-200"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=44&width=56";
                              }}
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/bat-dong-san/${item.MaTTND}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1 flex items-center gap-1"
                                title={item.TieuDe}
                              >
                                <span>{item.TieuDe || `BDS#${item.MaTTND}`}</span>
                                <FaExternalLinkAlt className="text-[9px] text-slate-400 flex-shrink-0" />
                              </Link>
                              <div className="text-red-600 font-bold text-xs mt-0.5">
                                {formatPrice(item.Gia)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {item.TenMoiGioi || "Nhà môi giới"}
                          </div>
                          {item.SDTMoiGioi && (
                            <div className="flex items-center gap-1.5 mt-1 text-slate-600">
                              <FaPhoneAlt className="text-emerald-600 text-[10px]" />
                              <a
                                href={`tel:${item.SDTMoiGioi}`}
                                className="font-semibold text-blue-600 hover:underline"
                              >
                                {item.SDTMoiGioi}
                              </a>
                            </div>
                          )}
                          {item.TrangThaiXacMinhMoiGioi === "VERIFIED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 mt-1">
                              <FaCheckCircle className="text-[9px]" /> Môi giới đã xác minh
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 leading-relaxed whitespace-pre-line max-w-sm">
                            "{item.NoiDung}"
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(item.TrangThai)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                          {formatDate(item.NgayGui)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBrokerForReview({
                                MaNgDung: item.MaMoiGioi,
                                HoTen: item.TenMoiGioi,
                                Email: item.EmailMoiGioi,
                                Avatar: item.AvatarMoiGioi,
                                TrangThaiXacMinhMoiGioi: item.TrangThaiXacMinhMoiGioi,
                              });
                              setShowReviewModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                            title="Đánh giá chất lượng dịch vụ của môi giới này"
                          >
                            <FaStar className="text-amber-500 text-[10px]" />
                            <span>Đánh giá</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <FaPaperPlane className="text-3xl mx-auto mb-2 text-slate-300" />
                        <p>Bạn chưa gửi yêu cầu tư vấn nào.</p>
                        <Link
                          to="/tim-kiem"
                          className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Khám phá bất động sản ngay
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT KHÁCH HÀNG & CẬP NHẬT TIẾN ĐỘ CHĂM SÓC */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleIn max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                  <FaUser />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Chi tiết khách hàng quan tâm #{editingRequest.MaYCLH}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gửi yêu cầu lúc: {formatDate(editingRequest.NgayGui)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Thông tin khách hàng & BĐS quan tâm */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box Khách hàng */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FaUser className="text-blue-600 text-xs" />
                  <span>Khách hàng</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{editingRequest.HoTen}</div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-xs text-slate-500">SĐT:</span>
                  <a
                    href={`tel:${editingRequest.SoDienThoai}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    <FaPhoneAlt className="text-[10px]" />
                    <span>{editingRequest.SoDienThoai}</span>
                  </a>
                </div>
                {editingRequest.Email && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">Email:</span>
                    <a
                      href={`mailto:${editingRequest.Email}`}
                      className="text-xs font-medium text-blue-600 hover:underline truncate max-w-[180px]"
                    >
                      {editingRequest.Email}
                    </a>
                  </div>
                )}
              </div>

              {/* Box BĐS */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FaExternalLinkAlt className="text-blue-600 text-xs" />
                  <span>Tin đăng quan tâm</span>
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">
                  {editingRequest.TieuDe}
                </div>
                <div className="text-xs text-red-600 font-extrabold">
                  {formatPrice(editingRequest.Gia)}
                </div>
                <Link
                  to={`/bat-dong-san/${editingRequest.MaTTND}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline mt-1"
                >
                  <span>Xem tin đăng trên web</span>
                  <FaExternalLinkAlt className="text-[9px]" />
                </Link>
              </div>
            </div>

            {/* Nội dung khách hàng gửi */}
            <div className="mt-4 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <div className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                <FaComments className="text-blue-600" />
                <span>Nội dung yêu cầu từ khách:</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line italic">
                "{editingRequest.NoiDung}"
              </p>
            </div>

            {/* Lịch sử tiến trình chăm sóc khách hàng (LichSuTuVan) */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                <FaHistory className="text-slate-500 text-xs" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lịch sử chăm sóc & Tiến trình tư vấn
                </h4>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-40 overflow-y-auto divide-y divide-slate-200/70 text-xs space-y-2">
                {Array.isArray(editingRequest.LichSuTuVan) &&
                editingRequest.LichSuTuVan.length > 0 ? (
                  editingRequest.LichSuTuVan.map((hist, idx) => (
                    <div key={idx} className="pt-2 first:pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span className="font-bold text-slate-900">
                            {STATUS_CONFIG[hist.trangThai]?.label || hist.trangThai}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(hist.thoiGian)}
                        </span>
                      </div>
                      {hist.ghiChu && (
                        <p className="text-slate-600 mt-1 pl-4 italic">
                          "{hist.ghiChu}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-slate-400 text-xs">
                    Chưa có nhật ký chăm sóc khách hàng trước đó.
                  </div>
                )}
              </div>
            </div>

            {/* Form cập nhật trạng thái xử lý theo 6 mốc nghiệp vụ */}
            <form onSubmit={handleUpdateStatus} className="mt-5 space-y-3 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Cập nhật trạng thái xử lý của khách hàng:
                </label>

                {/* 6 Quick Action Status Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusForm({ ...statusForm, TrangThai: "MOI_NHAN" })}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                      statusForm.TrangThai === "MOI_NHAN"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    <FaClock className="text-[10px]" />
                    <span>1. Mới nhận</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusForm({ ...statusForm, TrangThai: "DANG_LIEN_HE" })}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                      statusForm.TrangThai === "DANG_LIEN_HE"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <FaPhoneAlt className="text-[10px]" />
                    <span>2. Đang liên hệ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusForm({ ...statusForm, TrangThai: "DANG_TU_VAN" })}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                      statusForm.TrangThai === "DANG_TU_VAN"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                    }`}
                  >
                    <FaComments className="text-[10px]" />
                    <span>3. Đang tư vấn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusForm({ ...statusForm, TrangThai: "DA_XEM_NHA" })}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                      statusForm.TrangThai === "DA_XEM_NHA"
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                        : "bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100"
                    }`}
                  >
                    <FaEye className="text-[10px]" />
                    <span>4. Đã xem nhà</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusForm({ ...statusForm, TrangThai: "DA_GIAO_DICH" })}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                      statusForm.TrangThai === "DA_GIAO_DICH"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <FaCheckCircle className="text-[10px]" />
                    <span>5. Đã giao dịch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusForm({ ...statusForm, TrangThai: "KHONG_NHU_CAU" })}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                      statusForm.TrangThai === "KHONG_NHU_CAU"
                        ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <FaBan className="text-[10px]" />
                    <span>6. Không có nhu cầu</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhật ký ghi chú chăm sóc khách hàng:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đã gọi điện cho khách, khách muốn xem nhà lúc 9h sáng thứ 7. Khách thiện chí và đang cân nhắc tài chính..."
                  value={statusForm.GhiChuMoiGioi}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, GhiChuMoiGioi: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {updating ? "Đang lưu..." : "Lưu cập nhật trạng thái"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW MODAL CHO KHÁCH HÀNG ĐÁNH GIÁ MÔI GIỚI */}
      {selectedBrokerForReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBrokerForReview(null);
          }}
          broker={selectedBrokerForReview}
          onSuccess={() => {
            showToast("Gửi nhận xét và đánh giá môi giới thành công!");
          }}
        />
      )}
    </div>
  );
};

export default ContactRequestManager;
