"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChartLine,
  FaEye,
  FaEnvelopeOpenText,
  FaCheckCircle,
  FaClock,
  FaHome,
  FaExternalLinkAlt,
  FaArrowUp,
  FaFilter,
  FaSearch,
  FaUsers,
  FaPlus,
  FaPercent,
  FaLayerGroup,
  FaFire,
  FaAward,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const BrokerAnalytics = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      tongLuotXem: 0,
      tongLuotLienHe: 0,
      tinDangHoatDong: 0,
      tongSoTin: 0,
      tiLeChuyenDoi: "0.00",
    },
    categories: [],
    topViews: [],
    topLeads: [],
    propertiesPerformance: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/broker-analytics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data?.success && response.data?.data) {
        setAnalyticsData(response.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải thống kê môi giới:", err);
      setError(
        err.response?.data?.message ||
          "Không thể kết nối đến máy chủ để tải dữ liệu thống kê."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    const role = (currentUser?.LoaiTaiKhoan || "").toLowerCase();
    const isBrokerOrAdmin =
      role.includes("môi") ||
      role.includes("broker") ||
      role.includes("admin") ||
      role.includes("đầu tư");

    if (!isBrokerOrAdmin) {
      navigate("/");
      return;
    }
    fetchAnalytics();
  }, [currentUser, navigate, fetchAnalytics]);

  const renderImageUrl = (url) => {
    if (!url) return "/placeholder.svg?height=80&width=120";
    if (url.startsWith("http")) return url;
    return `${SERVER_URL}${url}`;
  };

  // Lọc bảng hiệu suất theo từ khóa và loại hình
  const filteredPerformance = (analyticsData.propertiesPerformance || []).filter(
    (item) => {
      const matchSearch =
        !searchTerm ||
        item.TieuDe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.DiaChi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.MaTTND) === searchTerm.trim();

      const matchCat =
        selectedCategoryFilter === "all" ||
        item.TenLoai === selectedCategoryFilter;

      return matchSearch && matchCat;
    }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Đang tổng hợp dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  const { summary, categories, topViews, topLeads } = analyticsData;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* TOP HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md">
              <FaChartLine />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Thống kê hiệu quả hoạt động
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Phân quyền Môi giới
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi mức độ tiếp cận, số lượt liên hệ và đánh giá hiệu quả chuyển đổi từng tin đăng bất động sản
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <FaClock className="text-slate-400" />
              <span>Cập nhật số liệu</span>
            </button>
            <Link
              to="/quan-ly-khach-hang"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
            >
              <FaUsers />
              <span>Khách hàng quan tâm</span>
            </Link>
            <Link
              to="/quan-ly-bai-dang"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              <FaHome />
              <span>Quản lý tin đăng</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* 3 THÔNG TIN THỐNG KÊ CỐT LÕI (GIAO DIỆN MẪU THEO YÊU CẦU) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. SỐ LƯỢT XEM */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/70 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Số lượt xem tin
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                <FaEye />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {summary.tongLuotXem.toLocaleString("vi-VN")}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Tổng số lần các tin đăng của bạn được khách hàng xem trên toàn hệ thống
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Mức độ tiếp cận:</span>
              <span className="font-bold text-blue-600 inline-flex items-center gap-1">
                <FaArrowUp className="text-[10px]" />
                Đang tăng trưởng
              </span>
            </div>
          </div>

          {/* 2. SỐ LƯỢT LIÊN HỆ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/70 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Số lượt liên hệ
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                <FaEnvelopeOpenText />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
                {summary.tongLuotLienHe.toLocaleString("vi-VN")}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Số lượng khách hàng tiềm năng đã gửi yêu cầu tư vấn hoặc gọi điện
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tỷ lệ chuyển đổi:</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {summary.tiLeChuyenDoi}% (Liên hệ / Lượt xem)
              </span>
            </div>
          </div>

          {/* 3. SỐ TIN ĐANG HOẠT ĐỘNG */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/70 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                3. Tin đang hoạt động
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                <FaCheckCircle />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 tracking-tight">
                {summary.tinDangHoatDong.toLocaleString("vi-VN")}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Tin đăng đã được duyệt và đang hiển thị công khai trên website
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tổng tin sở hữu:</span>
              <span className="font-bold text-slate-800">
                {summary.tongSoTin} tin (gồm chờ duyệt/hết hạn)
              </span>
            </div>
          </div>
        </div>

        {/* 2 CỘT CHI TIẾT: PHÂN LOẠI DANH MỤC & TOP HIỆU SUẤT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột 1: Phân bổ tin đang hoạt động theo loại hình BĐS */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FaLayerGroup className="text-blue-600 text-sm" />
                <h3 className="font-bold text-sm text-slate-900">
                  Tin theo loại bất động sản
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {summary.tinDangHoatDong} tin hoạt động
              </span>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-3">
                {categories.map((cat, idx) => {
                  const percent =
                    summary.tinDangHoatDong > 0
                      ? Math.round((cat.soTin / summary.tinDangHoatDong) * 100)
                      : 0;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {cat.TenLoai}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {cat.soTin} tin
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({percent}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có tin đăng hoạt động nào để phân loại.
              </div>
            )}
          </div>

          {/* Cột 2: Bất động sản có nhiều LƯỢT XEM nhất */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FaFire className="text-amber-500 text-sm" />
                <h3 className="font-bold text-sm text-slate-900">
                  Top tin có lượt xem cao nhất
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Lượt xem</span>
            </div>

            {topViews.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {topViews.map((item, idx) => (
                  <div
                    key={item.MaTTND}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/bat-dong-san/${item.MaTTND}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-slate-800 hover:text-blue-600 line-clamp-1 block"
                          title={item.TieuDe}
                        >
                          {item.TieuDe}
                        </Link>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span className="text-red-600 font-bold">
                            {formatPrice(item.Gia)}
                          </span>
                          <span>•</span>
                          <span>{item.TenLoai}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-black text-blue-600 flex items-center gap-1 justify-end">
                        <FaEye className="text-[10px]" />
                        <span>{item.SoLuotXem.toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.SoLuotLienHe} liên hệ
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có dữ liệu lượt xem.
              </div>
            )}
          </div>

          {/* Cột 3: Bất động sản có nhiều LƯỢT LIÊN HỆ nhất */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FaAward className="text-emerald-500 text-sm" />
                <h3 className="font-bold text-sm text-slate-900">
                  Top tin thu hút liên hệ nhất
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Khách gửi yêu cầu</span>
            </div>

            {topLeads.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {topLeads.map((item, idx) => (
                  <div
                    key={item.MaTTND}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/bat-dong-san/${item.MaTTND}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-slate-800 hover:text-blue-600 line-clamp-1 block"
                          title={item.TieuDe}
                        >
                          {item.TieuDe}
                        </Link>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span className="text-red-600 font-bold">
                            {formatPrice(item.Gia)}
                          </span>
                          <span>•</span>
                          <span>{item.TenLoai}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-black text-emerald-600 flex items-center gap-1 justify-end">
                        <FaEnvelopeOpenText className="text-[10px]" />
                        <span>{item.SoLuotLienHe} lượt</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.SoLuotXem} lượt xem
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có dữ liệu yêu cầu liên hệ.
              </div>
            )}
          </div>
        </div>

        {/* BẢNG CHI TIẾT HIỆU SUẤT TẤT CẢ TIN ĐĂNG */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Header & Filter Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Chi tiết hiệu suất từng tin đăng ({filteredPerformance.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảng theo dõi lượt xem, số liên hệ và tỷ lệ chuyển đổi cho tất cả bất động sản
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Tìm kiếm */}
              <div className="relative min-w-[220px]">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Lọc loại hình */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">Tất cả loại BĐS</option>
                {categories.map((c) => (
                  <option key={c.TenLoai} value={c.TenLoai}>
                    {c.TenLoai}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">Mã</th>
                  <th className="py-3 px-4">Tin đăng bất động sản</th>
                  <th className="py-3 px-4 w-32">Loại hình</th>
                  <th className="py-3 px-4 w-32 text-center">Lượt xem</th>
                  <th className="py-3 px-4 w-32 text-center">Lượt liên hệ</th>
                  <th className="py-3 px-4 w-32 text-center">Tỷ lệ chuyển đổi</th>
                  <th className="py-3 px-4 w-28 text-center">Trạng thái</th>
                  <th className="py-3 px-4 w-24 text-right">Xem tin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPerformance.length > 0 ? (
                  filteredPerformance.map((item) => {
                    const convRate =
                      item.SoLuotXem > 0
                        ? ((item.SoLuotLienHe / item.SoLuotXem) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr key={item.MaTTND} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          #{item.MaTTND}
                        </td>

                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex items-start gap-2.5">
                            <img
                              src={renderImageUrl(item.HinhAnh)}
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
                                className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1 block"
                                title={item.TieuDe}
                              >
                                {item.TieuDe}
                              </Link>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span className="text-red-600 font-bold">
                                  {formatPrice(item.Gia)}
                                </span>
                                <span>•</span>
                                <span>{item.DienTich} m²</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {item.TenLoai}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-blue-600 flex items-center justify-center gap-1">
                            <FaEye className="text-[10px]" />
                            <span>{item.SoLuotXem.toLocaleString("vi-VN")}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-emerald-600 flex items-center justify-center gap-1">
                            <FaEnvelopeOpenText className="text-[10px]" />
                            <span>{item.SoLuotLienHe}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              Number(convRate) > 5
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : Number(convRate) > 0
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {convRate}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.TrangThaiDuyet === "APPROVED" ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold text-[10px]">
                              Đang hiển thị
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold text-[10px]">
                              {item.TrangThaiDuyet}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/bat-dong-san/${item.MaTTND}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <span>Xem</span>
                            <FaExternalLinkAlt className="text-[9px]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      Không có tin đăng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerAnalytics;
