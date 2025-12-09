"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSearch,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaIdCard,
  FaStar,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaWallet,
  FaCoins,
} from "react-icons/fa";
import { API_URL } from "../../services/api";

const RevenueManager = () => {
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Bộ lọc bảng giao dịch
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, NANG_CAP_MOI_GIOI, TIN_NOI_BAT
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Bộ lọc biểu đồ thời gian
  const [timeRange, setTimeRange] = useState("month"); // 7days, month, year
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const token = localStorage.getItem("token");

  // 1. Tải tổng quan
  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await axios.get(`${API_URL}/admin/revenue/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setOverview(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy tổng quan doanh thu:", err);
    } finally {
      setLoadingOverview(false);
    }
  }, [token]);

  // 2. Tải danh sách giao dịch
  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTable(true);
      const finalService = activeTab !== "ALL" ? activeTab : serviceFilter;
      const res = await axios.get(`${API_URL}/admin/revenue/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 10,
          search,
          service: finalService,
          status: statusFilter,
          method: methodFilter,
        },
      });
      if (res.data?.success) {
        setTransactions(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách giao dịch:", err);
    } finally {
      setLoadingTable(false);
    }
  }, [token, page, search, serviceFilter, statusFilter, methodFilter, activeTab]);

  // 3. Tải phân tích biểu đồ
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const res = await axios.get(`${API_URL}/admin/revenue/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeRange },
      });
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy phân tích doanh thu:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("vi-VN") + " VNĐ";
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

  // Tính toán tọa độ biểu đồ Line Chart SVG dạng nét đơn sắc tối giản
  const chartCoordinates = useMemo(() => {
    if (!analytics || analytics.length === 0) return null;

    const width = 640;
    const height = 220;
    const padding = { top: 25, right: 30, bottom: 35, left: 65 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = analytics.map((d) => Number(d.total || 0));
    const maxVal = Math.max(...values, 100000);
    const niceMax = Math.ceil(maxVal / 100000) * 100000;

    const points = analytics.map((d, index) => {
      const x =
        analytics.length === 1
          ? padding.left + chartWidth / 2
          : padding.left + (index / (analytics.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (Number(d.total || 0) / niceMax) * chartHeight;
      return { x, y, data: d, val: Number(d.total || 0) };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    // 4 đường kẻ ngang tham chiếu (Grid lines)
    const yTicks = [0, niceMax * 0.33, niceMax * 0.66, niceMax].map((val) => ({
      val,
      y: padding.top + chartHeight - (val / niceMax) * chartHeight,
      label: val >= 1000000 ? `${(val / 1000000).toFixed(1)}Tr` : `${(val / 1000).toFixed(0)}k`,
    }));

    return { width, height, padding, chartWidth, chartHeight, points, pathD, yTicks, niceMax };
  }, [analytics]);

  const renderServiceBadge = (service) => {
    switch (service) {
      case "NANG_CAP_MOI_GIOI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FaIdCard className="text-blue-500" /> Nâng cấp môi giới
          </span>
        );
      case "TIN_NOI_BAT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FaStar className="text-amber-500" /> Tin nổi bật
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Dịch vụ khác
          </span>
        );
    }
  };

  const renderMethodBadge = (method) => {
    if ((method || "").toLowerCase().includes("momo")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
          Ví MoMo
        </span>
      );
    }
    if ((method || "").toLowerCase().includes("sepay") || (method || "").toLowerCase().includes("vietqr")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          VietQR (Ngân hàng)
        </span>
      );
    }
    return <span className="text-[11px] text-slate-500">{method || "Khác"}</span>;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FaCheckCircle className="text-emerald-500" /> Thành công
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Chờ xử lý
          </span>
        );
      case "FAILED":
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <FaTimesCircle className="text-rose-500" /> Thất bại
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Search Bar - Chuẩn thống nhất hệ thống Quản trị */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FaMoneyBillWave className="text-blue-600 text-xl" />
            <span>Quản lý doanh thu & dòng tiền</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Báo cáo tài chính, kiểm soát các khoản thu phí dịch vụ và giao dịch cổng thanh toán
          </p>
        </div>

        {/* Thanh tìm kiếm & Làm mới */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-72">
            <FaSearch className="absolute text-slate-400 left-3 top-1/2 -translate-y-1/2 text-xs" />
            <input
              type="text"
              placeholder="Tìm theo Mã GD, tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-2xs"
            />
          </form>

          <button
            onClick={() => {
              fetchOverview();
              fetchTransactions();
              fetchAnalytics();
            }}
            title="Làm mới số liệu"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition shadow-2xs"
          >
            <FaSyncAlt className="text-xs" />
          </button>
        </div>
      </header>

      {/* 2. Thống kê 4 thẻ số liệu tài chính (KPI Cards) - Màu nền trắng viền xám đồng bộ 100% */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Thẻ 1: Hôm nay */}
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 flex-shrink-0">
            <FaCalendarAlt className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Hôm nay
            </span>
            <p className="text-base font-bold text-slate-900 leading-tight">
              {loadingOverview ? "..." : formatMoney(overview?.todayRevenue)}
            </p>
            <span className="text-[10px] text-slate-400">
              {overview?.todayTransactions || 0} giao dịch
            </span>
          </div>
        </div>

        {/* Thẻ 2: Tháng này */}
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 flex-shrink-0">
            <FaChartLine className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tháng này
            </span>
            <p className="text-base font-bold text-blue-700 leading-tight">
              {loadingOverview ? "..." : formatMoney(overview?.monthRevenue)}
            </p>
            <span className="text-[10px] text-slate-400">
              {overview?.monthTransactions || 0} giao dịch
            </span>
          </div>
        </div>

        {/* Thẻ 3: Năm nay */}
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 flex-shrink-0">
            <FaWallet className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Năm nay (2026)
            </span>
            <p className="text-base font-bold text-slate-900 leading-tight">
              {loadingOverview ? "..." : formatMoney(overview?.yearRevenue)}
            </p>
            <span className="text-[10px] text-slate-400">
              {overview?.yearTransactions || 0} giao dịch
            </span>
          </div>
        </div>

        {/* Thẻ 4: Tổng toàn sàn - Nền trắng đồng bộ với 3 thẻ còn lại */}
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 flex-shrink-0">
            <FaCoins className="text-base" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tổng toàn sàn
            </span>
            <p className="text-base font-bold text-emerald-700 leading-tight">
              {loadingOverview ? "..." : formatMoney(overview?.totalRevenue)}
            </p>
            <span className="text-[10px] text-slate-400">
              Đã thu {overview?.totalTransactions || 0} khoản
            </span>
          </div>
        </div>
      </section>

      {/* 3. Phân tích doanh thu & Cơ cấu nguồn thu */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LINE CHART BIỂU DIỄN DÒNG TIỀN (2 CỘT) */}
        <article className="lg:col-span-2 p-5 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                Biểu đồ xu hướng dòng tiền
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Đồ thị đơn sắc thể hiện biến động doanh thu theo thời gian
              </p>
            </div>

            {/* Bộ chọn chu kỳ thời gian */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setTimeRange("7days")}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === "7days" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                7 Ngày
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === "month" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30 Ngày
              </button>
              <button
                onClick={() => setTimeRange("year")}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === "year" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Năm 2026
              </button>
            </div>
          </div>

          {/* Line Chart SVG màu đơn sắc thuần túy (Monochrome line, không dải màu loang lổ) */}
          {loadingAnalytics ? (
            <div className="py-20 text-center text-slate-400 text-xs">Đang nạp dữ liệu đồ thị...</div>
          ) : !chartCoordinates || chartCoordinates.points.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              Chưa có dữ liệu phát sinh trong khoảng thời gian này
            </div>
          ) : (
            <div className="relative">
              {/* Tooltip khi hover lên các điểm mốc */}
              {hoveredPoint && (
                <div
                  className="absolute z-10 -top-2 transform -translate-x-1/2 -translate-y-full px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg shadow-lg pointer-events-none transition-all duration-150 border border-slate-700 whitespace-nowrap"
                  style={{
                    left: `${(hoveredPoint.x / chartCoordinates.width) * 100}%`,
                    top: `${hoveredPoint.y}px`,
                  }}
                >
                  <div className="font-semibold text-[11px] text-slate-300">
                    {hoveredPoint.data.timeLabel}
                  </div>
                  <div className="font-bold text-sm text-blue-400">
                    {formatMoney(hoveredPoint.val)}
                  </div>
                </div>
              )}

              <svg
                viewBox={`0 0 ${chartCoordinates.width} ${chartCoordinates.height}`}
                className="w-full h-56 select-none overflow-visible"
              >
                {/* Đường lưới ngang tham chiếu (Đơn sắc xám nhạt) */}
                {chartCoordinates.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={chartCoordinates.padding.left}
                      y1={tick.y}
                      x2={chartCoordinates.width - chartCoordinates.padding.right}
                      y2={tick.y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? "none" : "3 3"}
                    />
                    <text
                      x={chartCoordinates.padding.left - 10}
                      y={tick.y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="sans-serif"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                {/* Đường line chart chính đơn sắc xanh Royal (#2563eb) */}
                <path
                  d={chartCoordinates.pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Các điểm nút tròn đơn sắc */}
                {chartCoordinates.points.map((p, i) => (
                  <g
                    key={i}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPoint?.x === p.x ? "5.5" : "3.5"}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />

                    {/* Nhãn trục X dưới chân mỗi điểm (Giãn cách nhãn khi có 30 ngày để không bị đè chữ) */}
                    {(analytics.length <= 12 || i % Math.ceil(analytics.length / 8) === 0 || i === analytics.length - 1) && (
                      <text
                        x={p.x}
                        y={chartCoordinates.height - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={hoveredPoint?.x === p.x ? "700" : "500"}
                        fill={hoveredPoint?.x === p.x ? "#1e293b" : "#64748b"}
                        fontFamily="sans-serif"
                      >
                        {p.data.timeLabel}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          )}
        </article>

        {/* Tỷ trọng dịch vụ & Cổng thanh toán (1 cột) */}
        <article className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Tỷ trọng nguồn thu</h3>
            <p className="text-[11px] text-slate-500 mb-3">Doanh thu phân bổ theo từng loại dịch vụ</p>

            <div className="space-y-2">
              {overview?.byService && overview.byService.length > 0 ? (
                overview.byService
                  .filter((srv) => srv.service !== "GOI_VIP")
                  .map((srv, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {srv.service === "NANG_CAP_MOI_GIOI"
                            ? "Nâng cấp môi giới"
                            : srv.service === "TIN_NOI_BAT"
                            ? "Tin nổi bật"
                            : "Dịch vụ khác"}
                        </div>
                        <span className="text-[10px] text-slate-400">{srv.count} giao dịch</span>
                      </div>
                      <strong className="text-blue-700 font-bold">{formatMoney(srv.revenue)}</strong>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Chưa có giao dịch phát sinh</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2">
              Kênh thanh toán đã nhận
            </h4>
            <div className="space-y-1.5 text-xs">
              {overview?.byMethod?.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span>{renderMethodBadge(m.method)}</span>
                  <strong className="text-slate-800">{formatMoney(m.revenue)}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {/* 4. Tab lọc dạng viên thuốc (Filter Pills) - Đã bỏ Gói VIP */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("ALL");
            setServiceFilter("ALL");
            setPage(1);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Tất cả nguồn thu</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("NANG_CAP_MOI_GIOI");
            setPage(1);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "NANG_CAP_MOI_GIOI"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          <FaIdCard className="text-[11px]" />
          <span>Nâng cấp môi giới (299k)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("TIN_NOI_BAT");
            setPage(1);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "TIN_NOI_BAT"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FaStar className="text-[11px]" />
          <span>Tin đăng nổi bật</span>
        </button>
      </div>

      {/* 5. Bảng danh sách lịch sử giao dịch (Table Card) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Bộ lọc nhỏ */}
        <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Lọc trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="FAILED">Thất bại</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Cổng:</span>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả cổng</option>
              <option value="VietQR_SePay">VietQR Ngân hàng (SePay)</option>
              <option value="MoMo">Ví MoMo</option>
            </select>
          </div>
        </div>

        {/* Table data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã Giao Dịch</th>
                <th className="py-3 px-4">Người Thanh Toán</th>
                <th className="py-3 px-4">Loại Dịch Vụ</th>
                <th className="py-3 px-4">Số Tiền</th>
                <th className="py-3 px-4">Phương Thức</th>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingTable ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Đang tải dữ liệu giao dịch...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Không tìm thấy giao dịch nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.MaGD} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {tx.OrderId || `GD${String(tx.MaGD).padStart(4, "0")}`}
                      {tx.TransId && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Mã cổng: {tx.TransId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {tx.TenNguoiThanhToan || `Tài khoản #${tx.MaNgDung}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tx.EmailNguoiThanhToan || tx.SDTNguoiThanhToan || "-"}
                      </div>
                    </td>

                    <td className="py-3 px-4">{renderServiceBadge(tx.LoaiDichVu)}</td>

                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {formatMoney(tx.Amount)}
                    </td>

                    <td className="py-3 px-4">{renderMethodBadge(tx.PhuongThucThanhToan)}</td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatDate(tx.NgayTao)}
                    </td>

                    <td className="py-3 px-4 text-center">{renderStatusBadge(tx.TrangThai)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang chuẩn */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3.5 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Hiển thị trang <strong>{pagination.page}</strong> / {pagination.totalPages} (Tổng{" "}
              <strong>{pagination.total}</strong> giao dịch)
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                title="Trang trước"
              >
                <FaChevronLeft className="text-[10px]" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), page + 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-xs ${
                      p === page ? "bg-slate-900 text-white" : "border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                title="Trang sau"
              >
                <FaChevronRight className="text-[10px]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueManager;
