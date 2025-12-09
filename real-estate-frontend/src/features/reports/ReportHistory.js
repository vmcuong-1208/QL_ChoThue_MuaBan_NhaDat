"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaFlag,
  FaClock,
  FaCheckCircle,
  FaSearch,
  FaHome,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaFilter,
  FaMapMarkerAlt,
  FaTag,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { API_URL, SERVER_URL } from "../../services/api";

const STATUS_CONFIG = {
  CHO_XU_LY: {
    label: "Chờ xử lý",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
    icon: FaClock,
    desc: "Báo cáo của bạn đã được tiếp nhận và đang chờ Admin kiểm tra.",
  },
  DANG_KIEM_TRA: {
    label: "Đang kiểm tra",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
    icon: FaSearch,
    desc: "Admin đang đối chiếu thông tin và liên hệ với môi giới phụ trách tin đăng.",
  },
  DA_XU_LY: {
    label: "Đã xử lý",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
    icon: FaCheckCircle,
    desc: "Admin đã hoàn tất kiểm tra và thực hiện các biện pháp xử lý phù hợp.",
  },
  DA_GO_TIN: {
    label: "Đã xử lý (Gỡ tin)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
    icon: FaCheckCircle,
    desc: "Tin đăng vi phạm đã bị gỡ khỏi hệ thống.",
  },
};

const formatPrice = (price) => {
  if (!price || Number(price) === 0) return "Thỏa thuận";
  const num = Number(price);
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2).replace(/\.00$/, "")} tỷ`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(0)} triệu`;
  }
  return num.toLocaleString("vi-VN") + " đ";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const ReportHistory = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchMyReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/property-reports/user/my-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setReports(response.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử báo cáo:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách báo cáo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  const renderThumbnail = (url) => {
    if (!url) return "/placeholder.svg?height=120&width=160";
    if (url.startsWith("http")) return url;
    return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Filtered reports
  const filteredReports = reports.filter((item) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "DA_XU_LY") {
      return item.TrangThai === "DA_XU_LY" || item.TrangThai === "DA_GO_TIN";
    }
    return item.TrangThai === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Breadcrumb */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center text-2xl font-bold">
                  🚩
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                    Lịch sử báo cáo tin sai phạm
                  </h1>
                  <p className="text-sm md:text-base text-slate-500 mt-1">
                    Theo dõi tiến độ, trạng thái thẩm định và kết quả xử lý các tin đăng bạn đã báo cáo
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                Tổng báo cáo: {reports.length}
              </span>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                filterStatus === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({reports.length})
            </button>
            <button
              onClick={() => setFilterStatus("CHO_XU_LY")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                filterStatus === "CHO_XU_LY"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Chờ xử lý (
              {reports.filter((r) => r.TrangThai === "CHO_XU_LY").length})
            </button>
            <button
              onClick={() => setFilterStatus("DANG_KIEM_TRA")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                filterStatus === "DANG_KIEM_TRA"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              Đang kiểm tra (
              {reports.filter((r) => r.TrangThai === "DANG_KIEM_TRA").length})
            </button>
            <button
              onClick={() => setFilterStatus("DA_XU_LY")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                filterStatus === "DA_XU_LY"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              Đã xử lý (
              {
                reports.filter(
                  (r) => r.TrangThai === "DA_XU_LY" || r.TrangThai === "DA_GO_TIN"
                ).length
              }
              )
            </button>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải lịch sử báo cáo...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <FaExclamationTriangle className="mx-auto text-3xl mb-2 text-red-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchMyReports}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-slate-800">Không có báo cáo nào</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
              {filterStatus === "all"
                ? "Bạn chưa từng gửi báo cáo sai phạm nào. Khi phát hiện tin đăng có dấu hiệu vi phạm hoặc lừa đảo, bạn có thể nhấn nút Báo cáo tin đăng tại trang chi tiết."
                : "Không có báo cáo nào ở trạng thái này."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((item) => {
              const cfg = STATUS_CONFIG[item.TrangThai] || STATUS_CONFIG.CHO_XU_LY;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={item.MaBC}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Property info */}
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={renderThumbnail(item.HinhAnh)}
                        alt={item.TieuDeTinDang || "Tin đăng"}
                        className="w-24 h-20 sm:w-28 sm:h-24 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            Mã tin #{item.MaTTND}
                          </span>
                          <span className="text-xs font-bold text-slate-400">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <FaClock size={11} /> {formatDate(item.NgayBaoCao)}
                          </span>
                        </div>

                        <Link
                          to={`/bat-dong-san/${item.MaTTND}`}
                          className="font-bold text-base sm:text-lg text-slate-900 hover:text-blue-600 transition line-clamp-2"
                        >
                          {item.TieuDeTinDang || "Bất động sản"}
                        </Link>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {item.Gia && (
                            <span className="font-extrabold text-red-600 text-sm">
                              {formatPrice(item.Gia)}
                            </span>
                          )}
                          {item.DiaChi && (
                            <span className="flex items-center gap-1 text-slate-500 line-clamp-1">
                              <FaMapMarkerAlt className="text-slate-400" />
                              {item.DiaChi}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-start lg:items-end gap-1 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${cfg.badgeClass}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`}></span>
                        <StatusIcon size={12} />
                        <span>{cfg.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Report details */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 flex-shrink-0">
                        Lý do: {item.LyDo}
                      </span>
                    </div>

                    {item.MoTaChiTiet && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700">
                        <strong className="text-slate-800">Nội dung phản ánh: </strong>
                        {item.MoTaChiTiet}
                      </div>
                    )}

                    {/* Admin response */}
                    {item.GhiChuAdmin && (
                      <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-sm text-blue-900 flex items-start gap-2">
                        <FaInfoCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Phản hồi từ Admin: </strong>
                          <span>{item.GhiChuAdmin}</span>
                          {item.NgayXuLy && (
                            <span className="block text-xs text-blue-500 mt-1">
                              Thời gian xử lý: {formatDate(item.NgayXuLy)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportHistory;
