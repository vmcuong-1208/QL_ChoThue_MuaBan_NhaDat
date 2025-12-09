"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaFlag,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaBan,
  FaTrashAlt,
  FaCheck,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import axios from "axios";
import { API_URL, SERVER_URL } from "../../services/api";

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

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const ReportManager = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    choXuLy: 0,
    dangKiemTra: 0,
    daXuLy: 0,
    daGoTin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchReports = useCallback(
    async (page = 1, status = activeTab, search = searchTerm) => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        const response = await axios.get(`${API_URL}/property-reports`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit: pagination.limit,
            trangThai: status,
            search,
          },
        });

        setReports(response.data.items || []);
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 15,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
        });
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách báo cáo vi phạm:", err);
        setError(
          err.response?.data?.message ||
            "Không thể kết nối đến máy chủ để tải dữ liệu báo cáo."
        );
      } finally {
        setLoading(false);
      }
    },
    [activeTab, searchTerm, pagination.limit]
  );

  useEffect(() => {
    fetchReports(1, activeTab, searchTerm);
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports(1, activeTab, searchTerm);
  };

  const handleOpenActionModal = (report) => {
    setSelectedReport(report);
    setAdminNote(report.GhiChuAdmin || "");
    setIsActionModalOpen(true);
  };

  const handleUpdateReport = async (newStatus, action = "") => {
    if (!selectedReport) return;

    if (action === "KHOA_MOI_GIOI") {
      const confirmLock = window.confirm(
        `CẢNH BÁO CAO: Bạn có chắc chắn muốn KHÓA tài khoản của môi giới "${
          selectedReport.TenMoiGioi || "này"
        }" và gỡ tin đăng #${selectedReport.MaTTND} khỏi hệ thống không?`
      );
      if (!confirmLock) return;
    }

    if (action === "GO_TIN") {
      const confirmRemove = window.confirm(
        `Xác nhận GỠ TIN ĐĂNG #${selectedReport.MaTTND} khỏi hệ thống và gửi thông báo cảnh cáo cho môi giới?`
      );
      if (!confirmRemove) return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/property-reports/${selectedReport.MaBC}/status`,
        {
          TrangThai: newStatus,
          GhiChuAdmin: adminNote,
          HanhDong: action,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let msg = "Cập nhật trạng thái báo cáo thành công!";
      if (action === "GO_TIN") msg = "Đã gỡ tin đăng vi phạm và gửi thông báo cho môi giới!";
      if (action === "KHOA_MOI_GIOI") msg = "Đã khóa tài khoản môi giới và gỡ tin đăng!";
      if (newStatus === "DA_XU_LY" && !action) msg = "Đã đánh dấu xử lý (Bỏ qua / Không vi phạm)!";

      showToast(msg, "success");
      setIsActionModalOpen(false);
      setSelectedReport(null);
      fetchReports(pagination.page, activeTab, searchTerm);
    } catch (err) {
      console.error("Lỗi khi xử lý báo cáo:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật báo cáo.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CHO_XU_LY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Chờ xử lý</span>
          </span>
        );
      case "DANG_KIEM_TRA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Đang kiểm tra</span>
          </span>
        );
      case "DA_XU_LY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>Đã xử lý (Bỏ qua)</span>
          </span>
        );
      case "DA_GO_TIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Đã gỡ tin vi phạm</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-2xl border border-slate-700 animate-slideIn">
          <FaCheckCircle className="text-emerald-400 text-sm" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaFlag className="text-red-600 text-lg" />
            <span>Quản lý Báo cáo tin sai phạm</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Xác minh phản hồi của người dùng, kiểm tra tin đăng bất động sản và
            xử lý các trường hợp vi phạm quy định.
          </p>
        </div>

        <button
          onClick={() => fetchReports(pagination.page, activeTab, searchTerm)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <FaClock className="text-slate-400" />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setActiveTab("all")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Tổng số báo cáo</div>
          <div className="text-2xl font-black mt-1">{stats.total}</div>
        </div>

        <div
          onClick={() => setActiveTab("CHO_XU_LY")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "CHO_XU_LY"
              ? "bg-amber-600 text-white border-amber-600 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Chờ xử lý</span>
          </div>
          <div className="text-2xl font-black mt-1 text-amber-600 group-hover:text-amber-700">
            {stats.choXuLy}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("DANG_KIEM_TRA")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "DANG_KIEM_TRA"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:border-blue-300"
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Đang kiểm tra</div>
          <div className="text-2xl font-black mt-1 text-blue-600">
            {stats.dangKiemTra}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("DA_XU_LY")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "DA_XU_LY"
              ? "bg-slate-700 text-white border-slate-700 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Đã xử lý (Bỏ qua)</div>
          <div className="text-2xl font-black mt-1 text-slate-600">
            {stats.daXuLy}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("DA_GO_TIN")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "DA_GO_TIN"
              ? "bg-rose-600 text-white border-rose-600 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:border-rose-300"
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Đã gỡ tin vi phạm</div>
          <div className="text-2xl font-black mt-1 text-rose-600">
            {stats.daGoTin}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: "all", label: "Tất cả" },
              { id: "CHO_XU_LY", label: `Chờ xử lý (${stats.choXuLy})` },
              { id: "DANG_KIEM_TRA", label: `Đang kiểm tra (${stats.dangKiemTra})` },
              { id: "DA_XU_LY", label: "Đã xử lý" },
              { id: "DA_GO_TIN", label: `Đã gỡ tin (${stats.daGoTin})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã tin, người báo cáo, SĐT, lý do..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
            <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
          </form>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>Đang tải danh sách báo cáo vi phạm...</div>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-xs space-y-2">
            <FaExclamationTriangle className="mx-auto text-xl" />
            <p>{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <FaFlag className="mx-auto text-3xl text-slate-300" />
            <div className="font-semibold text-slate-700">
              Không có báo cáo nào
            </div>
            <p className="text-slate-400 max-w-sm mx-auto">
              Chưa có báo cáo vi phạm nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã BC</th>
                  <th className="py-3 px-4">Tin đăng bị báo cáo</th>
                  <th className="py-3 px-4">Người báo cáo</th>
                  <th className="py-3 px-4">Lý do & Mô tả</th>
                  <th className="py-3 px-4">Môi giới phụ trách</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((item) => (
                  <tr
                    key={item.MaBC}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Mã BC & Ngày */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">#BC{item.MaBC}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(item.NgayBaoCao)}
                      </div>
                    </td>

                    {/* Tin đăng */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {item.TieuDeBDS || `BĐS #${item.MaTTND}`}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        <span className="font-bold text-red-600">
                          {formatPrice(item.Gia)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <Link
                          to={`/bat-dong-san/${item.MaTTND}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                          title="Mở tin đăng trong tab mới"
                        >
                          <span>Xem tin</span>
                          <FaExternalLinkAlt className="text-[9px]" />
                        </Link>
                      </div>
                    </td>

                    {/* Người báo cáo */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <FaUser className="text-slate-400 text-[10px]" />
                        <span>{item.HoTen || item.TenNguoiBaoCao || "Khách ẩn danh"}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <FaPhone className="text-slate-400 text-[9px]" />
                        <span>{item.SoDienThoai || "-"}</span>
                      </div>
                    </td>

                    {/* Lý do & Mô tả */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="inline-block px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded text-[11px] border border-red-100">
                        {item.LyDo}
                      </div>
                      {item.MoTaChiTiet && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 italic">
                          "{item.MoTaChiTiet}"
                        </p>
                      )}
                    </td>

                    {/* Môi giới */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {item.TenMoiGioi || "Không rõ"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.SDTMoiGioi || item.EmailMoiGioi || "-"}
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.TrangThai)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenActionModal(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <FaEye className="text-xs" />
                        <span>Xử lý</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            <div>
              Hiển thị trang <span className="font-semibold">{pagination.page}</span> /{" "}
              <span className="font-semibold">{pagination.totalPages}</span> (Tổng{" "}
              {pagination.total} báo cáo)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchReports(pagination.page - 1, activeTab, searchTerm)}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchReports(pagination.page + 1, activeTab, searchTerm)}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACTION MODAL: Xử lý báo cáo vi phạm */}
      {isActionModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600/30 text-red-400 rounded-lg border border-red-500/30">
                  <FaShieldAlt className="text-base" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Xử lý báo cáo vi phạm #BC{selectedReport.MaBC}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thời gian gửi: {formatDate(selectedReport.NgayBaoCao)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
              {/* Left Column: Chi tiết báo cáo & Tin đăng */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Thông tin tin đăng bị báo cáo
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-900 leading-snug">
                      {selectedReport.TieuDeBDS || `Tin đăng #${selectedReport.MaTTND}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Địa chỉ: {selectedReport.DiaChi || "Chưa cập nhật"}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-red-600">
                        {formatPrice(selectedReport.Gia)}
                      </span>
                      <Link
                        to={`/bat-dong-san/${selectedReport.MaTTND}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Mở xem tin đăng</span>
                        <FaExternalLinkAlt className="text-[10px]" />
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="font-semibold text-slate-600">Môi giới phụ trách:</span>{" "}
                    <span className="font-bold text-slate-800">
                      {selectedReport.TenMoiGioi || "Không rõ"}
                    </span>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      SĐT: {selectedReport.SDTMoiGioi || "-"} • Email:{" "}
                      {selectedReport.EmailMoiGioi || "-"}
                    </div>
                  </div>
                </div>

                <div className="bg-red-50/50 p-4 rounded-xl border border-red-200/70 space-y-2.5">
                  <div className="font-bold text-xs uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                    <FaExclamationTriangle />
                    <span>Nội dung tố cáo vi phạm</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-600">Lý do:</span>
                    <div className="inline-block ml-2 px-2.5 py-0.5 bg-red-100 text-red-800 font-bold rounded text-xs">
                      {selectedReport.LyDo}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-600">
                      Mô tả của người báo cáo:
                    </span>
                    <div className="mt-1 p-2.5 bg-white rounded-lg border border-red-100 text-xs text-slate-800 leading-relaxed italic">
                      "{selectedReport.MoTaChiTiet || "Người dùng không để lại mô tả thêm."}"
                    </div>
                  </div>

                  <div className="pt-2 border-t border-red-200/60 text-xs text-slate-600 space-y-1">
                    <div>
                      <span className="font-semibold">Người gửi:</span>{" "}
                      <span className="font-medium text-slate-900">
                        {selectedReport.HoTen || selectedReport.TenNguoiBaoCao || "Khách ẩn danh"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Số điện thoại:</span>{" "}
                      <span className="font-medium text-slate-900">
                        {selectedReport.SoDienThoai || "-"}
                      </span>
                      {selectedReport.Email && (
                        <span className="ml-2 font-medium text-slate-500">
                          • {selectedReport.Email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Quyết định & Biện pháp xử lý của Admin */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Ghi chú của Quản trị viên (Admin Note)
                    </label>
                    <textarea
                      rows={4}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Ghi nhận kết quả kiểm tra, liên hệ môi giới, lý do xử lý hoặc lý do bỏ qua báo cáo..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  {/* Trạng thái hiện tại */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Trạng thái hiện tại:</span>
                    <div>{getStatusBadge(selectedReport.TrangThai)}</div>
                  </div>

                  {/* Hướng dẫn thao tác */}
                  <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                    <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Khi chọn <strong>"Gỡ tin vi phạm"</strong>, tin đăng sẽ bị ẩn khỏi
                      website và hệ thống tự động gửi thông báo cảnh cáo kèm lý do cho môi giới.
                    </span>
                  </div>
                </div>

                {/* Các hành động xử lý */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="font-bold text-xs text-slate-700 mb-1">
                    Hành động xử lý:
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateReport("DANG_KIEM_TRA")}
                      className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs transition-colors border border-blue-200"
                    >
                      Đánh dấu Đang kiểm tra
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateReport("DA_XU_LY", "BO_QUA")}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors border border-slate-200"
                    >
                      Bỏ qua (Không vi phạm)
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateReport("DA_GO_TIN", "GO_TIN")}
                    className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FaBan className="text-xs" />
                    <span>Gỡ tin đăng vi phạm này</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateReport("DA_GO_TIN", "KHOA_MOI_GIOI")}
                    className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FaTrashAlt className="text-xs" />
                    <span>Gỡ tin & Khóa tài khoản môi giới</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManager;
