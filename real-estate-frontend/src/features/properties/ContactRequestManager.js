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
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
    icon: FaPhoneAlt,
  },
  DA_TU_VAN: {
    label: "Đã tư vấn",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dotClass: "bg-indigo-500",
    icon: FaComments,
  },
  DA_LIEN_HE: {
    label: "Đã tư vấn",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dotClass: "bg-indigo-500",
    icon: FaComments,
  },
  HOAN_THANH: {
    label: "Đã hoàn thành",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
    icon: FaCheckCircle,
  },
  DA_HUY: {
    label: "Đã hủy",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    dotClass: "bg-slate-400",
    icon: FaTimesCircle,
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
  const [stats, setStats] = useState({
    total: 0,
    moiNhan: 0,
    dangLienHe: 0,
    daTuVan: 0,
    hoanThanh: 0,
    daHuy: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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

  // 1. Fetch Received Requests (Môi giới)
  const fetchReceivedRequests = useCallback(async () => {
    try {
      setLoading(true);
      const [res, statsRes] = await Promise.all([
        axios.get(`${API_URL}/contact-requests/broker?limit=100`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_URL}/contact-requests/broker/stats`, {
          headers: getAuthHeaders(),
        }),
      ]);
      const items = res.data?.items || [];
      setReceivedRequests(items);
      setStats(
        statsRes.data || {
          total: 0,
          moiNhan: 0,
          dangLienHe: 0,
          daTuVan: 0,
          hoanThanh: 0,
          daHuy: 0,
          pending: 0,
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
      const res = await axios.get(`${API_URL}/contact-requests/customer?limit=100`, {
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
      return (num / 1000000000).toFixed(1).replace(".0", "") + " tỷ";
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + " triệu";
    }
    return num.toLocaleString("vi-VN") + " VNĐ";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
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

  // Filtered lists
  const filteredReceived = useMemo(() => {
    return receivedRequests.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.SoDienThoai.includes(searchTerm) ||
        (item.TieuDe && item.TieuDe.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStatus = true;
      if (filterStatus !== "all") {
        if (filterStatus === "MOI_NHAN") {
          matchStatus = item.TrangThai === "MOI_NHAN" || item.TrangThai === "CHUA_XU_LY";
        } else if (filterStatus === "DA_TU_VAN") {
          matchStatus = item.TrangThai === "DA_TU_VAN" || item.TrangThai === "DA_LIEN_HE";
        } else {
          matchStatus = item.TrangThai === filterStatus;
        }
      }

      return matchSearch && matchStatus;
    });
  }, [receivedRequests, searchTerm, filterStatus]);

  const filteredSent = useMemo(() => {
    return sentRequests.filter((item) => {
      const matchSearch =
        !searchTerm ||
        (item.TieuDe && item.TieuDe.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.TenMoiGioi && item.TenMoiGioi.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = filterStatus === "all" || item.TrangThai === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [sentRequests, searchTerm, filterStatus]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16 font-sans text-slate-800">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium flex items-center gap-2 animate-fadeIn ${
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
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                <FaEnvelopeOpenText />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Quản lý yêu cầu liên hệ & Nhận thông báo khách hàng
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi yêu cầu tư vấn tức thì, quản lý lịch sử liên hệ và cập nhật tiến độ tương tác
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/tim-kiem"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <FaSearch className="text-slate-400" />
              <span>Tìm kiếm nhà đất</span>
            </Link>
          </div>
        </div>

        {/* 4 TRẠNG THÁI KPI STRIP CHO MÔI GIỚI */}
        {activeTab === "received" && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Tổng */}
            <div
              onClick={() => setFilterStatus("all")}
              className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "all" ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">Tổng yêu cầu</div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                  <FaEnvelopeOpenText />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2">{stats.total}</div>
            </div>

            {/* 1. Mới nhận */}
            <div
              onClick={() => setFilterStatus("MOI_NHAN")}
              className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "MOI_NHAN"
                  ? "border-blue-600 ring-2 ring-blue-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-blue-700 font-semibold">1. Mới nhận</div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                  <FaClock />
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 mt-2">
                {stats.moiNhan || stats.pending || 0}
              </div>
            </div>

            {/* 2. Đang liên hệ */}
            <div
              onClick={() => setFilterStatus("DANG_LIEN_HE")}
              className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "DANG_LIEN_HE"
                  ? "border-amber-600 ring-2 ring-amber-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-amber-700 font-semibold">2. Đang liên hệ</div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                  <FaPhoneAlt />
                </div>
              </div>
              <div className="text-xl font-bold text-amber-600 mt-2">
                {stats.dangLienHe || 0}
              </div>
            </div>

            {/* 3. Đã tư vấn */}
            <div
              onClick={() => setFilterStatus("DA_TU_VAN")}
              className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === "DA_TU_VAN"
                  ? "border-indigo-600 ring-2 ring-indigo-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-indigo-700 font-semibold">3. Đã tư vấn</div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                  <FaComments />
                </div>
              </div>
              <div className="text-xl font-bold text-indigo-600 mt-2">
                {stats.daTuVan || stats.contacted || 0}
              </div>
            </div>

            {/* 4. Đã hoàn thành */}
            <div
              onClick={() => setFilterStatus("HOAN_THANH")}
              className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md col-span-2 sm:col-span-1 ${
                filterStatus === "HOAN_THANH"
                  ? "border-emerald-600 ring-2 ring-emerald-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-emerald-700 font-semibold">4. Đã hoàn thành</div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                  <FaCheckCircle />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-600 mt-2">
                {stats.hoanThanh || 0}
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
              }}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "received"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaEnvelopeOpenText />
              <span>Khách hàng gửi yêu cầu tư vấn ({receivedRequests.length})</span>
              {Number(stats.moiNhan || stats.pending) > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {stats.moiNhan || stats.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("sent");
                setSearchTerm("");
                setFilterStatus("all");
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

          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder={
                  activeTab === "received"
                    ? "Tìm theo tên khách, SĐT, tin đăng..."
                    : "Tìm theo tiêu đề tin, môi giới..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <FaFilter className="text-slate-400 text-xs hidden sm:block" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="MOI_NHAN">1. Mới nhận (Chờ xử lý)</option>
                <option value="DANG_LIEN_HE">2. Đang liên hệ</option>
                <option value="DA_TU_VAN">3. Đã tư vấn</option>
                <option value="HOAN_THANH">4. Đã hoàn thành</option>
                <option value="DA_HUY">Đã hủy / Không liên lạc</option>
              </select>
            </div>
          </div>

          {/* TAB 1: DANH SÁCH YÊU CẦU NHẬN ĐƯỢC (CHO MÔI GIỚI) */}
          {activeTab === "received" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-52">Khách hàng</th>
                    <th className="py-3 px-4">Bất động sản quan tâm</th>
                    <th className="py-3 px-4">Nội dung yêu cầu</th>
                    <th className="py-3 px-4 text-center w-36">Trạng thái</th>
                    <th className="py-3 px-4 text-center w-32">Thời gian</th>
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
                                title="Nhấn để gọi trực tiếp"
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
                          <td className="py-3.5 px-4">
                            <p className="text-slate-800 leading-relaxed whitespace-pre-line max-w-sm line-clamp-2">
                              {item.NoiDung}
                            </p>
                            {item.GhiChuMoiGioi && (
                              <div className="mt-1 p-1 bg-amber-50/80 border border-amber-200 rounded text-[11px] text-amber-900 truncate">
                                <strong>Ghi chú:</strong> {item.GhiChuMoiGioi}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderStatusBadge(item.TrangThai)}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                            {formatDate(item.NgayGui)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openDetailModal(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                              title="Xem chi tiết & Quản lý lịch sử tư vấn"
                            >
                              <FaEdit className="text-[10px]" />
                              <span>Xử lý</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <FaEnvelopeOpenText className="text-3xl mx-auto mb-2 text-slate-300" />
                        <p>Chưa có yêu cầu liên hệ nào phù hợp.</p>
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
                            {item.NoiDung}
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

      {/* MODAL CHI TIẾT & QUẢN LÝ LỊCH SỬ TƯ VẤN (CHO MÔI GIỚI) */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleIn max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
                  <FaEnvelopeOpenText />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Chi tiết yêu cầu tư vấn #{editingRequest.MaYCLH}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhận lúc {formatDate(editingRequest.NgayGui)}
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

            {/* Thông tin khách hàng & BĐS */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box Khách hàng */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FaUser className="text-blue-600 text-xs" />
                  <span>Thông tin khách hàng</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{editingRequest.HoTen}</div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-xs text-slate-500">Số điện thoại:</span>
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
                  <span>Bất động sản quan tâm</span>
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
                <span>Nội dung yêu cầu từ khách hàng:</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line italic">
                "{editingRequest.NoiDung}"
              </p>
            </div>

            {/* Lịch sử tư vấn (LichSuTuVan) */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2.5">
                <FaHistory className="text-slate-500 text-xs" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lịch sử liên hệ & Tiến trình tư vấn
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
                    Chưa có nhật ký ghi chú tư vấn trước đó.
                  </div>
                )}
              </div>
            </div>

            {/* Form cập nhật trạng thái mới */}
            <form onSubmit={handleUpdateStatus} className="mt-5 space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700">
                  Cập nhật trạng thái xử lý:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => handleUpdateStatus(e, "DANG_LIEN_HE")}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    📞 Đang liên hệ
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleUpdateStatus(e, "DA_TU_VAN")}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    💬 Đã tư vấn
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleUpdateStatus(e, "HOAN_THANH")}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    ✅ Hoàn thành
                  </button>
                </div>
              </div>

              <div>
                <select
                  value={statusForm.TrangThai}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, TrangThai: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="MOI_NHAN">1. Mới nhận (Khách vừa gửi)</option>
                  <option value="DANG_LIEN_HE">2. Đang liên hệ (Đã gọi / Đang hẹn lịch)</option>
                  <option value="DA_TU_VAN">3. Đã tư vấn (Đã cung cấp thông tin, dẫn xem nhà)</option>
                  <option value="HOAN_THANH">4. Đã hoàn thành (Chốt giao dịch / Kết thúc thành công)</option>
                  <option value="DA_HUY">Đã hủy / Không liên lạc được</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú nhật ký tư vấn mới:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đã gọi điện cho anh A, hẹn 9h sáng thứ 7 xem căn hộ..."
                  value={statusForm.GhiChuMoiGioi}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, GhiChuMoiGioi: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {updating ? "Đang lưu..." : "Lưu nhật ký & Trạng thái"}
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
