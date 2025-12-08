"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  FaImages,
  FaNewspaper,
  FaInfoCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaEye,
  FaStar,
  FaExternalLinkAlt,
  FaBuilding,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaGlobe,
  FaFacebookSquare,
  FaUpload,
  FaSave,
  FaLayerGroup,
  FaBullhorn,
  FaFilter,
} from "react-icons/fa";
import { API_URL, SERVER_URL } from "../../services/api";

const NEWS_CATEGORIES = [
  "Kinh nghiệm mua bán",
  "Thị trường BĐS",
  "Thông tin quy hoạch",
  "Dự án nổi bật",
  "Phong thủy nhà đất",
  "Pháp lý BĐS",
];

const BANNER_POSITIONS = [
  { value: "trang_chu", label: "Trang chủ (Hero Slider)" },
  { value: "tim_kiem", label: "Trang tìm kiếm BĐS" },
  { value: "chi_tiet", label: "Trang chi tiết BĐS" },
  { value: "sidebar", label: "Cột bên (Sidebar / Bản đồ)" },
];

const ContentManager = () => {
  // Active Tab: 'banners' | 'news' | 'about'
  const [activeTab, setActiveTab] = useState("banners");

  // Loading & Toast
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Stats
  const [stats, setStats] = useState({
    banners: { total: 0, active: 0, hidden: 0 },
    news: { total: 0, published: 0, draft: 0, hidden: 0, totalViews: 0 },
    about: { lastUpdated: null },
  });

  // Data lists
  const [banners, setBanners] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [aboutData, setAboutData] = useState({
    TieuDe: "",
    Slogan: "",
    GioiThieu: "",
    TamNhin: "",
    SuMenh: "",
    GiaTriCotLoi: "",
    HinhAnh: "",
    TenDoanhNghiep: "",
    DiaChi: "",
    SoDienThoai: "",
    Hotline: "",
    Email: "",
    GioLamViec: "",
    Website: "",
    Fanpage: "",
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Modal States
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    TenBanner: "",
    HinhAnh: "",
    ViTri: "trang_chu",
    LienKet: "",
    ThuTu: 0,
    TrangThai: "hiển thị",
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsForm, setNewsForm] = useState({
    TieuDe: "",
    Slug: "",
    HinhAnh: "",
    TomTat: "",
    NoiDung: "",
    DanhMuc: "Kinh nghiệm mua bán",
    TacGia: "Ban Biên Tập 3MAN",
    TrangThai: "xuất bản",
    NoiBat: false,
  });
  const [newsFile, setNewsFile] = useState(null);
  const [newsPreview, setNewsPreview] = useState("");

  const [aboutFile, setAboutFile] = useState(null);
  const [aboutPreview, setAboutPreview] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: "", // 'banner' | 'news'
    id: null,
    title: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/content/stats`, {
        headers: getAuthHeaders(),
      });
      setStats(res.data);
    } catch (err) {
      console.warn("Lỗi tải stats:", err.message);
    }
  }, []);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/content/banners?admin=true`, {
        headers: getAuthHeaders(),
      });
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast("Không thể tải danh sách banner", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/content/news?admin=true&limit=100`, {
        headers: getAuthHeaders(),
      });
      setNewsList(res.data?.items || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      showToast("Không thể tải danh sách bài viết", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAbout = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/content/about`);
      if (res.data) {
        setAboutData(res.data);
        if (res.data.HinhAnh) {
          setAboutPreview(
            res.data.HinhAnh.startsWith("http")
              ? res.data.HinhAnh
              : `${SERVER_URL}${res.data.HinhAnh}`
          );
        }
      }
    } catch (err) {
      showToast("Không thể tải thông tin trang giới thiệu", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (activeTab === "banners") fetchBanners();
    else if (activeTab === "news") fetchNews();
    else if (activeTab === "about") fetchAbout();
  }, [activeTab, fetchStats, fetchBanners, fetchNews, fetchAbout]);

  // ==========================================
  // BANNER HANDLERS
  // ==========================================
  const handleOpenBannerModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        TenBanner: banner.TenBanner || "",
        HinhAnh: banner.HinhAnh || "",
        ViTri: banner.ViTri || "trang_chu",
        LienKet: banner.LienKet || "",
        ThuTu: banner.ThuTu || 0,
        TrangThai: banner.TrangThai || "hiển thị",
      });
      setBannerPreview(
        banner.HinhAnh?.startsWith("http")
          ? banner.HinhAnh
          : `${SERVER_URL}${banner.HinhAnh}`
      );
    } else {
      setEditingBanner(null);
      setBannerForm({
        TenBanner: "",
        HinhAnh: "",
        ViTri: "trang_chu",
        LienKet: "",
        ThuTu: banners.length + 1,
        TrangThai: "hiển thị",
      });
      setBannerPreview("");
    }
    setBannerFile(null);
    setIsBannerModalOpen(true);
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!bannerForm.TenBanner.trim()) {
      showToast("Vui lòng nhập tên banner!", "error");
      return;
    }
    if (!bannerFile && !bannerForm.HinhAnh) {
      showToast("Vui lòng chọn ảnh tải lên hoặc nhập link ảnh!", "error");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("TenBanner", bannerForm.TenBanner);
      formData.append("ViTri", bannerForm.ViTri);
      formData.append("LienKet", bannerForm.LienKet || "");
      formData.append("ThuTu", bannerForm.ThuTu);
      formData.append("TrangThai", bannerForm.TrangThai);

      if (bannerFile) {
        formData.append("HinhAnh", bannerFile);
      } else {
        formData.append("HinhAnh", bannerForm.HinhAnh);
      }

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      };

      if (editingBanner) {
        await axios.put(
          `${API_URL}/content/banners/${editingBanner.MaBanner}`,
          formData,
          { headers }
        );
        showToast("Cập nhật banner thành công!");
      } else {
        await axios.post(`${API_URL}/content/banners`, formData, { headers });
        showToast("Thêm banner mới thành công!");
      }

      setIsBannerModalOpen(false);
      fetchBanners();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu banner", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBannerStatus = async (banner) => {
    try {
      await axios.patch(
        `${API_URL}/content/banners/${banner.MaBanner}/status`,
        {},
        { headers: getAuthHeaders() }
      );
      showToast(
        `Đã chuyển trạng thái banner thành ${
          banner.TrangThai === "hiển thị" ? "ẨN" : "HIỂN THỊ"
        }`
      );
      fetchBanners();
      fetchStats();
    } catch (err) {
      showToast("Không thể đổi trạng thái banner", "error");
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteConfirm.id) return;
    try {
      await axios.delete(`${API_URL}/content/banners/${deleteConfirm.id}`, {
        headers: getAuthHeaders(),
      });
      showToast("Đã xóa banner thành công!");
      setDeleteConfirm({ isOpen: false, type: "", id: null, title: "" });
      fetchBanners();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi xóa banner", "error");
    }
  };

  // ==========================================
  // NEWS HANDLERS
  // ==========================================
  const handleOpenNewsModal = (article = null) => {
    if (article) {
      setEditingNews(article);
      setNewsForm({
        TieuDe: article.TieuDe || "",
        Slug: article.Slug || "",
        HinhAnh: article.HinhAnh || "",
        TomTat: article.TomTat || "",
        NoiDung: article.NoiDung || "",
        DanhMuc: article.DanhMuc || "Kinh nghiệm mua bán",
        TacGia: article.TacGia || "Ban Biên Tập 3MAN",
        TrangThai: article.TrangThai || "xuất bản",
        NoiBat: Boolean(article.NoiBat),
      });
      setNewsPreview(
        article.HinhAnh?.startsWith("http")
          ? article.HinhAnh
          : `${SERVER_URL}${article.HinhAnh}`
      );
    } else {
      setEditingNews(null);
      setNewsForm({
        TieuDe: "",
        Slug: "",
        HinhAnh: "",
        TomTat: "",
        NoiDung: "",
        DanhMuc: "Kinh nghiệm mua bán",
        TacGia: "Ban Biên Tập 3MAN",
        TrangThai: "xuất bản",
        NoiBat: false,
      });
      setNewsPreview("");
    }
    setNewsFile(null);
    setIsNewsModalOpen(true);
  };

  const handleNewsFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewsFile(file);
      setNewsPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveNews = async (e) => {
    e.preventDefault();
    if (!newsForm.TieuDe.trim()) {
      showToast("Vui lòng nhập tiêu đề bài viết!", "error");
      return;
    }
    if (!newsForm.NoiDung.trim()) {
      showToast("Vui lòng nhập nội dung chi tiết bài viết!", "error");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("TieuDe", newsForm.TieuDe);
      formData.append("Slug", newsForm.Slug);
      formData.append("TomTat", newsForm.TomTat || "");
      formData.append("NoiDung", newsForm.NoiDung);
      formData.append("DanhMuc", newsForm.DanhMuc);
      formData.append("TacGia", newsForm.TacGia);
      formData.append("TrangThai", newsForm.TrangThai);
      formData.append("NoiBat", newsForm.NoiBat ? 1 : 0);

      if (newsFile) {
        formData.append("HinhAnh", newsFile);
      } else {
        formData.append("HinhAnh", newsForm.HinhAnh);
      }

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      };

      if (editingNews) {
        await axios.put(
          `${API_URL}/content/news/${editingNews.MaTinTuc}`,
          formData,
          { headers }
        );
        showToast("Cập nhật bài viết thành công!");
      } else {
        await axios.post(`${API_URL}/content/news`, formData, { headers });
        showToast("Thêm bài viết mới thành công!");
      }

      setIsNewsModalOpen(false);
      fetchNews();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu bài viết", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNewsStatus = async (article) => {
    try {
      await axios.patch(
        `${API_URL}/content/news/${article.MaTinTuc}/status`,
        {},
        { headers: getAuthHeaders() }
      );
      showToast(
        `Đã chuyển trạng thái bài viết thành ${
          article.TrangThai === "xuất bản" ? "ẨN" : "XUẤT BẢN"
        }`
      );
      fetchNews();
      fetchStats();
    } catch (err) {
      showToast("Không thể đổi trạng thái bài viết", "error");
    }
  };

  const handleDeleteNews = async () => {
    if (!deleteConfirm.id) return;
    try {
      await axios.delete(`${API_URL}/content/news/${deleteConfirm.id}`, {
        headers: getAuthHeaders(),
      });
      showToast("Đã xóa bài viết thành công!");
      setDeleteConfirm({ isOpen: false, type: "", id: null, title: "" });
      fetchNews();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi xóa bài viết", "error");
    }
  };

  // ==========================================
  // ABOUT PAGE HANDLERS
  // ==========================================
  const handleAboutFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAboutFile(file);
      setAboutPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveAbout = async (e) => {
    e.preventDefault();
    try {
      setSavingAbout(true);
      const formData = new FormData();
      Object.keys(aboutData).forEach((key) => {
        if (key !== "HinhAnh") {
          formData.append(key, aboutData[key] || "");
        }
      });

      if (aboutFile) {
        formData.append("HinhAnh", aboutFile);
      } else {
        formData.append("HinhAnh", aboutData.HinhAnh || "");
      }

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      };

      await axios.put(`${API_URL}/content/about`, formData, { headers });
      showToast("Đã lưu thông tin trang giới thiệu và liên hệ thành công!");
      fetchAbout();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu thông tin trang giới thiệu", "error");
    } finally {
      setSavingAbout(false);
    }
  };

  // ==========================================
  // FILTERED LISTS
  // ==========================================
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      const matchSearch =
        !searchTerm ||
        b.TenBanner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.LienKet && b.LienKet.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchPos =
        filterPosition === "all" || b.ViTri === filterPosition;
      const matchStatus =
        filterStatus === "all" || b.TrangThai === filterStatus;
      return matchSearch && matchPos && matchStatus;
    });
  }, [banners, searchTerm, filterPosition, filterStatus]);

  const filteredNews = useMemo(() => {
    return newsList.filter((n) => {
      const matchSearch =
        !searchTerm ||
        n.TieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.TacGia && n.TacGia.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat =
        filterCategory === "all" || n.DanhMuc === filterCategory;
      const matchStatus =
        filterStatus === "all" || n.TrangThai === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [newsList, searchTerm, filterCategory, filterStatus]);

  const renderImageUrl = (url) => {
    if (!url) return "/placeholder.svg?height=100&width=160";
    if (url.startsWith("http")) return url;
    return `${SERVER_URL}${url}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
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

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">
              <FaBullhorn />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản lý nội dung hệ thống
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị banner quảng cáo, tin tức thị trường BĐS và thông tin trang giới thiệu - liên hệ
          </p>
        </div>

        {/* Action Button depending on Tab */}
        <div className="flex items-center gap-2">
          {activeTab === "banners" && (
            <button
              onClick={() => handleOpenBannerModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <FaPlus /> Thêm banner mới
            </button>
          )}
          {activeTab === "news" && (
            <button
              onClick={() => handleOpenNewsModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <FaPlus /> Đăng bài viết mới
            </button>
          )}
          {activeTab === "about" && (
            <button
              onClick={handleSaveAbout}
              disabled={savingAbout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <FaSave /> {savingAbout ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0">
            <FaImages />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Banner quảng cáo</div>
            <div className="text-lg font-bold text-slate-900">
              {stats.banners.active}{" "}
              <span className="text-xs font-normal text-slate-400">
                / {stats.banners.total} đang chạy
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg flex-shrink-0">
            <FaNewspaper />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Bài viết xuất bản</div>
            <div className="text-lg font-bold text-slate-900">
              {stats.news.published}{" "}
              <span className="text-xs font-normal text-slate-400">
                / {stats.news.total} bài
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg flex-shrink-0">
            <FaEye />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Lượt đọc bài viết</div>
            <div className="text-lg font-bold text-slate-900">
              {Number(stats.news.totalViews || 0).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
            <FaBuilding />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Trang giới thiệu</div>
            <div className="text-xs font-semibold text-slate-900 truncate">
              {stats.about.lastUpdated
                ? new Date(stats.about.lastUpdated).toLocaleDateString("vi-VN")
                : "Đã thiết lập"}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Hoạt động bình thường</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => {
            setActiveTab("banners");
            setSearchTerm("");
            setFilterStatus("all");
          }}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "banners"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FaImages />
          <span>1. Quản lý Banner ({banners.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("news");
            setSearchTerm("");
            setFilterStatus("all");
          }}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "news"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FaNewspaper />
          <span>2. Quản lý Tin tức ({newsList.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("about");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "about"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FaInfoCircle />
          <span>3. Quản lý Trang giới thiệu & Liên hệ</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: QUẢN LÝ BANNER
      ======================================================== */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-b-xl -mt-6 border-x border-b border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Tìm tên banner, liên kết đích..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả vị trí hiển thị</option>
                {BANNER_POSITIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="hiển thị">Đang hiển thị</option>
                <option value="ẩn">Đang ẩn</option>
              </select>
            </div>
          </div>

          {/* Banner Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-44">Hình ảnh</th>
                    <th className="py-3 px-4">Tên banner & Vị trí</th>
                    <th className="py-3 px-4">Liên kết đích</th>
                    <th className="py-3 px-4 text-center w-20">Thứ tự</th>
                    <th className="py-3 px-4 text-center w-32">Trạng thái</th>
                    <th className="py-3 px-4 text-right w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredBanners.length > 0 ? (
                    filteredBanners.map((banner, index) => {
                      const posObj = BANNER_POSITIONS.find((p) => p.value === banner.ViTri);
                      return (
                        <tr key={banner.MaBanner} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-36 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative group">
                              <img
                                src={renderImageUrl(banner.HinhAnh)}
                                alt={banner.TenBanner}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.svg?height=80&width=140";
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm mb-1">
                              {banner.TenBanner}
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {posObj?.label || banner.ViTri}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Ngày tạo: {new Date(banner.NgayTao).toLocaleDateString("vi-VN")}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {banner.LienKet ? (
                              <a
                                href={banner.LienKet}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline max-w-[200px] truncate"
                              >
                                <span className="truncate">{banner.LienKet}</span>
                                <FaExternalLinkAlt className="text-[10px] flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Không có liên kết</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {banner.ThuTu}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleBannerStatus(banner)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                                banner.TrangThai === "hiển thị"
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                              }`}
                              title="Nhấn để đổi trạng thái"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  banner.TrangThai === "hiển thị"
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span>{banner.TrangThai === "hiển thị" ? "Hiển thị" : "Ẩn"}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenBannerModal(banner)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Chỉnh sửa banner"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: "banner",
                                    id: banner.MaBanner,
                                    title: banner.TenBanner,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa banner"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <FaImages className="text-3xl mx-auto mb-2 text-slate-300" />
                        <p>Không có banner quảng cáo nào phù hợp điều kiện lọc.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: QUẢN LÝ TIN TỨC
      ======================================================== */}
      {activeTab === "news" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-b-xl -mt-6 border-x border-b border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Tìm bài viết theo tiêu đề, tác giả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả chuyên mục</option>
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="xuất bản">Đã xuất bản</option>
                <option value="nháp">Bản nháp</option>
                <option value="ẩn">Đang ẩn</option>
              </select>
            </div>
          </div>

          {/* News Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-32">Ảnh bìa</th>
                    <th className="py-3 px-4">Tiêu đề bài viết & Chuyên mục</th>
                    <th className="py-3 px-4 w-36">Tác giả</th>
                    <th className="py-3 px-4 text-center w-24">Lượt xem</th>
                    <th className="py-3 px-4 text-center w-28">Trạng thái</th>
                    <th className="py-3 px-4 text-right w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredNews.length > 0 ? (
                    filteredNews.map((article, index) => (
                      <tr key={article.MaTinTuc} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-medium text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                            <img
                              src={renderImageUrl(article.HinhAnh)}
                              alt={article.TieuDe}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder.svg?height=64&width=96";
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            {Boolean(article.NoiBat) && (
                              <span
                                className="text-amber-500 text-xs flex-shrink-0"
                                title="Bài viết nổi bật trên trang chủ"
                              >
                                <FaStar />
                              </span>
                            )}
                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-blue-600 transition-colors">
                              {article.TieuDe}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                              {article.DanhMuc}
                            </span>
                            <span>&bull;</span>
                            <span>{new Date(article.NgayDang).toLocaleDateString("vi-VN")}</span>
                            <span>&bull;</span>
                            <span className="text-slate-400">Slug: {article.Slug}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {article.TacGia || "Ban Biên Tập"}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          <div className="inline-flex items-center gap-1">
                            <FaEye className="text-slate-400 text-[10px]" />
                            <span>{article.LuotXem || 0}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleNewsStatus(article)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                              article.TrangThai === "xuất bản"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                : article.TrangThai === "nháp"
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                            }`}
                            title="Nhấn để đổi trạng thái"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                article.TrangThai === "xuất bản"
                                  ? "bg-emerald-500"
                                  : article.TrangThai === "nháp"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            <span>
                              {article.TrangThai === "xuất bản"
                                ? "Xuất bản"
                                : article.TrangThai === "nháp"
                                ? "Bản nháp"
                                : "Ẩn"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenNewsModal(article)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chỉnh sửa bài viết"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: "news",
                                  id: article.MaTinTuc,
                                  title: article.TieuDe,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Xóa bài viết"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <FaNewspaper className="text-3xl mx-auto mb-2 text-slate-300" />
                        <p>Không có bài viết tin tức nào phù hợp.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: QUẢN LÝ TRANG GIỚI THIỆU & LIÊN HỆ
      ======================================================== */}
      {activeTab === "about" && (
        <form onSubmit={handleSaveAbout} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CỘT TRÁI: THÔNG TIN DOANH NGHIỆP & BÀI GIỚI THIỆU (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Nhận diện & Tiêu đề */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FaBuilding className="text-blue-600" />
                  1. Thông tin Định danh & Giới thiệu Doanh nghiệp
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên công ty / Doanh nghiệp vận hành *
                    </label>
                    <input
                      type="text"
                      required
                      value={aboutData.TenDoanhNghiep || ""}
                      onChange={(e) =>
                        setAboutData({ ...aboutData, TenDoanhNghiep: e.target.value })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="CÔNG TY CỔ PHẦN..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tiêu đề trang giới thiệu *
                    </label>
                    <input
                      type="text"
                      required
                      value={aboutData.TieuDe || ""}
                      onChange={(e) =>
                        setAboutData({ ...aboutData, TieuDe: e.target.value })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="Về Bất Động Sản 3MAN..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slogan / Tôn chỉ hoạt động
                  </label>
                  <input
                    type="text"
                    value={aboutData.Slogan || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, Slogan: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    placeholder="Kiến tạo giá trị vững bền..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nội dung giới thiệu công ty chi tiết
                  </label>
                  <textarea
                    rows={5}
                    value={aboutData.GioiThieu || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, GioiThieu: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
                    placeholder="Giới thiệu lịch sử hình thành, quy mô hoạt động, năng lực sàn giao dịch..."
                  />
                </div>
              </div>

              {/* Card 2: Tầm nhìn - Sứ mệnh - Giá trị cốt lõi */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FaStar className="text-amber-500" />
                  2. Tầm nhìn - Sứ mệnh - Giá trị cốt lõi
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tầm nhìn (Vision)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutData.TamNhin || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, TamNhin: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    placeholder="Trở thành hệ sinh thái công nghệ bất động sản..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sứ mệnh (Mission)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutData.SuMenh || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, SuMenh: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    placeholder="Minh bạch hóa thị trường BĐS, bảo vệ quyền lợi người mua..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá trị cốt lõi (Core Values)
                  </label>
                  <input
                    type="text"
                    value={aboutData.GiaTriCotLoi || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, GiaTriCotLoi: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    placeholder="Minh Bạch - Tận Tâm - Công Nghệ Tiên Phong..."
                  />
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: ẢNH ĐẠI DIỆN & LIÊN HỆ (4 COLS) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Ảnh trụ sở / Banner giới thiệu */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hình ảnh trụ sở / Banner
                </h3>

                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  {aboutPreview ? (
                    <img
                      src={aboutPreview}
                      alt="Trụ sở giới thiệu"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <FaBuilding className="text-2xl mb-1" />
                      <span className="text-[11px]">Chưa có hình ảnh</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                    <FaUpload /> Chọn ảnh từ máy tính
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAboutFileChange}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Hoặc dán URL ảnh trực tiếp..."
                    value={aboutData.HinhAnh || ""}
                    onChange={(e) => {
                      setAboutData({ ...aboutData, HinhAnh: e.target.value });
                      setAboutPreview(e.target.value);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Thông tin liên hệ */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <FaPhoneAlt className="text-emerald-600" />
                  3. Thông tin Liên hệ & Hỗ trợ
                </h3>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Địa chỉ trụ sở
                  </label>
                  <input
                    type="text"
                    value={aboutData.DiaChi || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, DiaChi: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Số nhà, đường, quận, thành phố..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Hotline
                    </label>
                    <input
                      type="text"
                      value={aboutData.Hotline || ""}
                      onChange={(e) =>
                        setAboutData({ ...aboutData, Hotline: e.target.value })
                      }
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1900..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={aboutData.SoDienThoai || ""}
                      onChange={(e) =>
                        setAboutData({ ...aboutData, SoDienThoai: e.target.value })
                      }
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="09..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email hỗ trợ
                  </label>
                  <input
                    type="email"
                    value={aboutData.Email || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, Email: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="support@..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Giờ làm việc
                  </label>
                  <input
                    type="text"
                    value={aboutData.GioLamViec || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, GioLamViec: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Thứ 2 - Thứ 7: 08:00 - 18:00"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fanpage Facebook
                  </label>
                  <input
                    type="text"
                    value={aboutData.Fanpage || ""}
                    onChange={(e) =>
                      setAboutData({ ...aboutData, Fanpage: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingAbout}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <FaSave /> {savingAbout ? "Đang lưu..." : "Lưu toàn bộ thay đổi"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================
          MODAL: THÊM / CHỈNH SỬA BANNER
      ======================================================== */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingBanner ? "Chỉnh sửa Banner quảng cáo" : "Thêm Banner quảng cáo mới"}
              </h3>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên banner / Chiến dịch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Dự án Vinhomes Grand Park"
                  value={bannerForm.TenBanner}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, TenBanner: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình ảnh banner *
                </label>
                {bannerPreview && (
                  <div className="w-full aspect-[21/9] rounded-lg overflow-hidden border border-slate-200 mb-2 bg-slate-100">
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                    <FaUpload /> Tải ảnh từ máy tính
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Hoặc dán URL ảnh trực tiếp..."
                    value={bannerForm.HinhAnh}
                    onChange={(e) => {
                      setBannerForm({ ...bannerForm, HinhAnh: e.target.value });
                      setBannerPreview(e.target.value);
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vị trí hiển thị
                  </label>
                  <select
                    value={bannerForm.ViTri}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, ViTri: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BANNER_POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bannerForm.ThuTu}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, ThuTu: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Liên kết đích khi click
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: /tim-kiem?q=Vinhomes hoặc link web..."
                  value={bannerForm.LienKet}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, LienKet: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={bannerForm.TrangThai}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, TrangThai: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hiển thị">Hiển thị ngay</option>
                  <option value="ẩn">Ẩn banner</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Đang lưu..." : editingBanner ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: THÊM / CHỈNH SỬA TIN TỨC
      ======================================================== */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleIn max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingNews ? "Chỉnh sửa bài viết tin tức" : "Đăng bài viết tin tức mới"}
              </h3>
              <button
                onClick={() => setIsNewsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNews} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề bài viết *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 5 kinh nghiệm mua căn hộ chung cư lần đầu"
                  value={newsForm.TieuDe}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, TieuDe: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chuyên mục
                  </label>
                  <select
                    value={newsForm.DanhMuc}
                    onChange={(e) =>
                      setNewsForm({ ...newsForm, DanhMuc: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NEWS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={newsForm.TacGia}
                    onChange={(e) =>
                      setNewsForm({ ...newsForm, TacGia: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ảnh đại diện bài viết
                </label>
                {newsPreview && (
                  <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 mb-2 bg-slate-100 max-h-44">
                    <img
                      src={newsPreview}
                      alt="News Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                    <FaUpload /> Chọn ảnh từ máy tính
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewsFileChange}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Hoặc dán URL ảnh trực tiếp..."
                    value={newsForm.HinhAnh}
                    onChange={(e) => {
                      setNewsForm({ ...newsForm, HinhAnh: e.target.value });
                      setNewsPreview(e.target.value);
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tóm tắt ngắn (Lead / Meta description chuẩn SEO)
                </label>
                <textarea
                  rows={2}
                  placeholder="Đoạn văn ngắn tóm tắt nội dung bài viết hiển thị ở danh sách ngoài trang chủ..."
                  value={newsForm.TomTat}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, TomTat: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung chi tiết bài viết *
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Nhập toàn văn nội dung bài viết..."
                  value={newsForm.NoiDung}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, NoiDung: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái hiển thị
                  </label>
                  <select
                    value={newsForm.TrangThai}
                    onChange={(e) =>
                      setNewsForm({ ...newsForm, TrangThai: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="xuất bản">Xuất bản ngay</option>
                    <option value="nháp">Lưu bản nháp</option>
                    <option value="ẩn">Ẩn bài viết</option>
                  </select>
                </div>

                <div className="pt-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newsForm.NoiBat}
                      onChange={(e) =>
                        setNewsForm({ ...newsForm, NoiBat: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span>⭐ Đánh dấu bài viết nổi bật</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Đang lưu..." : editingNews ? "Cập nhật bài viết" : "Đăng bài viết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
      ======================================================== */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl">
              <FaTrash />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Xác nhận xóa nội dung</h3>
            <p className="text-xs text-slate-600 mb-4">
              Bạn có chắc chắn muốn xóa{" "}
              {deleteConfirm.type === "banner" ? "banner" : "bài viết"}:{" "}
              <strong>"{deleteConfirm.title}"</strong> không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, type: "", id: null, title: "" })
                }
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "banner") handleDeleteBanner();
                  else handleDeleteNews();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
