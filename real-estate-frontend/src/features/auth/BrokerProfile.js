"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaHome,
  FaCheckCircle,
  FaAward,
  FaRulerCombined,
  FaShareAlt,
  FaSearch,
  FaShieldAlt,
  FaClock,
  FaComments,
  FaCopy,
  FaBed,
  FaBath,
  FaAngleRight,
  FaPaperPlane,
  FaStar,
  FaRegStar,
  FaThumbsUp,
  FaEdit,
  FaTrashAlt,
  FaQuoteLeft,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { API_URL, SERVER_URL } from "../../services/api";
import ReviewModal from "./ReviewModal";

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
  if (!dateString) return "Chưa xác định";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa xác định";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return "Chưa xác định";
  }
};

const formatMonthYear = (dateString) => {
  if (!dateString) return "Mới tham gia";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Mới tham gia";
    return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
  } catch (e) {
    return "Mới tham gia";
  }
};

const BrokerProfile = () => {
  const { id } = useParams();
  const [broker, setBroker] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'ban' | 'thue'
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'price-asc' | 'price-desc' | 'area-desc'

  // Toast / Share feedback
  const [toastMessage, setToastMessage] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  const { currentUser } = useAuth();

  // Reviews states
  const [reviewsData, setReviewsData] = useState({
    summary: {
      totalReviews: 0,
      avgRating: 5.0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    items: [],
  });
  const [selectedStarFilter, setSelectedStarFilter] = useState("all");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryNote, setInquiryNote] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Tải danh sách đánh giá môi giới
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingReviews(true);
      const res = await axios.get(
        `${API_URL}/broker-reviews/${id}?star=${selectedStarFilter}`
      );
      if (res.data) {
        setReviewsData(res.data);
      }
    } catch (err) {
      console.warn("Lỗi tải đánh giá môi giới:", err.message);
    } finally {
      setLoadingReviews(false);
    }
  }, [id, selectedStarFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Xóa đánh giá
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhận xét đánh giá này không?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/broker-reviews/${reviewId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showToast("Đã xóa đánh giá thành công.");
      fetchReviews();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi xóa đánh giá", "error");
    }
  };

  const renderStars = (score, max = 5) => {
    const num = Math.round(Number(score) || 0);
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[...Array(max)].map((_, i) => (
          <FaStar
            key={i}
            className={i < num ? "text-amber-400" : "text-slate-200"}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchBrokerData = async () => {
      try {
        setLoading(true);
        let brokerData = null;

        // 1. Fetch broker info
        try {
          const brokerRes = await axios.get(`${API_URL}/users/${id}`, { timeout: 6000 });
          if (brokerRes.data && Object.keys(brokerRes.data).length > 0) {
            brokerData = brokerRes.data;
          }
        } catch (apiError) {
          console.warn("[BrokerProfile] /users/:id failed, attempting fallback:", apiError.message);
        }

        // Fallback if needed
        if (!brokerData) {
          try {
            const allUsersRes = await axios.get(`${API_URL}/users`, { timeout: 6000 });
            const list = Array.isArray(allUsersRes.data)
              ? allUsersRes.data
              : allUsersRes.data.users || [];
            brokerData = list.find((u) => String(u.MaNgDung) === String(id));
          } catch (e) {
            console.warn("[BrokerProfile] Fallback /users failed:", e.message);
          }
        }

        if (!brokerData) {
          throw new Error(`Không tìm thấy thông tin nhà môi giới với mã ID: ${id}`);
        }

        setBroker(brokerData);

        // 2. Fetch broker properties
        let propsList = [];
        try {
          const propRes = await axios.get(`${API_URL}/properties?MaNgDung=${id}&limit=100`, {
            timeout: 6000,
          });
          if (propRes.data?.properties && Array.isArray(propRes.data.properties)) {
            propsList = propRes.data.properties;
          } else if (Array.isArray(propRes.data)) {
            propsList = propRes.data;
          } else if (propRes.data?.data && Array.isArray(propRes.data.data)) {
            propsList = propRes.data.data;
          }
        } catch (propErr) {
          console.warn("[BrokerProfile] Fetch properties with MaNgDung failed, fallback to filter:", propErr.message);
          const allPropRes = await axios.get(`${API_URL}/properties?limit=100`, { timeout: 6000 });
          const raw = allPropRes.data?.properties || allPropRes.data || [];
          propsList = raw.filter((p) => String(p.MaNgDung) === String(id));
        }

        // Ensure we filter strictly for this broker ID
        const finalProps = propsList.filter((p) => String(p.MaNgDung) === String(id));
        setProperties(finalProps);
        setError(null);
      } catch (err) {
        console.error("[BrokerProfile] Error:", err);
        setError(err.message || "Không thể tải dữ liệu môi giới.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBrokerData();
    }
  }, [id]);

  // Derive display name
  const displayName = useMemo(() => {
    if (!broker) return "Nhà môi giới BĐS";
    if (broker.HoTen && broker.HoTen.trim() !== "") return broker.HoTen.trim();
    if (broker.TenDangNhap && broker.TenDangNhap.trim() !== "") return broker.TenDangNhap.trim();
    if (broker.Email) {
      const prefix = broker.Email.split("@")[0];
      return `Môi giới ${prefix}`;
    }
    return `Môi giới #${broker.MaNgDung || id}`;
  }, [broker, id]);

  // Set SEO Document Title & Schema
  useEffect(() => {
    if (broker) {
      document.title = `${displayName} - Nhà Môi Giới Bất Động Sản Uy Tín | Bất Động Sản 3MAN`;
    }
  }, [broker, displayName]);

  // Calculate experience
  const experienceYears = useMemo(() => {
    if (!broker?.NgayTao && properties.length === 0) return "< 1 năm";
    let date = null;
    if (broker?.NgayTao) {
      date = new Date(broker.NgayTao);
    } else if (properties.length > 0) {
      const dates = properties.map((p) => new Date(p.NgayTao)).filter((d) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        date = new Date(Math.min(...dates));
      }
    }
    if (date && !isNaN(date.getTime())) {
      const diffYears = new Date().getFullYear() - date.getFullYear();
      if (diffYears >= 1) return `${diffYears} năm`;
    }
    return "< 1 năm";
  }, [broker, properties]);

  // Filter & Sort properties
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Tab filter
    if (activeTab === "ban") {
      result = result.filter(
        (p) =>
          p.TrangThai === "đang bán" ||
          (p.TieuDe && p.TieuDe.toLowerCase().includes("bán")) ||
          !p.ThoiHanThue
      );
    } else if (activeTab === "thue") {
      result = result.filter(
        (p) =>
          p.TrangThai === "cho thuê" ||
          (p.TieuDe && p.TieuDe.toLowerCase().includes("thuê")) ||
          Boolean(p.ThoiHanThue)
      );
    }

    // Keyword search
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          (p.TieuDe && p.TieuDe.toLowerCase().includes(term)) ||
          (p.DiaChi && p.DiaChi.toLowerCase().includes(term)) ||
          (p.MoTa && p.MoTa.toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortBy === "price-asc") {
      result.sort((a, b) => Number(a.Gia || 0) - Number(b.Gia || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => Number(b.Gia || 0) - Number(a.Gia || 0));
    } else if (sortBy === "area-desc") {
      result.sort((a, b) => Number(b.DienTich || 0) - Number(a.DienTich || 0));
    } else {
      // newest
      result.sort((a, b) => new Date(b.NgayTao || 0) - new Date(a.NgayTao || 0));
    }

    return result;
  }, [properties, activeTab, searchTerm, sortBy]);

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Đã sao chép liên kết trang cá nhân!");
    setShowShareModal(false);
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryPhone.trim()) {
      showToast("Vui lòng nhập số điện thoại để môi giới liên hệ!");
      return;
    }
    setInquirySent(true);
    showToast("Gửi thông tin thành công! Môi giới sẽ liên hệ sớm nhất.");
    setTimeout(() => {
      setInquiryName("");
      setInquiryPhone("");
      setInquiryNote("");
      setInquirySent(false);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-medium">Đang tải hồ sơ môi giới...</p>
      </div>
    );
  }

  if (error || !broker) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FaShieldAlt className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy hồ sơ</h2>
          <p className="text-slate-600 text-sm mb-6">
            {error || "Thông tin nhà môi giới không tồn tại hoặc đã ngừng hoạt động trên hệ thống."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = broker.TrangThaiXacMinhMoiGioi === "VERIFIED";
  const avatarUrl = broker.Avatar || broker.AnhDaiDien;
  const phoneNumber = broker.SDT || broker.SoDienThoai || "";
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

  // SEO Schema JSON-LD
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: displayName,
    image: avatarUrl || undefined,
    telephone: phoneNumber || undefined,
    email: broker.Email || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: broker.DiaChi || "Việt Nam",
      addressCountry: "VN",
    },
    url: window.location.href,
    description:
      broker.MoTaBanThan ||
      `Hồ sơ nhà môi giới bất động sản ${displayName}. Chuyên tư vấn mua bán, sang nhượng và cho thuê bất động sản minh bạch, pháp lý an toàn.`,
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      {/* SEO Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-fadeIn">
          <FaCheckCircle className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BREADCRUMB */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-red-600 transition-colors">
              Trang chủ
            </Link>
            <FaAngleRight className="text-slate-400 text-[10px]" />
            <span className="text-slate-600">Nhà môi giới BĐS</span>
            <FaAngleRight className="text-slate-400 text-[10px]" />
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-none">
              {displayName}
            </span>
          </nav>
        </div>
      </div>

      {/* HERO COVER BANNER (Corporate Architectural Navy) */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white pt-10 pb-20 border-b border-slate-800">
        <div
          className="absolute inset-0 opacity-10 bg-repeat pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold tracking-wider uppercase border border-slate-700 mb-2">
                Hồ sơ đối tác môi giới
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Chuyên viên Tư vấn & Phân phối Bất động sản
              </h2>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              Hệ thống Bất Động Sản 3MAN &bull; Thông tin xác thực 100%
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PROFILE CARD (Elevated White Container) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-10">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Avatar & Core Bio */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              {/* Avatar Frame */}
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={`${SERVER_URL}${avatarUrl}`}
                    alt={displayName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white border border-slate-200 shadow-md"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.svg?height=112&width=112";
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-100 ring-4 ring-white border border-slate-300 shadow-md flex items-center justify-center text-slate-600 font-bold text-2xl tracking-wider uppercase">
                    {displayName.slice(0, 2)}
                  </div>
                )}

                {/* Verification icon on avatar */}
                {isVerified && (
                  <div
                    className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center ring-2 ring-white shadow"
                    title="Môi giới đã xác minh CCCD"
                  >
                    <FaCheckCircle className="text-sm" />
                  </div>
                )}
              </div>

              {/* Identity & Badges */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {displayName}
                  </h1>

                  {/* Verification Status Pill */}
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FaCheckCircle className="text-emerald-600 text-xs" />
                      Môi giới đã xác minh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Chưa xác minh CCCD
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <FaAward className="text-blue-500 text-xs" />
                    {broker.LoaiTaiKhoan || "Môi giới"}
                  </span>

                  {/* Đánh giá trung bình */}
                  <a
                    href="#danh-gia"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <FaStar className="text-amber-500 text-xs" />
                    <span>{reviewsData.summary.avgRating}/5 ({reviewsData.summary.totalReviews} đánh giá)</span>
                  </a>
                </div>

                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <FaCalendarAlt className="text-slate-400" />
                    <span>Thành viên từ: {formatMonthYear(broker.NgayTao)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-slate-400" />
                    <span>{broker.DiaChi || "TP. Hồ Chí Minh & lân cận"}</span>
                  </div>

                  {broker.Email && (
                    <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900">
                      <FaEnvelope className="text-slate-400" />
                      <a href={`mailto:${broker.Email}`} className="hover:underline">
                        {broker.Email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Contact CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-center">
              {phoneNumber ? (
                <>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
                  >
                    <FaPhoneAlt className="text-xs" />
                    <span>Gọi {phoneNumber}</span>
                  </a>

                  <a
                    href={`https://zalo.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0068ff] hover:bg-[#0055d4] text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
                  >
                    <FaComments />
                    <span>Chat Zalo</span>
                  </a>
                </>
              ) : (
                <button
                  onClick={() => showToast("Môi giới chưa cập nhật số điện thoại công khai.")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 text-slate-500 font-semibold text-sm cursor-not-allowed"
                >
                  <FaPhoneAlt className="text-xs" />
                  <span>Chưa có SĐT</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
                title="Đánh giá chất lượng dịch vụ của nhà môi giới"
              >
                <FaStar className="text-xs" />
                <span>Đánh giá môi giới</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
                title="Chia sẻ hồ sơ môi giới"
              >
                <FaShareAlt className="text-xs text-slate-500" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 REPUTATION METRICS (Clean corporate row) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 text-lg">
              <FaHome />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Tin đang đăng</div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                {properties.length} <span className="text-xs font-normal text-slate-500">bất động sản</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-lg">
              <FaClock />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Kinh nghiệm</div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                {experienceYears}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${
                isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}
            >
              <FaShieldAlt />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Xác thực danh tính</div>
              <div className="text-sm font-bold text-slate-900">
                {isVerified ? "Đã đối soát CCCD" : "Đang cập nhật"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 text-lg">
              <FaStar />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Đánh giá uy tín</div>
              <div className="text-xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
                <span>{reviewsData.summary.avgRating}/5</span>
                <span className="text-xs font-normal text-slate-500">
                  ({reviewsData.summary.totalReviews} lượt)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT (8 Cols Main + 4 Cols Sticky Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* LEFT COLUMN: BIO & PROPERTIES (8 COLS) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Broker Bio Section */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-red-600 rounded-full inline-block" />
                Giới thiệu về nhà môi giới
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                {broker.MoTaBanThan ? (
                  <p className="whitespace-pre-line">{broker.MoTaBanThan}</p>
                ) : (
                  <>
                    <p>
                      Xin chào quý khách! Tôi là <strong>{displayName}</strong>, chuyên viên tư vấn
                      và phân phối bất động sản tại hệ thống <strong>Bất Động Sản 3MAN</strong>.
                    </p>
                    <p>
                      Với phương châm làm việc <em>"Tận tâm - Minh bạch - Pháp lý an toàn"</em>, tôi
                      cam kết mang đến cho quý khách hàng các sản phẩm nhà đất, căn hộ, mặt bằng có
                      pháp lý chuẩn quy hoạch, giá tốt nhất và hỗ trợ thủ tục công chứng, sang tên trọn gói.
                    </p>
                  </>
                )}
              </div>

              {/* Value Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
                  <span>100% Nhà đất đúng thực tế</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <FaShieldAlt className="text-blue-600 flex-shrink-0" />
                  <span>Hỗ trợ pháp lý & quy hoạch</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <FaAward className="text-amber-500 flex-shrink-0" />
                  <span>Thương lượng giá trực tiếp</span>
                </div>
              </div>
            </div>

            {/* Properties Listings Section */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-red-600 rounded-full inline-block" />
                    Danh sách bất động sản đang phân phối
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Hiện có {filteredProperties.length} / {properties.length} tin đăng đang hiển thị
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      activeTab === "all"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tất cả ({properties.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("ban")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      activeTab === "ban"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Nhà đất bán
                  </button>
                  <button
                    onClick={() => setActiveTab("thue")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      activeTab === "thue"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Cho thuê
                  </button>
                </div>
              </div>

              {/* Search & Sort Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="relative w-full sm:w-72">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Tìm theo tiêu đề, địa chỉ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
                  <span className="text-slate-500">Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs cursor-pointer"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá tăng dần</option>
                    <option value="price-desc">Giá giảm dần</option>
                    <option value="area-desc">Diện tích lớn nhất</option>
                  </select>
                </div>
              </div>

              {/* Properties Grid */}
              <div className="mt-6">
                {filteredProperties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {filteredProperties.map((property) => {
                      const firstImg =
                        property.HinhAnh && property.HinhAnh.length > 0
                          ? property.HinhAnh[0]
                          : null;
                      const imageUrl = firstImg
                        ? `${SERVER_URL}${firstImg}`
                        : "/placeholder.svg?height=220&width=360";

                      const isRent =
                        property.TrangThai === "cho thuê" ||
                        (property.TieuDe && property.TieuDe.toLowerCase().includes("thuê")) ||
                        Boolean(property.ThoiHanThue);

                      return (
                        <div
                          key={property.MaTTND}
                          className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
                        >
                          {/* Photo Frame */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                            <img
                              src={imageUrl}
                              alt={property.TieuDe || "Bất động sản"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder.svg?height=220&width=360";
                              }}
                            />
                            {/* Badges */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider text-white shadow-sm ${
                                  isRent ? "bg-emerald-600" : "bg-blue-600"
                                }`}
                              >
                                {isRent ? "Cho thuê" : "Đang bán"}
                              </span>
                              {property.TrangThaiXacThuc === "đã xác thực" && (
                                <span className="bg-slate-900/80 backdrop-blur-sm text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                                  <FaCheckCircle className="text-[10px]" /> Đã xác thực
                                </span>
                              )}
                            </div>

                            {/* Image count pill */}
                            {property.HinhAnh && property.HinhAnh.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-sm">
                                📷 {property.HinhAnh.length} ảnh
                              </div>
                            )}
                          </div>

                          {/* Body Content */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <Link
                                to={`/bat-dong-san/${property.MaTTND}`}
                                className="block font-bold text-slate-900 hover:text-red-600 transition-colors line-clamp-2 text-sm leading-snug mb-2 group-hover:underline"
                                title={property.TieuDe}
                              >
                                {property.TieuDe || "Bất động sản chưa đặt tên"}
                              </Link>

                              {/* Price & Area Highlight */}
                              <div className="flex items-baseline gap-3 mb-2.5">
                                <span className="text-red-600 font-extrabold text-base tracking-tight">
                                  {formatPrice(property.Gia)}
                                </span>
                                {property.DienTich && (
                                  <span className="text-xs text-slate-500 font-medium">
                                    &bull; {Number(property.DienTich).toFixed(0)} m²
                                  </span>
                                )}
                              </div>

                              {/* Address */}
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 truncate">
                                <FaMapMarkerAlt className="text-slate-400 flex-shrink-0 text-[11px]" />
                                <span className="truncate">
                                  {property.DiaChi || "TP. Hồ Chí Minh"}
                                </span>
                              </div>
                            </div>

                            {/* Card Footer: Metrics & Link */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3 text-slate-500">
                                {property.SoPhongNgu > 0 && (
                                  <span className="flex items-center gap-1" title="Phòng ngủ">
                                    <FaBed className="text-slate-400" />
                                    {property.SoPhongNgu}
                                  </span>
                                )}
                                {property.SoPhongTam > 0 && (
                                  <span className="flex items-center gap-1" title="Phòng tắm">
                                    <FaBath className="text-slate-400" />
                                    {property.SoPhongTam}
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400">
                                  {formatDate(property.NgayTao)}
                                </span>
                              </div>

                              <Link
                                to={`/bat-dong-san/${property.MaTTND}`}
                                className="text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                              >
                                Chi tiết
                                <FaAngleRight className="text-[10px]" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-sm">
                      <FaHome className="text-xl" />
                    </div>
                    <p className="text-slate-700 font-semibold text-sm mb-1">
                      Không tìm thấy bất động sản phù hợp
                    </p>
                    <p className="text-slate-500 text-xs">
                      Vui lòng thử tìm kiếm bằng từ khóa khác hoặc chuyển danh mục.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ĐÁNH GIÁ & NHẬN XÉT MÔI GIỚI (REVIEWS & RATINGS) */}
            <div id="danh-gia" className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                    Đánh giá &amp; Nhận xét về môi giới
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thông tin đánh giá khách quan từ khách hàng đã liên hệ hoặc làm việc cùng
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
                >
                  <FaStar className="text-xs" />
                  <span>Viết đánh giá môi giới</span>
                </button>
              </div>

              {/* Hộp Thống kê Đánh giá (Score Box + Star Distribution) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200/80 items-center">
                {/* Score Summary */}
                <div className="md:col-span-4 text-center md:border-r border-slate-200 md:pr-4">
                  <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {reviewsData.summary.avgRating}
                    <span className="text-base text-slate-400 font-normal"> / 5</span>
                  </div>
                  <div className="flex justify-center my-2">
                    {renderStars(reviewsData.summary.avgRating)}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    ({reviewsData.summary.totalReviews} đánh giá)
                  </div>

                  {/* Highlights (Đúng theo mẫu ví dụ của yêu cầu) */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-left text-[11px] text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-amber-500 font-bold">★★★★★</span>
                      <span>Rất hài lòng</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-amber-500 font-bold">★★★★☆</span>
                      <span>Tư vấn nhanh chóng</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-amber-500 font-bold">★★★★★</span>
                      <span>Hỗ trợ nhiệt tình</span>
                    </div>
                  </div>
                </div>

                {/* Star Distribution Progress Bars */}
                <div className="md:col-span-8 space-y-2 text-xs">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const count = reviewsData.summary.distribution[s] || 0;
                    const pct = reviewsData.summary.percentages[s] || 0;
                    return (
                      <div
                        key={s}
                        onClick={() => setSelectedStarFilter(selectedStarFilter === String(s) ? "all" : String(s))}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <span className="w-12 text-slate-600 font-semibold group-hover:text-amber-600 flex items-center gap-1">
                          <span>{s}</span>
                          <FaStar className="text-amber-400 text-[10px]" />
                        </span>
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-slate-500 text-[11px]">
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Star Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1">Lọc theo:</span>
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "5", label: "5 sao (Rất hài lòng)" },
                  { key: "4", label: "4 sao (Hài lòng)" },
                  { key: "3", label: "3 sao (Bình thường)" },
                  { key: "2", label: "2 sao (Chưa hài lòng)" },
                  { key: "1", label: "1 sao (Không hài lòng)" },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setSelectedStarFilter(pill.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedStarFilter === pill.key
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Danh sách các nhận xét đánh giá */}
              <div className="space-y-3 pt-2">
                {loadingReviews ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải đánh giá...
                  </div>
                ) : reviewsData.items && reviewsData.items.length > 0 ? (
                  reviewsData.items.map((rev) => {
                    const isOwn = currentUser && String(currentUser.MaNgDung) === String(rev.MaKhachHang);
                    return (
                      <div
                        key={rev.MaDG}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {rev.AvatarKhachHang ? (
                              <img
                                src={rev.AvatarKhachHang.startsWith("http") ? rev.AvatarKhachHang : `${SERVER_URL}${rev.AvatarKhachHang}`}
                                alt={rev.TenKhachHang}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                  e.target.src = "/placeholder.svg?height=40&width=40";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                                {(rev.TenKhachHang || "KH").slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{rev.TenKhachHang || "Khách hàng ẩn danh"}</span>
                                {isOwn && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                    Đánh giá của bạn
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar
                                      key={i}
                                      className={i < rev.SoSao ? "text-amber-400" : "text-slate-200"}
                                      size={11}
                                    />
                                  ))}
                                </div>
                                <span>&bull;</span>
                                <span>{formatDate(rev.NgayTao)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Thao tác xóa nếu là chủ bài đánh giá */}
                          {isOwn && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setShowReviewModal(true)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs transition-colors"
                                title="Chỉnh sửa đánh giá"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rev.MaDG)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors"
                                title="Xóa đánh giá"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          )}
                        </div>

                        {rev.TieuDe && (
                          <div className="font-bold text-xs text-slate-800">
                            {rev.TieuDe}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-0.5">
                          "{rev.NoiDung}"
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto text-amber-400 text-lg shadow-xs">
                      <FaStar />
                    </div>
                    <div className="font-semibold text-slate-700">Chưa có đánh giá nào</div>
                    <p className="text-slate-500 max-w-sm mx-auto text-[11px]">
                      Chưa có nhận xét nào phù hợp với bộ lọc. Hãy liên hệ với môi giới và gửi đánh giá đầu tiên!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY INQUIRY & TRUST SIDEBAR (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Inquiry Form */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm sticky top-24">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                  {avatarUrl ? (
                    <img
                      src={`${SERVER_URL}${avatarUrl}`}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.svg?height=48&width=48";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-sm">
                      {displayName.slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-500">Tư vấn trực tiếp với</div>
                  <div className="text-sm font-bold text-slate-900 truncate">{displayName}</div>
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang trực tuyến
                  </div>
                </div>
              </div>

              {/* Phone block */}
              {phoneNumber && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 text-center">
                  <div className="text-xs text-red-600 font-medium mb-1">Hotline tư vấn nhanh</div>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="text-lg font-extrabold text-red-700 tracking-wider hover:underline inline-flex items-center gap-2"
                  >
                    <FaPhoneAlt className="text-sm" />
                    {phoneNumber}
                  </a>
                </div>
              )}

              {/* Inquiry form */}
              <form onSubmit={handleInquirySubmit} className="mt-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800">
                  Gửi yêu cầu tư vấn nhà đất
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Họ và tên của bạn *"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="Số điện thoại liên hệ *"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder={`Tôi quan tâm đến bất động sản của bạn, vui lòng liên hệ tư vấn...`}
                    value={inquiryNote}
                    onChange={(e) => setInquiryNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={inquirySent}
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <FaPaperPlane className="text-[11px]" />
                  <span>{inquirySent ? "Đã gửi yêu cầu!" : "Gửi yêu cầu cho môi giới"}</span>
                </button>
              </form>

              {/* Safe Trading Notice */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
                <div className="flex items-start gap-2">
                  <FaShieldAlt className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Không chuyển khoản đặt cọc khi chưa kiểm tra sổ đỏ và gặp trực tiếp.</span>
                </div>
                <div className="flex items-start gap-2">
                  <FaCheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Hỗ trợ kiểm tra quy hoạch và công chứng mua bán an toàn.</span>
                </div>
              </div>
            </div>

            {/* Operating Areas Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500 text-xs" />
                Khu vực môi giới hoạt động
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {["Quận Tân Phú", "Quận Bình Tân", "Quận Tân Bình", "Quận 12", "TP. Hồ Chí Minh"].map(
                  (area) => (
                    <span
                      key={area}
                      className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition-colors"
                    >
                      {area}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* ĐÁNH GIÁ & NHẬN XÉT MÔI GIỚI (REVIEWS & RATINGS) */}
            <div id="danh-gia" className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                    Đánh giá &amp; Nhận xét về môi giới
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thông tin đánh giá khách quan từ khách hàng đã liên hệ hoặc làm việc cùng
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
                >
                  <FaStar className="text-xs" />
                  <span>Viết đánh giá môi giới</span>
                </button>
              </div>

              {/* Hộp Thống kê Đánh giá (Score Box + Star Distribution) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200/80 items-center">
                {/* Score Summary */}
                <div className="md:col-span-4 text-center md:border-r border-slate-200 md:pr-4">
                  <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {reviewsData.summary.avgRating}
                    <span className="text-base text-slate-400 font-normal"> / 5</span>
                  </div>
                  <div className="flex justify-center my-2">
                    {renderStars(reviewsData.summary.avgRating)}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    ({reviewsData.summary.totalReviews} đánh giá)
                  </div>

                  {/* Highlights (Đúng theo mẫu ví dụ của yêu cầu) */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-left text-[11px] text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-amber-500 font-bold">★★★★★</span>
                      <span>Rất hài lòng</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-amber-500 font-bold">★★★★☆</span>
                      <span>Tư vấn nhanh chóng</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-amber-500 font-bold">★★★★★</span>
                      <span>Hỗ trợ nhiệt tình</span>
                    </div>
                  </div>
                </div>

                {/* Star Distribution Progress Bars */}
                <div className="md:col-span-8 space-y-2 text-xs">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const count = reviewsData.summary.distribution[s] || 0;
                    const pct = reviewsData.summary.percentages[s] || 0;
                    return (
                      <div
                        key={s}
                        onClick={() => setSelectedStarFilter(selectedStarFilter === String(s) ? "all" : String(s))}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <span className="w-12 text-slate-600 font-semibold group-hover:text-amber-600 flex items-center gap-1">
                          <span>{s}</span>
                          <FaStar className="text-amber-400 text-[10px]" />
                        </span>
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-slate-500 text-[11px]">
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Star Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1">Lọc theo:</span>
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "5", label: "5 sao (Rất hài lòng)" },
                  { key: "4", label: "4 sao (Hài lòng)" },
                  { key: "3", label: "3 sao (Bình thường)" },
                  { key: "2", label: "2 sao (Chưa hài lòng)" },
                  { key: "1", label: "1 sao (Không hài lòng)" },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setSelectedStarFilter(pill.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedStarFilter === pill.key
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Danh sách các nhận xét đánh giá */}
              <div className="space-y-3 pt-2">
                {loadingReviews ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải đánh giá...
                  </div>
                ) : reviewsData.items && reviewsData.items.length > 0 ? (
                  reviewsData.items.map((rev) => {
                    const isOwn = currentUser && String(currentUser.MaNgDung) === String(rev.MaKhachHang);
                    return (
                      <div
                        key={rev.MaDG}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {rev.AvatarKhachHang ? (
                              <img
                                src={rev.AvatarKhachHang.startsWith("http") ? rev.AvatarKhachHang : `${SERVER_URL}${rev.AvatarKhachHang}`}
                                alt={rev.TenKhachHang}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                  e.target.src = "/placeholder.svg?height=40&width=40";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                                {(rev.TenKhachHang || "KH").slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{rev.TenKhachHang || "Khách hàng ẩn danh"}</span>
                                {isOwn && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                    Đánh giá của bạn
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar
                                      key={i}
                                      className={i < rev.SoSao ? "text-amber-400" : "text-slate-200"}
                                      size={11}
                                    />
                                  ))}
                                </div>
                                <span>&bull;</span>
                                <span>{formatDate(rev.NgayTao)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Thao tác xóa nếu là chủ bài đánh giá */}
                          {isOwn && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setShowReviewModal(true)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs transition-colors"
                                title="Chỉnh sửa đánh giá"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rev.MaDG)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors"
                                title="Xóa đánh giá"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          )}
                        </div>

                        {rev.TieuDe && (
                          <div className="font-bold text-xs text-slate-800">
                            {rev.TieuDe}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-0.5">
                          "{rev.NoiDung}"
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto text-amber-400 text-lg shadow-xs">
                      <FaStar />
                    </div>
                    <div className="font-semibold text-slate-700">Chưa có đánh giá nào</div>
                    <p className="text-slate-500 max-w-sm mx-auto text-[11px]">
                      Chưa có nhận xét nào phù hợp với bộ lọc. Hãy liên hệ với môi giới và gửi đánh giá đầu tiên!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Chia sẻ hồ sơ môi giới</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4">
              Chia sẻ liên kết hồ sơ của <strong>{displayName}</strong> đến khách hàng hoặc đối tác:
            </p>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent px-2 text-xs text-slate-700 outline-none truncate"
              />
              <button
                onClick={copyProfileLink}
                className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FaCopy />
                <span>Sao chép</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {broker && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          broker={broker}
          onSuccess={() => {
            fetchReviews();
            showToast("Gửi đánh giá môi giới thành công!");
          }}
          onOpenContactModal={() => {
            const el = document.querySelector('form');
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
};

export default BrokerProfile;