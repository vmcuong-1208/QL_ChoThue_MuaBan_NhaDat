"use client";

import React, { useState, useEffect } from "react";
import {
  FaIdCard,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaEye,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaShieldAlt,
} from "react-icons/fa";
import axios from "axios";
import { API_URL, SERVER_URL } from "../../services/api";

const BrokerVerificationManager = () => {
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRecords = async (page = 1, status = activeTab, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/broker-verification/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: pagination.limit,
          status,
          search,
        },
      });

      setRecords(response.data.records || []);
      setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      setCounts(response.data.counts || { all: 0, pending: 0, verified: 0, rejected: 0 });
    } catch (err) {
      console.error("Lỗi khi lấy danh sách xác minh môi giới:", err);
      if (err.response?.status === 403) {
        setError("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      } else {
        setError("Không thể tải danh sách xác minh môi giới. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1, activeTab, searchTerm);
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords(1, activeTab, searchTerm);
  };

  const handlePageChange = (newPage) => {
    fetchRecords(newPage, activeTab, searchTerm);
  };

  const handleViewDetail = async (record) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/broker-verification/admin/${record.MaXacMinh}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedRecord(res.data);
      setAdminNote(res.data.GhiChuAdmin || "");
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Lỗi xem chi tiết:", err);
      showToast("Không thể tải chi tiết hồ sơ", "error");
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRecord) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/broker-verification/admin/${selectedRecord.MaXacMinh}/status`,
        {
          status,
          ghiChuAdmin: adminNote,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showToast(
        status === "VERIFIED"
          ? `Đã phê duyệt xác minh môi giới: ${selectedRecord.HoTen}`
          : `Đã từ chối hồ sơ xác minh của: ${selectedRecord.HoTen}`,
        status === "VERIFIED" ? "success" : "warning"
      );

      setIsDetailModalOpen(false);
      setSelectedRecord(null);
      fetchRecords(pagination.page, activeTab, searchTerm);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setActionLoading(false);
    }
  };

  const fixImagePath = (path) => {
    if (!path) return "/placeholder.svg?height=200&width=300";
    if (path.startsWith("http")) return path;
    return `${SERVER_URL}${path}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Đã xác minh</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Bị từ chối</span>
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Chờ duyệt</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold text-white animate-fadeIn ${
            toastMessage.type === "success"
              ? "bg-emerald-600"
              : toastMessage.type === "warning"
              ? "bg-amber-600"
              : "bg-rose-600"
          }`}
        >
          {toastMessage.type === "success" ? (
            <FaCheckCircle className="text-base" />
          ) : (
            <FaTimesCircle className="text-base" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FaIdCard className="text-blue-600 text-xl" />
            <span>Xác minh danh tính môi giới</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiểm duyệt hồ sơ CMND/CCCD chứng thực tài khoản môi giới chuyên nghiệp & tin cậy
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <FaSearch className="absolute text-slate-400 left-3 top-1/2 -translate-y-1/2 text-xs" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT, số CCCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex-shrink-0"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* 2. Thống kê nhanh 4 thẻ (KPI Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <FaIdCard className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tổng hồ sơ
            </span>
            <p className="text-lg font-bold text-slate-900 leading-tight">{counts.all}</p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
            <FaClock className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Chờ phê duyệt
            </span>
            <p className="text-lg font-bold text-amber-600 leading-tight">{counts.pending}</p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <FaCheckCircle className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Đã xác minh
            </span>
            <p className="text-lg font-bold text-emerald-600 leading-tight">{counts.verified}</p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
            <FaTimesCircle className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Bị từ chối
            </span>
            <p className="text-lg font-bold text-rose-600 leading-tight">{counts.rejected}</p>
          </div>
        </div>
      </div>

      {/* 3. Bộ lọc Tab dạng viên thuốc (Filter Pills) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Tất cả hồ sơ</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("PENDING")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "PENDING"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          <FaClock className="text-[11px]" />
          <span>Chờ duyệt</span>
          {counts.pending > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {counts.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("VERIFIED")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "VERIFIED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <FaCheckCircle className="text-[11px]" />
          <span>Đã xác minh</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/30 text-emerald-800">
            {counts.verified}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "REJECTED"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          <FaTimesCircle className="text-[11px]" />
          <span>Bị từ chối</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-700/30 text-rose-800">
            {counts.rejected}
          </span>
        </button>
      </div>

      {/* 4. Bảng Dữ Liệu Hồ Sơ */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Đang tải danh sách hồ sơ...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-xs text-rose-600 bg-rose-50 border-b border-rose-100">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <FaIdCard className="text-3xl text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Chưa có hồ sơ xác minh nào</p>
            <p className="text-xs text-slate-400 mt-1">
              Khi các tài khoản môi giới gửi ảnh CMND/CCCD, danh sách sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3 w-14">ID</th>
                  <th className="px-4 py-3">Môi giới</th>
                  <th className="px-4 py-3">Số điện thoại</th>
                  <th className="px-4 py-3">Số CCCD</th>
                  <th className="px-4 py-3">Ngày gửi yêu cầu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((item) => (
                  <tr key={item.MaXacMinh} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-500">
                      #{item.MaXacMinh}
                    </td>

                    {/* Môi giới info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.AnhDaiDien || "/placeholder.svg?height=32&width=32"}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-slate-200 object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=Broker&background=3b82f6&color=fff";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{item.HoTen || "Chưa đặt tên"}</span>
                            {item.TrangThai === "VERIFIED" && (
                              <FaCheckCircle className="text-emerald-500 text-xs flex-shrink-0" />
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{item.Email}</p>
                        </div>
                      </div>
                    </td>

                    {/* SĐT */}
                    <td className="px-4 py-3 font-mono text-slate-800 font-medium">
                      {item.SDT || <span className="text-slate-400 font-sans italic">Chưa có</span>}
                    </td>

                    {/* Số CCCD */}
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {item.SoCCCD || <span className="text-slate-400 font-sans italic">Xem trên ảnh</span>}
                    </td>

                    {/* Ngày gửi */}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(item.NgayGui).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(item.TrangThai)}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors shadow-2xs ${
                          item.TrangThai === "PENDING"
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <FaEye className="text-xs" />
                        <span>{item.TrangThai === "PENDING" ? "Kiểm duyệt" : "Xem hồ sơ"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Trang <b className="text-slate-800">{pagination.page}</b> /{" "}
              <b>{pagination.totalPages}</b> (Tổng: <b>{pagination.total}</b> hồ sơ)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200"
                title="Trang trước"
              >
                <FaChevronLeft className="text-[10px]" />
              </button>
              <span className="px-2 font-medium text-slate-700">Trang {pagination.page}</span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200"
                title="Trang tiếp"
              >
                <FaChevronRight className="text-[10px]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL CHI TIẾT & KIỂM DUYỆT HỒ SƠ CCCD XÁC MINH MÔI GIỚI
          ========================================================================= */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <FaIdCard className="text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    Thẩm định hồ sơ xác minh môi giới #{selectedRecord.MaXacMinh}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Người gửi: <span className="font-semibold text-white">{selectedRecord.HoTen}</span> (ID: #{selectedRecord.MaNgDung})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Row 1: Thông tin môi giới */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FaUser className="text-blue-600" />
                  <span>Thông tin cá nhân môi giới</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500">Họ và tên:</span>
                    <p className="text-xs font-bold text-slate-900">{selectedRecord.HoTen || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Số điện thoại:</span>
                    <p className="text-xs font-bold text-slate-900 font-mono">{selectedRecord.SDT || "Chưa có"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Email:</span>
                    <p className="text-xs font-bold text-slate-900 truncate">{selectedRecord.Email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Số CCCD/CMND khai báo:</span>
                    <p className="text-xs font-bold text-blue-700 font-mono">
                      {selectedRecord.SoCCCD || "Chưa nhập (xem ảnh)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Ngày gửi yêu cầu:</span>
                    <p className="text-xs font-bold text-slate-900">
                      {new Date(selectedRecord.NgayGui).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Trạng thái hiện tại:</span>
                    <div className="mt-0.5">{getStatusBadge(selectedRecord.TrangThai)}</div>
                  </div>
                </div>
              </div>

              {/* Row 2: Bộ ảnh CCCD pháp lý */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <FaShieldAlt className="text-blue-600" />
                  <span>Hồ sơ ảnh CMND / CCCD (Bấm vào ảnh để phóng to)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Mặt trước */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-700 mb-2">
                      1. CCCD Mặt trước <span className="text-rose-500">*</span>
                    </span>
                    <div
                      onClick={() => setPreviewImage(fixImagePath(selectedRecord.AnhCCCDMatTruoc))}
                      className="w-full h-44 rounded-lg bg-slate-100 overflow-hidden cursor-pointer border border-slate-200 hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                      <img
                        src={fixImagePath(selectedRecord.AnhCCCDMatTruoc)}
                        alt="CCCD Mặt trước"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Mặt sau */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-700 mb-2">
                      2. CCCD Mặt sau <span className="text-rose-500">*</span>
                    </span>
                    <div
                      onClick={() => setPreviewImage(fixImagePath(selectedRecord.AnhCCCDMatSau))}
                      className="w-full h-44 rounded-lg bg-slate-100 overflow-hidden cursor-pointer border border-slate-200 hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                      <img
                        src={fixImagePath(selectedRecord.AnhCCCDMatSau)}
                        alt="CCCD Mặt sau"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Ảnh chân dung cầm CCCD */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-700 mb-2">
                      3. Chân dung cầm CCCD (Tùy chọn)
                    </span>
                    {selectedRecord.AnhChanDung ? (
                      <div
                        onClick={() => setPreviewImage(fixImagePath(selectedRecord.AnhChanDung))}
                        className="w-full h-44 rounded-lg bg-slate-100 overflow-hidden cursor-pointer border border-slate-200 hover:opacity-90 transition-opacity flex items-center justify-center"
                      >
                        <img
                          src={fixImagePath(selectedRecord.AnhChanDung)}
                          alt="Ảnh chân dung cầm CCCD"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-44 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-center p-3">
                        <FaUser className="text-2xl mb-1 text-slate-300" />
                        <span>Môi giới không gửi ảnh chân dung</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Ghi chú của Admin */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <span>Ghi chú xét duyệt của Admin (Hiển thị cho môi giới nếu bị từ chối):</span>
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ví dụ: Ảnh CCCD mặt trước bị mờ, vui lòng chụp lại rõ nét cả 4 góc..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              {/* Lịch sử phê duyệt (nếu đã được xử lý trước đó) */}
              {selectedRecord.NgayDuyet && (
                <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <span>
                    Người duyệt: <b>{selectedRecord.TenNguoiDuyet || "Admin"}</b>
                  </span>
                  <span>
                    Ngày duyệt: <b>{new Date(selectedRecord.NgayDuyet).toLocaleString("vi-VN")}</b>
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer - Các nút hành động */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus("REJECTED")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  <FaTimes />
                  <span>Từ chối hồ sơ</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus("VERIFIED")}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  <FaCheck />
                  <span>Duyệt xác minh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Ảnh Phóng To */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Phóng to ảnh CCCD"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-900 font-bold flex items-center justify-center shadow-lg hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerVerificationManager;
