"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaPhoneAlt,
  FaCalendarAlt,
  FaEye,
  FaHome,
  FaStar,
  FaBan,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaImages,
  FaExternalLinkAlt,
  FaRedo,
  FaCheck,
  FaFileAlt,
  FaVideo,
} from "react-icons/fa";
import { API_URL, SERVER_URL } from "../../services/api";

const REJECT_REASONS = [
  "Thông tin không đầy đủ (thiếu mô tả chi tiết, diện tích, giá)",
  "Hình ảnh không liên quan, mờ hoặc dính logo/watermark của đơn vị khác",
  "Giá bất động sản không hợp lý so với mặt bằng thị trường",
  "Trùng lặp với tin đăng khác đã có trên hệ thống",
  "Sai loại hình bất động sản hoặc sai địa chỉ hành chính",
];

const REMOVE_REASONS = [
  "Tin giả / Lừa đảo / Chiếm đoạt thông tin",
  "Thông tin sai sự thật về pháp lý hoặc hiện trạng BĐS",
  "Bất động sản không còn giao dịch (đã bán / cho thuê từ lâu)",
  "Spam đăng lại nhiều lần gây loãng website",
  "Nội dung phản cảm, vi phạm tiêu chuẩn cộng đồng hoặc pháp luật",
];

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

const formatDate = (dateString) => {
  if (!dateString) return "Chưa có";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Chưa có";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "Chưa có";
  }
};

const PropertyModerationManager = () => {
  const [properties, setProperties] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    removed: 0,
    featured: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' | 'featured'
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals & Action states
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [detailProperty, setDetailProperty] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Dialog Reason (Reject or Remove)
  const [reasonDialog, setReasonDialog] = useState({
    isOpen: false,
    type: "REJECT", // 'REJECT' | 'REMOVE'
    propertyId: null,
    propertyTitle: "",
  });
  const [selectedPresetReason, setSelectedPresetReason] = useState("");
  const [customReasonText, setCustomReasonText] = useState("");

  // Toast feedback
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch properties list
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/properties`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter,
          search: debouncedSearch,
          page: currentPage,
          limit: 10,
        },
      });

      setProperties(res.data.properties || []);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("[PropertyModeration] Error fetching properties:", err);
      showToast("Không thể tải danh sách tin đăng.", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // View detail
  const handleOpenDetail = async (propId) => {
    try {
      setSelectedPropertyId(propId);
      setShowDetailModal(true);
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/properties/${propId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetailProperty(res.data);
    } catch (err) {
      console.error("[PropertyModeration] Error getting detail:", err);
      showToast("Không thể tải chi tiết tin đăng.", "error");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Approve action
  const handleApprove = async (propertyId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/admin/properties/${propertyId}/status`,
        { status: "APPROVED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("✅ Đã duyệt tin đăng thành công! Tin đã xuất hiện trên website.");
      fetchProperties();
      if (showDetailModal && detailProperty?.MaTTND === propertyId) {
        setDetailProperty((prev) => ({
          ...prev,
          TrangThaiDuyet: "APPROVED",
          LyDoTuChoi: null,
        }));
      }
    } catch (err) {
      console.error("[PropertyModeration] Error approving:", err);
      showToast(err.response?.data?.message || "Lỗi khi duyệt tin.", "error");
    }
  };

  // Toggle Featured action
  const handleToggleFeatured = async (propertyId, currentVal) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/admin/properties/${propertyId}/feature`,
        { featured: !currentVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const isNowFeatured = res.data.data.Featured;
      showToast(
        isNowFeatured
          ? "⭐ Đã đánh dấu tin nổi bật! Tin sẽ hiển thị ưu tiên đầu trang."
          : "Đã hủy đánh dấu tin nổi bật."
      );
      fetchProperties();
      if (showDetailModal && detailProperty?.MaTTND === propertyId) {
        setDetailProperty((prev) => ({
          ...prev,
          Featured: isNowFeatured,
          isFeatured: isNowFeatured,
        }));
      }
    } catch (err) {
      console.error("[PropertyModeration] Error toggling featured:", err);
      showToast("Lỗi khi cập nhật trạng thái nổi bật.", "error");
    }
  };

  // Open reason dialog (Reject or Remove)
  const openReasonDialog = (type, prop) => {
    setReasonDialog({
      isOpen: true,
      type,
      propertyId: prop.MaTTND,
      propertyTitle: prop.TieuDe,
    });
    setSelectedPresetReason(type === "REJECT" ? REJECT_REASONS[0] : REMOVE_REASONS[0]);
    setCustomReasonText("");
  };

  // Submit Reject or Remove
  const handleConfirmReason = async () => {
    const finalReason = customReasonText.trim()
      ? `${selectedPresetReason}: ${customReasonText.trim()}`
      : selectedPresetReason;

    if (!finalReason) {
      showToast("Vui lòng chọn hoặc nhập lý do!", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const newStatus = reasonDialog.type === "REJECT" ? "REJECTED" : "REMOVED";
      await axios.put(
        `${API_URL}/admin/properties/${reasonDialog.propertyId}/status`,
        {
          status: newStatus,
          lyDoTuChoi: finalReason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(
        newStatus === "REJECTED"
          ? "❌ Đã từ chối tin đăng thành công."
          : "🚫 Đã gỡ tin vi phạm khỏi website!"
      );

      setReasonDialog({ isOpen: false, type: "REJECT", propertyId: null, propertyTitle: "" });
      fetchProperties();

      if (showDetailModal && detailProperty?.MaTTND === reasonDialog.propertyId) {
        setDetailProperty((prev) => ({
          ...prev,
          TrangThaiDuyet: newStatus,
          LyDoTuChoi: finalReason,
        }));
      }
    } catch (err) {
      console.error("[PropertyModeration] Error updating status:", err);
      showToast(err.response?.data?.message || "Lỗi khi xử lý tin.", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return {
          label: "Đã duyệt",
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
        };
      case "REJECTED":
        return {
          label: "Bị từ chối",
          style: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
        };
      case "REMOVED":
        return {
          label: "Gỡ vi phạm",
          style: "bg-purple-50 text-purple-700 border-purple-200",
          dot: "bg-purple-500",
        };
      case "DRAFT":
        return {
          label: "Nháp",
          style: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400",
        };
      case "EXPIRED":
        return {
          label: "Hết hạn",
          style: "bg-gray-100 text-gray-600 border-gray-200",
          dot: "bg-gray-400",
        };
      case "PENDING":
      default:
        return {
          label: "Chờ duyệt",
          style: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500 animate-pulse",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold text-white animate-fadeIn ${
            toast.type === "error" ? "bg-rose-600 border border-rose-700" : "bg-emerald-600 border border-emerald-700"
          }`}
        >
          {toast.type === "error" ? <FaTimesCircle className="text-base" /> : <FaCheckCircle className="text-base" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Quản lý tin đăng bất động sản
          </h2>
          <p className="text-xs text-slate-500">
            Kiểm duyệt tin mới (Pending), từ chối tin không đạt, gỡ tin vi phạm và quản lý tin nổi bật
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute text-slate-400 left-3 top-1/2 -translate-y-1/2 text-xs" />
          <input
            type="search"
            placeholder="Tìm theo tiêu đề, địa chỉ, người đăng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* 2. Thống kê KPI Tóm Tắt (4 Corporate Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng số tin */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 flex-shrink-0 text-base">
            <FaHome />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tổng số tin đăng
            </span>
            <p className="text-xl font-bold text-slate-900 leading-tight mt-0.5">{summary.total}</p>
          </div>
        </div>

        {/* Card 2: Chờ duyệt */}
        <div
          className={`p-4 bg-white border rounded-xl shadow-2xs flex items-center gap-3.5 transition-all ${
            summary.pending > 0
              ? "border-amber-300 bg-amber-50/20 ring-1 ring-amber-200"
              : "border-slate-200/90"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0 text-base">
            <FaClock />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Chờ duyệt
              </span>
              {summary.pending > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-bold text-amber-600 leading-tight mt-0.5">{summary.pending}</p>
          </div>
        </div>

        {/* Card 3: Đã duyệt / Đang hiển thị */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0 text-base">
            <FaCheckCircle />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Đang hiển thị
            </span>
            <p className="text-xl font-bold text-emerald-600 leading-tight mt-0.5">{summary.approved}</p>
          </div>
        </div>

        {/* Card 4: Tin nổi bật */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-200 flex-shrink-0 text-base">
            <FaStar />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tin nổi bật ⭐
            </span>
            <p className="text-xl font-bold text-slate-900 leading-tight mt-0.5">{summary.featured}</p>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs (Chuẩn 6 Trạng Thái + Nổi Bật) */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-200/70 rounded-lg text-xs font-semibold text-slate-600">
        {[
          { key: "all", label: "Tất cả", count: summary.total },
          { key: "PENDING", label: "⏳ Chờ duyệt", count: summary.pending, highlight: summary.pending > 0 },
          { key: "APPROVED", label: "✅ Đã duyệt", count: summary.approved },
          { key: "REJECTED", label: "❌ Từ chối", count: summary.rejected },
          { key: "REMOVED", label: "🚫 Gỡ vi phạm", count: summary.removed },
          { key: "featured", label: "⭐ Tin nổi bật", count: summary.featured },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "hover:text-slate-900 text-slate-600"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? "bg-blue-100 text-blue-800"
                    : tab.highlight
                    ? "bg-amber-200 text-amber-900 font-extrabold"
                    : "bg-slate-300 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Listing Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 rounded-full border-t-transparent animate-spin" />
            <p className="text-xs font-medium text-slate-500">Đang tải danh sách tin đăng...</p>
          </div>
        </div>
      ) : properties.length > 0 ? (
        <div className="space-y-3.5">
          {properties.map((item) => {
            const badge = getStatusBadge(item.TrangThaiDuyet);
            const isRental =
              item.TrangThai === "cho thuê" ||
              (item.TieuDe && item.TieuDe.toLowerCase().includes("thuê"));
            const firstImg = item.HinhAnhDaiDien || (item.HinhAnh && item.HinhAnh[0]);

            return (
              <div
                key={item.MaTTND}
                className={`bg-white border rounded-xl p-4 shadow-2xs transition-all hover:border-slate-300 ${
                  item.TrangThaiDuyet === "PENDING"
                    ? "border-amber-300 bg-amber-50/10"
                    : item.Featured
                    ? "border-orange-300 ring-1 ring-orange-200"
                    : "border-slate-200/90"
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Core Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                      <img
                        src={firstImg ? `${SERVER_URL}${firstImg}` : "/placeholder.svg?height=96&width=112"}
                        alt={item.TieuDe}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.svg?height=96&width=112";
                        }}
                      />
                      {item.HinhAnh && item.HinhAnh.length > 0 && (
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                          <FaImages />
                          <span>{item.HinhAnh.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Status Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Moderation Status */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${badge.style}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>

                        {/* Transaction Type */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isRental ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isRental ? "Cho thuê" : "Đang bán"}
                        </span>

                        {/* Featured Tag */}
                        {item.Featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
                            <FaStar className="text-[9px]" /> Tin nổi bật
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-slate-400">#{item.MaTTND}</span>

                        {item.TenLoaiND && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.TenLoaiND}
                          </span>
                        )}
                      </div>

                      {/* Property Title */}
                      <h3 className="text-sm font-bold text-slate-900 truncate" title={item.TieuDe}>
                        {item.TieuDe}
                      </h3>

                      {/* Price & Area */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-extrabold text-red-600 text-sm tracking-tight">
                          {formatPrice(item.Gia)}
                        </span>
                        {item.DienTich && (
                          <span className="text-slate-500 font-medium">
                            &bull; {Number(item.DienTich).toFixed(0)} m²
                          </span>
                        )}
                      </div>

                      {/* Address & Poster Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1 truncate max-w-xs" title={item.DiaChi}>
                          <FaMapMarkerAlt className="text-slate-400 text-[10px] flex-shrink-0" />
                          <span className="truncate">{item.DiaChi || "Chưa cập nhật địa chỉ"}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <FaUser className="text-slate-400 text-[10px]" />
                          <span>
                            {item.TenNguoiDang || item.EmailNguoiDang?.split("@")[0] || "Người dùng"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({item.LoaiTaiKhoanNguoiDang || "thường"})
                          </span>
                        </span>

                        {item.SDTNguoiDang && (
                          <span className="flex items-center gap-1">
                            <FaPhoneAlt className="text-slate-400 text-[9px]" />
                            <span>{item.SDTNguoiDang}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-[11px]">
                          <FaCalendarAlt className="text-slate-400 text-[10px]" />
                          <span>Đăng: {formatDate(item.NgayTao)}</span>
                        </span>
                      </div>

                      {/* Reason Alert Box if Rejected or Removed */}
                      {(item.TrangThaiDuyet === "REJECTED" || item.TrangThaiDuyet === "REMOVED") && (
                        <div
                          className={`mt-2 p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
                            item.TrangThaiDuyet === "REJECTED"
                              ? "bg-rose-50 border-rose-200 text-rose-800"
                              : "bg-purple-50 border-purple-200 text-purple-800"
                          }`}
                        >
                          <FaBan className="text-sm flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              {item.TrangThaiDuyet === "REJECTED" ? "Lý do từ chối: " : "Lý do gỡ vi phạm: "}
                            </span>
                            <span>{item.LyDoTuChoi || "Không có lý do chi tiết."}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* View Detail button */}
                    <button
                      onClick={() => handleOpenDetail(item.MaTTND)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                    >
                      <FaEye className="text-[11px]" />
                      <span>Xem & Duyệt</span>
                    </button>

                    {/* Pending Actions */}
                    {item.TrangThaiDuyet === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(item.MaTTND)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs"
                          title="Duyệt bài đăng cho phép hiển thị"
                        >
                          <FaCheck className="text-[10px]" />
                          <span>Duyệt tin</span>
                        </button>

                        <button
                          onClick={() => openReasonDialog("REJECT", item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          title="Từ chối tin đăng không đạt yêu cầu"
                        >
                          <FaTimes className="text-[10px]" />
                          <span>Từ chối</span>
                        </button>
                      </>
                    )}

                    {/* Approved Actions */}
                    {item.TrangThaiDuyet === "APPROVED" && (
                      <>
                        {/* Toggle Featured */}
                        <button
                          onClick={() => handleToggleFeatured(item.MaTTND, item.Featured)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                            item.Featured
                              ? "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          }`}
                          title={item.Featured ? "Hủy đánh dấu tin nổi bật" : "Đánh dấu tin nổi bật"}
                        >
                          <FaStar className={item.Featured ? "text-orange-500" : "text-slate-400"} />
                          <span>{item.Featured ? "Nổi bật" : "Ghim nổi bật"}</span>
                        </button>

                        {/* Remove Violation */}
                        <button
                          onClick={() => openReasonDialog("REMOVE", item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          title="Gỡ tin vi phạm khỏi website"
                        >
                          <FaBan className="text-[10px]" />
                          <span>Gỡ vi phạm</span>
                        </button>
                      </>
                    )}

                    {/* Rejected / Removed: Re-approve */}
                    {(item.TrangThaiDuyet === "REJECTED" || item.TrangThaiDuyet === "REMOVED") && (
                      <button
                        onClick={() => handleApprove(item.MaTTND)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-300 rounded-lg transition-colors"
                        title="Khôi phục và duyệt lại bài đăng"
                      >
                        <FaRedo className="text-[10px]" />
                        <span>Duyệt lại</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 bg-white border border-slate-200/90 rounded-xl text-center text-slate-400 text-xs font-medium space-y-2">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-lg">
            <FaHome />
          </div>
          <p className="text-slate-700 font-semibold text-sm">Không tìm thấy tin đăng nào</p>
          <p className="text-slate-400 text-xs">Hãy thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
        </div>
      )}

      {/* 5. Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <FaChevronLeft className="text-[10px]" />
            <span>Trang trước</span>
          </button>

          <span className="text-slate-600 font-medium">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <span>Trang tiếp</span>
            <FaChevronRight className="text-[10px]" />
          </button>
        </div>
      )}

      {/* 6. MODAL CHI TIẾT & KIỂM DUYỆT TIN ĐĂNG */}
      {showDetailModal && (
        <PropertyDetailReviewModal
          propertyId={selectedPropertyId}
          detail={detailProperty}
          loading={detailLoading}
          onClose={() => {
            setShowDetailModal(false);
            setDetailProperty(null);
          }}
          onApprove={() => handleApprove(selectedPropertyId)}
          onReject={() => openReasonDialog("REJECT", detailProperty)}
          onRemove={() => openReasonDialog("REMOVE", detailProperty)}
          onToggleFeatured={() =>
            handleToggleFeatured(selectedPropertyId, detailProperty?.Featured)
          }
        />
      )}

      {/* 7. DIALOG CHỌN LÝ DO TỪ CHỐI / GỠ VI PHẠM */}
      {reasonDialog.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() =>
            setReasonDialog({ isOpen: false, type: "REJECT", propertyId: null, propertyTitle: "" })
          }
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scaleIn space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {reasonDialog.type === "REJECT" ? (
                  <>
                    <FaTimesCircle className="text-rose-600" />
                    <span>Từ chối tin đăng</span>
                  </>
                ) : (
                  <>
                    <FaBan className="text-purple-600" />
                    <span>Gỡ tin vi phạm</span>
                  </>
                )}
              </h3>
              <button
                onClick={() =>
                  setReasonDialog({ isOpen: false, type: "REJECT", propertyId: null, propertyTitle: "" })
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Bạn đang thực hiện thao tác đối với tin:{" "}
              <strong className="text-slate-900">"{reasonDialog.propertyTitle}"</strong>
            </p>

            {/* Danh sách lý do gợi ý */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Chọn lý do thường gặp:
              </label>
              {(reasonDialog.type === "REJECT" ? REJECT_REASONS : REMOVE_REASONS).map((r, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedPresetReason === r
                      ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="reasonPreset"
                    checked={selectedPresetReason === r}
                    onChange={() => setSelectedPresetReason(r)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {/* Ghi chú lý do tùy chỉnh */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú chi tiết thêm cho người đăng (tùy chọn):
              </label>
              <textarea
                rows={3}
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="Nhập hướng dẫn cụ thể hoặc mô tả chi tiết lỗi vi phạm..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setReasonDialog({ isOpen: false, type: "REJECT", propertyId: null, propertyTitle: "" })
                }
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmReason}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-xs ${
                  reasonDialog.type === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-purple-700 hover:bg-purple-800"
                }`}
              >
                {reasonDialog.type === "REJECT" ? "Xác nhận từ chối" : "Xác nhận gỡ tin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// MODAL CHI TIẾT & KIỂM DUYỆT TOÀN DIỆN CHO ADMIN
// =========================================================================
const PropertyDetailReviewModal = ({
  propertyId,
  detail,
  loading,
  onClose,
  onApprove,
  onReject,
  onRemove,
  onToggleFeatured,
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Admin Inspection Checklist States (Tiêu chí kiểm tra)
  const [checklist, setChecklist] = useState({
    titleCheck: true,
    descCheck: true,
    imagesCheck: true,
    priceCheck: true,
    contactCheck: true,
  });

  if (loading || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center">
          <div className="w-8 h-8 border-3 border-blue-600 rounded-full border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Đang tải chi tiết tin đăng #{propertyId}...</p>
        </div>
      </div>
    );
  }

  const images = detail.HinhAnh || [];
  const activeImage = images[activeImgIndex];
  const isApproved = detail.TrangThaiDuyet === "APPROVED";
  const isPending = detail.TrangThaiDuyet === "PENDING";
  const isRejected = detail.TrangThaiDuyet === "REJECTED";
  const isRemoved = detail.TrangThaiDuyet === "REMOVED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">
              #{detail.MaTTND}
            </span>
            <h3 className="text-sm font-bold text-white truncate max-w-md sm:max-w-xl">
              {detail.TieuDe}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/bat-dong-san/${detail.MaTTND}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
              title="Mở xem bài đăng trên website"
            >
              <FaExternalLinkAlt className="text-[10px]" />
              <span className="hidden sm:inline">Xem trên Web</span>
            </Link>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Modal (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* 1. Admin Inspection Checklist (Bảng kiểm duyệt nội dung) */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <FaCheckCircle className="text-blue-600" />
                Tiêu chuẩn kiểm duyệt nội dung của Admin
              </span>
              <span className="text-[11px] text-blue-700 font-medium">
                Kiểm tra kỹ trước khi duyệt công khai
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.titleCheck}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, titleCheck: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800">1. Tiêu đề chuẩn, không spam</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.descCheck}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, descCheck: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800">2. Mô tả trung thực, rõ ràng</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.imagesCheck}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, imagesCheck: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800">3. Hình ảnh thật, rõ nét</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.priceCheck}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, priceCheck: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800">4. Giá bán/thuê hợp lý</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.contactCheck}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, contactCheck: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800">5. Địa chỉ & liên hệ có thật</span>
              </label>
            </div>
          </div>

          {/* 2. Gallery hình ảnh bất động sản */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <FaImages className="text-slate-500" />
                Album hình ảnh ({images.length} ảnh)
              </span>
              <span className="text-[11px] text-slate-500">
                Click vào ảnh để phóng to kiểm tra chi tiết
              </span>
            </div>

            {images.length > 0 ? (
              <div className="space-y-3">
                {/* Main large image */}
                <div className="w-full h-72 sm:h-80 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200 relative">
                  <img
                    src={`${SERVER_URL}${activeImage}`}
                    alt="Current preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-mono px-2 py-1 rounded">
                    Ảnh {activeImgIndex + 1} / {images.length}
                  </div>
                </div>

                {/* Thumbnails row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImgIndex(idx)}
                      className={`relative w-16 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                        activeImgIndex === idx ? "border-blue-600 ring-2 ring-blue-200" : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={`${SERVER_URL}${img}`} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg">
                Người đăng không tải lên hình ảnh nào cho bài đăng này.
              </div>
            )}
          </div>

          {/* 3. Chi tiết nội dung & Giá */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thông số giao dịch */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
              <h4 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5">
                <FaHome className="text-slate-500" />
                Thông số bất động sản
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nhu cầu:</span>
                  <span className="font-semibold text-slate-900 uppercase">
                    {detail.TrangThai || "Đang bán"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Loại hình:</span>
                  <span className="font-semibold text-slate-900">{detail.TenLoaiND || "Nhà riêng"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Giá công bố:</span>
                  <span className="font-extrabold text-red-600 text-sm">{formatPrice(detail.Gia)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Diện tích:</span>
                  <span className="font-semibold text-slate-900">{detail.DienTich || "N/A"} m²</span>
                </div>
                {detail.TienDatCoc > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tiền đặt cọc:</span>
                    <span className="font-medium">{formatPrice(detail.TienDatCoc)}</span>
                  </div>
                )}
                {detail.ThoiHanThue && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Thời hạn thuê:</span>
                    <span className="font-medium">{detail.ThoiHanThue}</span>
                  </div>
                )}
                {detail.NoiThat && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Nội thất:</span>
                    <span className="font-medium">{detail.NoiThat}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin người đăng */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
              <h4 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5">
                <FaUser className="text-slate-500" />
                Thông tin người đăng / Chủ sở hữu
              </h4>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Họ tên: </span>
                  <span className="font-bold text-slate-900">
                    {detail.TenNguoiDang || detail.EmailNguoiDang?.split("@")[0] || "N/A"}
                  </span>
                  {detail.TrangThaiXacMinhMoiGioi === "VERIFIED" && (
                    <span className="ml-2 text-emerald-600 font-semibold text-[10px]">
                      (✓ Đã xác minh CCCD)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Email: </span>
                  <span className="font-mono text-slate-700">{detail.EmailNguoiDang || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Số điện thoại: </span>
                  <span className="font-bold text-slate-900">{detail.SDTNguoiDang || "Chưa cung cấp"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Phân loại tài khoản: </span>
                  <span className="font-medium uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                    {detail.LoaiTaiKhoanNguoiDang || "thường"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Ngày đăng tin: </span>
                  <span>{formatDate(detail.NgayTao)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Địa chỉ & Tọa độ */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-red-500" />
              Địa chỉ & Tọa độ bản đồ
            </h4>
            <p className="text-slate-800 font-medium">
              <strong>Địa chỉ chi tiết: </strong>
              {detail.DiaChi || "Chưa cập nhật địa chỉ"}
            </p>
            {detail.GPS_Lat && detail.GPS_Lng && (
              <p className="text-slate-500 text-[11px] font-mono">
                Tọa độ GPS: {detail.GPS_Lat}, {detail.GPS_Lng}
              </p>
            )}
            {detail.ToaDoVN2000 && (
              <p className="text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 text-[11px]">
                ✓ Có dữ liệu ranh giới tọa độ VN2000 (đã liên kết bản đồ quy hoạch)
              </p>
            )}
          </div>

          {/* 5. Mô tả chi tiết */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-900">Mô tả bất động sản</h4>
            <div className="text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {detail.MoTa || "Không có nội dung mô tả."}
            </div>
          </div>

          {/* 6. Tài liệu pháp lý đính kèm (nếu có sổ đỏ/video thửa đất) */}
          {(detail.FileSoDo || detail.VideoThuaDat || detail.VideoXacThuc) && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FaFileAlt className="text-blue-600" />
                Hồ sơ pháp lý & Video kiểm tra thực tế
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {detail.FileSoDo &&
                  detail.FileSoDo.split(",").map((file, idx) => (
                    <a
                      key={idx}
                      href={`${SERVER_URL}${file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold border border-blue-200"
                    >
                      <FaFileAlt /> Xem ảnh sổ đỏ #{idx + 1}
                    </a>
                  ))}
                {(detail.VideoThuaDat || detail.VideoXacThuc) && (
                  <a
                    href={`${SERVER_URL}${detail.VideoThuaDat || detail.VideoXacThuc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold border border-rose-200"
                  >
                    <FaVideo /> Xem video hiện trạng
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 7. Trạng thái hiện tại & Người duyệt */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500">Trạng thái hiện tại: </span>
              <span className="font-bold uppercase text-slate-900 ml-1">
                {detail.TrangThaiDuyet}
              </span>
              {detail.NgayDuyet && (
                <span className="text-slate-400 ml-2">
                  (Duyệt lúc: {formatDate(detail.NgayDuyet)}
                  {detail.TenNguoiDuyet && ` bởi ${detail.TenNguoiDuyet}`})
                </span>
              )}
            </div>

            {detail.Featured && (
              <span className="text-orange-600 font-bold flex items-center gap-1">
                <FaStar /> Đang được ghim nổi bật ⭐
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Đóng lại
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Featured */}
            {isApproved && (
              <button
                type="button"
                onClick={onToggleFeatured}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all border ${
                  detail.Featured
                    ? "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <FaStar className="inline mr-1 text-orange-500" />
                <span>{detail.Featured ? "Hủy nổi bật" : "Ghim nổi bật ⭐"}</span>
              </button>
            )}

            {/* Reject button (if pending) */}
            {isPending && (
              <button
                type="button"
                onClick={onReject}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors"
              >
                <FaTimes className="inline mr-1" />
                Từ chối tin đăng
              </button>
            )}

            {/* Remove button (if approved) */}
            {isApproved && (
              <button
                type="button"
                onClick={onRemove}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors"
              >
                <FaBan className="inline mr-1" />
                Gỡ tin vi phạm
              </button>
            )}

            {/* Approve / Re-approve button */}
            {!isApproved && (
              <button
                type="button"
                onClick={onApprove}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm"
              >
                <FaCheck className="inline mr-1" />
                {isPending ? "✅ Phê duyệt tin đăng" : "🔄 Phê duyệt lại"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyModerationManager;