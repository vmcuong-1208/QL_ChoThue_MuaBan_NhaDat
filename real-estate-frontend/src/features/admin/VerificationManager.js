"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaCalendarAlt,
  FaSearch,
  FaFileAlt,
  FaVideo,
  FaExclamationTriangle,
  FaTimes,
  FaMoneyBillWave,
  FaHome,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { API_URL, SERVER_URL } from "../../services/api";

const VerificationManager = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const statusOptions = [
    { value: "all", label: "Tất cả", color: "gray", icon: FaFileAlt },
    {
      value: "chờ xác thực",
      label: "Chờ xác thực",
      color: "yellow",
      icon: FaClock,
    },
    {
      value: "đã xác thực",
      label: "Đã xác thực",
      color: "green",
      icon: FaCheckCircle,
    },
    { value: "từ chối", label: "Từ chối", color: "red", icon: FaTimesCircle },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter, currentPage, debouncedSearchTerm]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/verification/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter,
          page: currentPage,
          limit: 10,
        },
      });

      let filteredVerifications = response.data.verifications;

      if (debouncedSearchTerm) {
        filteredVerifications = filteredVerifications.filter(
          (v) =>
            v.TieuDe.toLowerCase().includes(
              debouncedSearchTerm.toLowerCase(),
            ) ||
            v.DiaChi.toLowerCase().includes(
              debouncedSearchTerm.toLowerCase(),
            ) ||
            v.TenNguoiBan.toLowerCase().includes(
              debouncedSearchTerm.toLowerCase(),
            ) ||
            v.EmailNguoiBan.toLowerCase().includes(
              debouncedSearchTerm.toLowerCase(),
            ),
        );
      }

      setVerifications(filteredVerifications);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách xác thực:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (propertyId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/verification/admin/${propertyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSelectedVerification(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết xác thực:", error);
      alert("Không thể tải chi tiết xác thực");
    }
  };

  const handleUpdateStatus = async (propertyId, newStatus, adminData) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/verification/admin/${propertyId}`,
        {
          trangThai: newStatus,
          ...adminData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      fetchVerifications();
      setShowDetailModal(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      alert("Có lỗi xảy ra khi cập nhật");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ";
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu";
    }
    return price.toLocaleString() + " VNĐ";
  };

  const getStatusInfo = (status) => {
    return (
      statusOptions.find((opt) => opt.value === status) || statusOptions[0]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fadeIn">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  const stats = {
    total: verifications.length,
    pending: verifications.filter((v) => v.TrangThaiXacThuc === "chờ xác thực")
      .length,
    verified: verifications.filter((v) => v.TrangThaiXacThuc === "đã xác thực")
      .length,
    rejected: verifications.filter((v) => v.TrangThaiXacThuc === "từ chối")
      .length,
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 bg-green-500 text-white rounded-lg shadow-2xl animate-slideInRight">
          <FaCheckCircle className="text-2xl" />
          <div>
            <p className="font-bold">Cập nhật thành công!</p>
            <p className="text-sm">Trạng thái xác thực đã được lưu</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fadeInUp">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
            <FaCheckCircle className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Quản lý xác thực
            </h2>
            <p className="text-sm text-gray-500">
              Tổng cộng:{" "}
              <span className="font-bold text-orange-600">{stats.total}</span>{" "}
              yêu cầu
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-fadeInUp"
        style={{ animationDelay: "100ms" }}
      >
        <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
              <FaFileAlt className="text-2xl text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Tổng số</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-yellow-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
              <FaClock className="text-2xl text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-green-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.verified}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-red-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <FaTimesCircle className="text-2xl text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Từ chối</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      {/* Search & Filter Section - GRID LAYOUT */}
      <div className="animate-fadeInUp" style={{ animationDelay: "200ms" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Search - Takes 8 columns on large screens */}
          <div className="lg:col-span-8 relative">
            <input
              type="search"
              placeholder="Tìm kiếm theo tiêu đề, địa chỉ, tên người bán, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              autoComplete="off"
              className="w-full py-3 pl-12 pr-4 text-sm font-medium text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none hover:border-orange-400"
            />
          </div>

          {/* Filter - Takes 4 columns on large screens */}
          <div className="lg:col-span-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg flex-shrink-0">
              <FaFilter className="text-orange-600" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none hover:border-orange-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Verification Cards */}
      <div
        className="space-y-4 animate-fadeInUp"
        style={{ animationDelay: "300ms" }}
      >
        {verifications.length > 0 ? (
          verifications.map((verification, index) => {
            const statusInfo = getStatusInfo(verification.TrangThaiXacThuc);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={verification.MaTTND}
                className="overflow-hidden bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] animate-fadeInUp"
                style={{ animationDelay: `${(index + 4) * 50}ms` }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                    <img
                      src={
                        verification.HinhAnh
                          ? `${SERVER_URL}${verification.HinhAnh}`
                          : "/placeholder.svg?height=200&width=300"
                      }
                      alt={verification.TieuDe}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=200&width=300";
                      }}
                    />
                    <div
                      className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-${statusInfo.color}-700 bg-${statusInfo.color}-100 rounded-full backdrop-blur-sm`}
                    >
                      <StatusIcon />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2">
                      {verification.TieuDe}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <FaMapMarkerAlt className="text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {verification.DiaChi}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaUser className="text-blue-600 flex-shrink-0" />
                        <span>
                          {verification.TenNguoiBan} (
                          {verification.EmailNguoiBan})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCalendarAlt className="text-purple-600 flex-shrink-0" />
                        <span>Gửi: {formatDate(verification.NgayGui)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                        <FaMoneyBillWave className="text-green-600" />
                        <span className="text-lg font-bold text-green-700">
                          {formatPrice(verification.Gia)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(verification.MaTTND)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:shadow-lg hover:scale-105 active:scale-95"
                        >
                          <FaEye />
                          <span>Chi tiết</span>
                        </button>

                        {verification.TrangThaiXacThuc === "chờ xác thực" && (
                          <button
                            onClick={() =>
                              handleViewDetail(verification.MaTTND)
                            }
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:shadow-lg hover:scale-105 active:scale-95"
                          >
                            <FaCheckCircle />
                            <span>Duyệt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
              <FaSearch className="text-2xl text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-500">
              Không có yêu cầu xác thực nào
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-xl shadow-lg animate-fadeInUp">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <FaChevronLeft />
            <span>Trước</span>
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 text-sm font-bold transition-all duration-300 rounded-lg ${
                  currentPage === page
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-110"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>Sau</span>
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVerification && (
        <VerificationDetailModal
          verification={selectedVerification}
          onClose={() => setShowDetailModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

// Detail Modal Component
const VerificationDetailModal = ({ verification, onClose, onUpdateStatus }) => {
  const [adminNote, setAdminNote] = useState(verification.GhiChuAdmin || "");
  const [selectedStatus, setSelectedStatus] = useState(
    verification.TrangThaiXacThuc,
  );
  const [adminChecks, setAdminChecks] = useState({
    coSoDoSoHong: verification.CoSoDoSoHong || false,
    daCungCapBanChup: verification.DaCungCapBanChup || false,
    dungDiaChi: verification.DungDiaChi || false,
    bdsTonTaiDungDiaChi: verification.BDSTonTaiDungDiaChi || false,
    dungHinhAnhDacDiem: verification.DungHinhAnhDacDiem || false,
    daDoiChieuVoiSoDo: verification.DaDoiChieuVoiSoDo || false,
    coGiayXacNhanKhongTraanhChap:
      verification.CoGiayXacNhanKhongTraanhChap || false,
    daKiemTraQuyHoach: verification.DaKiemTraQuyHoach || false,
  });

  const checklistItems = [
    { key: "coSoDoSoHong", label: "Có sổ đỏ/sổ hồng" },
    { key: "daCungCapBanChup", label: "Đã cung cấp bản chụp sổ đỏ/sổ hồng" },
    { key: "dungDiaChi", label: "Đúng địa chỉ" },
    {
      key: "bdsTonTaiDungDiaChi",
      label: "BĐS tồn tại đúng địa chỉ trên tin đăng và sổ đỏ/sổ hồng",
    },
    { key: "dungHinhAnhDacDiem", label: "Đúng hình ảnh và đặc điểm" },
    {
      key: "daDoiChieuVoiSoDo",
      label: "Đã đối chiếu hình ảnh với sổ đỏ và video",
    },
    {
      key: "coGiayXacNhanKhongTraanhChap",
      label: "Có giấy xác nhận không tranh chấp",
    },
    { key: "daKiemTraQuyHoach", label: "Đã kiểm tra thông tin quy hoạch" },
  ];

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setAdminChecks((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = () => {
    onUpdateStatus(verification.MaTTND, selectedStatus, {
      ghiChuAdmin: adminNote,
      ...adminChecks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-scaleIn">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Chi tiết yêu cầu xác thực
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-white transition-all duration-300 bg-white/20 rounded-full hover:bg-white/30 hover:rotate-90"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Property Info */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-800">
              <FaHome className="text-blue-600" />
              Thông tin bất động sản
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Tiêu đề
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {verification.TieuDe}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Địa chỉ
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {verification.DiaChi}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">Giá</p>
                <p className="text-sm font-bold text-green-600">
                  {verification.Gia?.toLocaleString()} VNĐ
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Người bán
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {verification.TenNguoiBan}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Email
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {verification.EmailNguoiBan}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">SĐT</p>
                <p className="text-sm font-bold text-gray-800">
                  {verification.SDTNguoiBan}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-800">
              <FaFileAlt className="text-purple-600" />
              Tài liệu đã gửi
            </h3>

            {verification.GhiChuNguoiBan && (
              <div className="p-3 mb-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Ghi chú từ người bán
                </p>
                <p className="text-sm text-gray-700">
                  {verification.GhiChuNguoiBan}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {verification.FileSoDo && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <FaFileAlt className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    File sổ đỏ:
                  </span>
                  {verification.FileSoDo.split(",").map((file, index) => (
                    <a
                      key={index}
                      href={`${SERVER_URL}${file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-all duration-300"
                    >
                      Xem file {index + 1}
                    </a>
                  ))}
                </div>
              )}

              {verification.VideoXacThuc && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <FaVideo className="text-red-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Video xác thực:
                  </span>
                  <a
                    href={`${SERVER_URL}${verification.VideoXacThuc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs font-bold text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-all duration-300"
                  >
                    Xem video
                  </a>
                </div>
              )}
            </div>

            {verification.CamKetCapNhatDinhKy && (
              <div className="flex items-center gap-2 p-3 mt-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600" />
                <span className="text-sm font-bold text-green-700">
                  Đã cam kết cập nhật trạng thái định kỳ
                </span>
              </div>
            )}
          </div>

          {/* Admin Checklist */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-800">
              <FaCheckCircle className="text-green-600" />
              Xác thực của admin
            </h3>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {checklistItems.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-300"
                >
                  <input
                    type="checkbox"
                    name={item.key}
                    checked={adminChecks[item.key]}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status & Note */}
          <div className="space-y-3">
            <div>
              <label className="block mb-2 text-sm font-bold text-gray-700">
                Trạng thái
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 text-sm font-bold transition-all duration-300 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none"
              >
                <option value="chờ xác thực">Chờ xác thực</option>
                <option value="đã xác thực">Đã xác thực</option>
                <option value="từ chối">Từ chối</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold text-gray-700">
                Ghi chú của admin
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows="4"
                className="w-full px-4 py-3 text-sm font-medium transition-all duration-300 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 flex gap-3 px-6 py-4 bg-gray-50 border-t-2 border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-95"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationManager;
