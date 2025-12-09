"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaRulerCombined,
  FaEye,
  FaStar,
  FaBuilding,
  FaPhoneAlt,
  FaCalendarAlt,
  FaTag,
  FaArrowRight,
  FaTimes,
  FaCertificate,
  FaUsers,
  FaHandshake,
  FaCity,
  FaNewspaper,
} from "react-icons/fa";
import locationService from "../../services/locationService";
import { API_URL, SERVER_URL } from "../../services/api";

// Fallback banner slides nếu database chưa có hoặc đang tải
const DEFAULT_BANNERS = [
  {
    MaBanner: "b1",
    TenBanner: "SỞ HỮU NHÀ ĐẸP GIÁ TỐT HÔM NAY",
    MoTa: "Khám phá hơn 10.000+ bất động sản đã xác thực pháp lý minh bạch trên toàn quốc",
    HinhAnh: "/images/hero/BDS1.jpg",
    LienKet: "/tim-kiem?trangThai=đang+bán",
    NutCTA: "XEM NGAY",
  },
  {
    MaBanner: "b2",
    TenBanner: "ĐẠI ĐÔ THỊ VINHOMES GRAND PARK - CHUẨN SỐNG THƯỢNG LƯU",
    MoTa: "Không gian sống sinh thái thông minh 271ha cùng hệ sinh thái All-in-one hoàn hảo",
    HinhAnh: "/images/hero/BDS2.jpg",
    LienKet: "/tim-kiem?keyword=Vinhomes",
    NutCTA: "KHÁM PHÁ DỰ ÁN",
  },
  {
    MaBanner: "b3",
    TenBanner: "KÝ GỬI & MUA BÁN NHÀ ĐẤT NHANH CHÓNG TRONG 48H",
    MoTa: "Kết nối trực tiếp mạng lưới hơn 500+ chuyên viên môi giới chuyên nghiệp đã xác minh CCCD",
    HinhAnh: "/images/hero/BDS3.jpg",
    LienKet: "/dang-bai",
    NutCTA: "ĐĂNG TIN NGAY",
  },
];

// Dữ liệu danh mục khu vực trọng điểm
const REGION_CARDS = [
  {
    code: "79",
    name: "BẤT ĐỘNG SẢN TP.HCM",
    provinceName: "TP. Hồ Chí Minh",
    countText: "5.200+ tin đăng",
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80",
    description: "Trung tâm kinh tế sôi động, căn hộ cao cấp & nhà phố giá trị cao",
  },
  {
    code: "01",
    name: "BẤT ĐỘNG SẢN HÀ NỘI",
    provinceName: "Hà Nội",
    countText: "3.800+ tin đăng",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    description: "Thủ đô ngàn năm văn hiến, tiềm năng tăng giá bền vững",
  },
  {
    code: "48",
    name: "BẤT ĐỘNG SẢN ĐÀ NẴNG",
    provinceName: "Đà Nẵng",
    countText: "1.450+ tin đăng",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80",
    description: "Thành phố đáng sống, bất động sản nghỉ dưỡng & ven biển",
  },
  {
    code: "74",
    name: "BẤT ĐỘNG SẢN BÌNH DƯƠNG",
    provinceName: "Bình Dương",
    countText: "980+ tin đăng",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    description: "Thủ phủ công nghiệp, nhà ở chuyên gia & đất nền tiềm năng",
  },
];

const Home = () => {
  const navigate = useNavigate();

  // 1. Search Bar State
  const [searchData, setSearchData] = useState({
    keyword: "",
    loaiBDS: "",
    tinhThanh: "",
    quanHuyen: "",
    khoangGia: "",
    trangThai: "đang bán", // Mua bán vs Cho thuê
  });

  // 2. Data states
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [latestProperties, setLatestProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);

  // 3. UI states
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const bannerTimerRef = useRef(null);

  // Helper format giá
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "Thỏa thuận";
    const num = Number(price);
    if (num >= 1000000000) {
      const ty = (num / 1000000000).toFixed(1);
      return ty.endsWith(".0") ? `${parseInt(ty, 10)} tỷ` : `${ty} tỷ`;
    } else if (num >= 1000000) {
      const tr = (num / 1000000).toFixed(0);
      return `${tr} triệu`;
    }
    return `${num.toLocaleString("vi-VN")} đ`;
  };

  // Helper lấy URL ảnh bất động sản
  const getPropertyImageUrl = (property) => {
    if (property?.HinhAnh && property.HinhAnh.length > 0) {
      const img = property.HinhAnh[0];
      if (img.startsWith("http")) return img;
      return `${SERVER_URL}${img.startsWith("/") ? "" : "/"}${img}`;
    }
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";
  };

  // Helper lấy URL ảnh dự án
  const getProjectImageUrl = (project, index) => {
    if (project?.HinhAnh && project.HinhAnh.startsWith("http")) return project.HinhAnh;
    if (project?.HinhAnh) return `${SERVER_URL}${project.HinhAnh.startsWith("/") ? "" : "/"}${project.HinhAnh}`;
    const defaults = [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    ];
    return defaults[index % defaults.length];
  };

  // Helper lấy URL ảnh banner
  const getBannerImageUrl = (banner, index) => {
    if (!banner?.HinhAnh) {
      const defaults = ["/images/hero/BDS1.jpg", "/images/hero/BDS2.jpg", "/images/hero/BDS3.jpg"];
      return defaults[index % defaults.length];
    }
    if (banner.HinhAnh.startsWith("http") || banner.HinhAnh.startsWith("/images/")) {
      return banner.HinhAnh;
    }
    return `${SERVER_URL}${banner.HinhAnh.startsWith("/") ? "" : "/"}${banner.HinhAnh}`;
  };

  // ==========================================
  // FETCH DỮ LIỆU TỔNG QUAN
  // ==========================================

  // 1. Banners từ API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API_URL}/content/banners`);
        if (res.data && res.data.length > 0) {
          setBanners(res.data);
        }
      } catch (err) {
        console.warn("Dùng banner mặc định:", err.message);
      }
    };
    fetchBanners();
  }, []);

  // 2. Loại BĐS & Tỉnh thành
  useEffect(() => {
    const fetchInitFilters = async () => {
      try {
        const [typesRes, provincesData] = await Promise.all([
          axios.get(`${API_URL}/property-types`).catch(() => ({ data: [] })),
          locationService.getProvinces().catch(() => []),
        ]);
        setPropertyTypes(typesRes.data || []);
        setProvinces(provincesData || []);
      } catch (err) {
        console.error("Lỗi nạp bộ lọc:", err);
      }
    };
    fetchInitFilters();
  }, []);

  // 3. Quận/huyện khi chọn Tỉnh thành
  useEffect(() => {
    const fetchDistricts = async () => {
      if (searchData.tinhThanh) {
        try {
          const data = await locationService.getDistricts(searchData.tinhThanh);
          setDistricts(data || []);
        } catch (err) {
          setDistricts([]);
        }
      } else {
        setDistricts([]);
        setSearchData((prev) => ({ ...prev, quanHuyen: "" }));
      }
    };
    fetchDistricts();
  }, [searchData.tinhThanh]);

  // 4. Tin nổi bật (Featured Properties)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await axios.get(`${API_URL}/properties`, {
          params: { featured: true, limit: 8 },
        });
        const props = res.data?.properties || [];
        if (props.length >= 2) {
          setFeaturedProperties(props);
        } else {
          // Fallback lấy các tin có lượt xem cao
          const fallback = await axios.get(`${API_URL}/properties`, {
            params: { limit: 8, sort: "views-desc" },
          });
          setFeaturedProperties(fallback.data?.properties || []);
        }
      } catch (err) {
        console.error("Lỗi lấy tin nổi bật:", err);
      }
    };
    fetchFeatured();
  }, []);

  // 5. Bất động sản mới nhất (Latest Approved Properties)
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await axios.get(`${API_URL}/properties`, {
          params: { limit: 8, trangThaiDuyet: "APPROVED" },
        });
        setLatestProperties(res.data?.properties || []);
      } catch (err) {
        console.error("Lỗi lấy tin mới nhất:", err);
      }
    };
    fetchLatest();
  }, []);

  // 6. Dự án nổi bật từ Admin -> Quản lý dự án
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories/projects`);
        setProjects(res.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách dự án:", err);
      }
    };
    fetchProjects();
  }, []);

  // 7. Môi giới nổi bật / uy tín
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/verified-brokers`, {
          params: { limit: 8 },
        });
        setBrokers(res.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách môi giới:", err);
      }
    };
    fetchBrokers();
  }, []);

  // 8. Tin tức bất động sản từ Admin -> Quản lý tin tức
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get(`${API_URL}/content/news`, {
          params: { limit: 3 },
        });
        setNewsList(res.data?.items || []);
      } catch (err) {
        console.error("Lỗi lấy tin tức:", err);
      }
    };
    fetchNews();
  }, []);

  // ==========================================
  // BANNER SLIDER TIMER
  // ==========================================
  useEffect(() => {
    if (banners.length <= 1 || isBannerPaused) return;

    bannerTimerRef.current = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(bannerTimerRef.current);
  }, [banners.length, isBannerPaused]);

  const handlePrevBanner = () => {
    setActiveBannerIdx((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextBanner = () => {
    setActiveBannerIdx((prev) => (prev + 1) % banners.length);
  };

  // ==========================================
  // XỬ LÝ TÌM KIẾM
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = new URLSearchParams();
    if (searchData.keyword.trim()) query.append("keyword", searchData.keyword.trim());
    if (searchData.loaiBDS) query.append("loaiBDS", searchData.loaiBDS);
    if (searchData.tinhThanh) query.append("tinh", searchData.tinhThanh);
    if (searchData.quanHuyen) query.append("huyen", searchData.quanHuyen);
    if (searchData.trangThai) query.append("trangThai", searchData.trangThai);

    // Xử lý khoảng giá
    if (searchData.khoangGia) {
      const [giaTu, giaDen] = searchData.khoangGia.split("-");
      if (giaTu) query.append("giaTu", giaTu);
      if (giaDen) query.append("giaDen", giaDen);
    }

    navigate(`/tim-kiem?${query.toString()}`);
  };

  const handleQuickKeyword = (kw) => {
    setSearchData((prev) => ({ ...prev, keyword: kw }));
    navigate(`/tim-kiem?keyword=${encodeURIComponent(kw)}`);
  };

  const handleRegionClick = (provCode) => {
    navigate(`/tim-kiem?tinh=${provCode}`);
  };

  const currentBanner = banners[activeBannerIdx] || DEFAULT_BANNERS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* ======================================================== */}
      {/* 1. BANNER HERO SECTION (GIỮ NGUYÊN CONTAINER KHOANH ĐỎ, BỎ SEARCH BÊN TRONG) */}
      {/* ======================================================== */}
      <section
        className="relative min-h-[560px] md:min-h-[620px] lg:min-h-[660px] flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsBannerPaused(true)}
        onMouseLeave={() => setIsBannerPaused(false)}
      >
        {/* Background Images Slider */}
        <div className="absolute inset-0 z-0">
          {banners.map((b, idx) => {
            const bgUrl = getBannerImageUrl(b, idx);
            const isActive = idx === activeBannerIdx;
            return (
              <div
                key={b.MaBanner || idx}
                className={`absolute inset-0 bg-center bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                }`}
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.65) 0%, rgba(15, 23, 42, 0.75) 100%), url('${bgUrl}')`,
                  transition: "opacity 1s ease-in-out, transform 8s ease-out",
                }}
              />
            );
          })}
        </div>

        {/* Nội dung Banner: Tiêu đề lớn, mô tả, nút [XEM NGAY] */}
        <div className="container relative z-10 px-4 py-16 mx-auto text-center lg:py-24">
          <div className="max-w-4xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs md:text-sm font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/20 border border-amber-400/40 rounded-full backdrop-blur-md animate-fadeIn">
              ✨ Bất Động Sản 3MAN • Uy Tín & Đẳng Cấp
            </span>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-2xl leading-tight">
              {currentBanner.TenBanner || "SỞ HỮU NHÀ ĐẸP GIÁ TỐT HÔM NAY"}
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium text-slate-200 drop-shadow-md">
              {currentBanner.MoTa ||
                "Tìm kiếm ngôi nhà mơ ước của bạn với hàng nghìn lựa chọn đa dạng, pháp lý minh bạch"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={currentBanner.LienKet || "/tim-kiem"}
                className="inline-flex items-center gap-3 px-8 py-4 text-base font-black text-white transition-all duration-300 rounded-xl shadow-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 group"
              >
                <span>{currentBanner.NutCTA || "XEM NGAY"}</span>
                <FaArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/lien-he"
                className="inline-flex items-center gap-2 px-6 py-4 text-base font-bold text-white transition-all duration-300 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md hover:scale-105"
              >
                <FaPhoneAlt className="text-amber-300" />
                <span>Tư vấn trực tiếp</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Nút điều hướng Slider Trái / Phải */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 text-white transition-all bg-black/30 hover:bg-black/60 rounded-full backdrop-blur-md border border-white/20 hover:scale-110"
              title="Banner trước"
            >
              <FaChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 text-white transition-all bg-black/30 hover:bg-black/60 rounded-full backdrop-blur-md border border-white/20 hover:scale-110"
              title="Banner tiếp theo"
            >
              <FaChevronRight size={18} />
            </button>
          </>
        )}

        {/* Chỉ số chấm tròn Banner (Dots) */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBannerIdx(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === activeBannerIdx
                    ? "w-8 h-2.5 bg-blue-500 shadow-md shadow-blue-400/50"
                    : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
                }`}
                title={`Chuyển tới slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 2. THANH TÌM KIẾM (ĐẶT NGAY DƯỚI BANNER, BỐ CỤC HOÀN CHỈNH) */}
      {/* ======================================================== */}
      <section className="relative z-30 -mt-10 lg:-mt-14 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hộp Tìm kiếm sang trọng */}
          <div className="p-6 md:p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/90 transition-all">
            {/* Header: "Bạn muốn tìm gì?" + Tabs Mua Bán / Cho Thuê */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>Bạn muốn tìm gì?</span>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Bộ lọc thông minh
                  </span>
                </h2>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">
                  Tìm theo từ khóa, loại bất động sản, tỉnh thành, quận huyện và mức giá
                </p>
              </div>

              {/* Tabs chuyển đổi Mua bán / Cho thuê */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSearchData((p) => ({ ...p, trangThai: "đang bán" }))}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
                    searchData.trangThai === "đang bán"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>🏷️</span> Mua bán
                </button>
                <button
                  type="button"
                  onClick={() => setSearchData((p) => ({ ...p, trangThai: "cho thuê" }))}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
                    searchData.trangThai === "cho thuê"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>🔑</span> Cho thuê
                </button>
              </div>
            </div>

            {/* Form tìm kiếm */}
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Row 1: Từ khóa */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <FaSearch className="text-base" />
                </span>
                <input
                  type="text"
                  name="keyword"
                  placeholder="Nhập từ khóa, tên dự án, đường, khu vực (Ví dụ: Vinhomes, Quận 7, Căn hộ 2PN...)"
                  value={searchData.keyword}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 text-base font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 hover:bg-white border-2 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all"
                />
              </div>

              {/* Row 2: 4 Dropdowns (Loại BĐS | Tỉnh/Thành | Quận/Huyện | Khoảng giá) + Nút Tìm kiếm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Loại BĐS */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">
                    Loại BĐS
                  </label>
                  <div className="relative">
                    <select
                      name="loaiBDS"
                      value={searchData.loaiBDS}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-3 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none cursor-pointer pr-9 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="">Tất cả loại BĐS</option>
                      {propertyTypes.map((t) => (
                        <option key={t.MaLoai || t.MaLoaiND} value={t.MaLoai || t.MaLoaiND}>
                          {t.TenLoai || t.TenLoaiND}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Tỉnh/Thành */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">
                    Tỉnh / Thành phố
                  </label>
                  <div className="relative">
                    <select
                      name="tinhThanh"
                      value={searchData.tinhThanh}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-3 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none cursor-pointer pr-9 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="">-- Tỉnh / Thành --</option>
                      {provinces.map((p) => (
                        <option key={p.MaTinh} value={p.MaTinh}>
                          {p.TenTinh}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Quận/Huyện */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">
                    Quận / Huyện
                  </label>
                  <div className="relative">
                    <select
                      name="quanHuyen"
                      value={searchData.quanHuyen}
                      onChange={handleInputChange}
                      disabled={!searchData.tinhThanh}
                      className="w-full px-3.5 py-3 text-sm font-bold text-slate-700 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl appearance-none cursor-pointer pr-9 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="">
                        {searchData.tinhThanh ? "-- Chọn Quận/Huyện --" : "Chọn Tỉnh/Thành trước"}
                      </option>
                      {districts.map((d) => (
                        <option key={d.MaHuyen} value={d.MaHuyen}>
                          {d.TenHuyen}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 4. Khoảng giá */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">
                    Khoảng giá
                  </label>
                  <div className="relative">
                    <select
                      name="khoangGia"
                      value={searchData.khoangGia}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-3 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none cursor-pointer pr-9 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="">Tất cả mức giá</option>
                      <option value="0-1000000000">Dưới 1 tỷ</option>
                      <option value="1000000000-2000000000">1 - 2 tỷ</option>
                      <option value="2000000000-3000000000">2 - 3 tỷ</option>
                      <option value="3000000000-5000000000">3 - 5 tỷ</option>
                      <option value="5000000000-7000000000">5 - 7 tỷ</option>
                      <option value="7000000000-10000000000">7 - 10 tỷ</option>
                      <option value="10000000000-20000000000">10 - 20 tỷ</option>
                      <option value="20000000000-999000000000">Trên 20 tỷ</option>
                    </select>
                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 5. Nút Tìm kiếm */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 text-base font-extrabold text-white rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <FaSearch />
                    <span>Tìm kiếm</span>
                  </button>
                </div>
              </div>

              {/* Gợi ý từ khóa hot */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <span>🔥</span> Gợi ý phổ biến:
                </span>
                {[
                  "Căn hộ Vinhomes Grand Park",
                  "Nhà phố Quận 7",
                  "Đất nền Bình Chánh",
                  "Biệt thự Thủ Đức",
                  "Masteri Centre Point",
                ].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleQuickKeyword(kw)}
                    className="px-2.5 py-1 font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. TIN NỔI BẬT ⭐ (DỮ LIỆU TỪ ADMIN ĐÁNH DẤU TIN NỔI BẬT) */}
      {/* ======================================================== */}
      {featuredProperties.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container px-4 mx-auto max-w-7xl">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-100 gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full mb-2">
                  <FaStar className="text-amber-500" />
                  Đặc quyền nổi bật
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  TIN NỔI BẬT ⭐
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Các bất động sản tiềm năng cao được kiểm duyệt và đánh giá nổi bật trên hệ thống
                </p>
              </div>

              <Link
                to="/tim-kiem?featured=true"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Xem tất cả tin nổi bật</span>
                <FaArrowRight className="text-xs" />
              </Link>
            </div>

            {/* Grid Cards Tin Nổi Bật */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProperties.slice(0, 4).map((prop) => {
                const imgUrl = getPropertyImageUrl(prop);
                return (
                  <div
                    key={prop.MaTTND}
                    className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-amber-200/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
                  >
                    {/* Ảnh + Badges */}
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={imgUrl}
                        alt={prop.TieuDe}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Badge Tin nổi bật */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black text-amber-900 bg-amber-400 rounded-full shadow-md">
                        <FaStar className="text-amber-900" />
                        Tin nổi bật
                      </span>

                      {/* Badge Nhu cầu */}
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold text-white rounded-full shadow-md ${
                          prop.TrangThai === "cho thuê" ? "bg-emerald-600" : "bg-blue-600"
                        }`}
                      >
                        {prop.TrangThai === "cho thuê" ? "Cho thuê" : "Cần bán"}
                      </span>

                      {/* Giá nổi bật trên ảnh khi hover */}
                      <div className="absolute bottom-3 left-3 right-3 text-white font-black text-lg drop-shadow-md">
                        {formatPrice(prop.Gia)}
                        {prop.TrangThai === "cho thuê" && (
                          <span className="text-xs font-normal">/tháng</span>
                        )}
                      </div>
                    </div>

                    {/* Nội dung Card */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3
                        className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug"
                        title={prop.TieuDe}
                      >
                        {prop.TieuDe}
                      </h3>

                      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-3 line-clamp-1">
                        <FaMapMarkerAlt className="text-rose-500 flex-shrink-0" />
                        <span>{prop.DiaChi || "TP. Thủ Đức, TP.HCM"}</span>
                      </p>

                      {/* Thông số kỹ thuật: Giá & Diện tích */}
                      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                        <span className="font-extrabold text-blue-600">
                          {formatPrice(prop.Gia)}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-600">
                          <FaRulerCombined className="text-slate-400 text-xs" />
                          {prop.DienTich || 80} m²
                        </span>
                      </div>

                      <Link
                        to={`/bat-dong-san/${prop.MaTTND}`}
                        className="mt-3 block w-full py-2.5 px-4 text-center text-xs font-extrabold text-white bg-slate-900 hover:bg-blue-600 rounded-xl transition-all shadow-sm group-hover:shadow-md"
                      >
                        Xem chi tiết tin
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. BẤT ĐỘNG SẢN MỚI NHẤT (TIN ĐÃ DUYỆT GẦN ĐÂY) */}
      {/* ======================================================== */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4 mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200/80 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-full mb-2">
                <span>🆕</span> Vừa cập nhật
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Nhà đất mới đăng
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Toàn bộ tin đăng đã kiểm duyệt với thông tin minh bạch, cập nhật theo thời gian thực
              </p>
            </div>

            <Link
              to="/tim-kiem"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Xem tất cả nhà đất ({latestProperties.length}+)</span>
              <FaArrowRight className="text-xs" />
            </Link>
          </div>

          {/* Grid 4 cards / hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProperties.map((prop) => {
              const imgUrl = getPropertyImageUrl(prop);
              const postDate = prop.NgayTao
                ? new Date(prop.NgayTao).toLocaleDateString("vi-VN")
                : "Hôm nay";
              return (
                <div
                  key={prop.MaTTND}
                  className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={imgUrl}
                      alt={prop.TieuDe}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";
                      }}
                    />

                    {/* Tag Nhu cầu */}
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-bold text-white rounded-full shadow-md ${
                        prop.TrangThai === "cho thuê" ? "bg-emerald-600" : "bg-blue-600"
                      }`}
                    >
                      {prop.TrangThai === "cho thuê" ? "Cho thuê" : "Cần bán"}
                    </span>

                    {/* Lượt xem */}
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-white bg-black/50 backdrop-blur-xs rounded-md">
                      <FaEye className="text-[10px]" />
                      {prop.SoLuotXem || 0}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3
                      className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug"
                      title={prop.TieuDe}
                    >
                      {prop.TieuDe}
                    </h3>

                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-3 line-clamp-1">
                      <FaMapMarkerAlt className="text-rose-500 flex-shrink-0" />
                      <span>{prop.DiaChi || "Đang cập nhật địa chỉ"}</span>
                    </p>

                    {/* Thông tin Giá + Diện tích */}
                    <div className="flex items-center justify-between py-2 border-y border-slate-100 text-sm">
                      <span className="font-extrabold text-blue-600">
                        {formatPrice(prop.Gia)}
                        {prop.TrangThai === "cho thuê" && (
                          <span className="text-xs font-normal text-slate-400">/tháng</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-600 text-xs">
                        <FaRulerCombined className="text-slate-400" />
                        {prop.DienTich} m²
                      </span>
                    </div>

                    {/* Ngày đăng */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <FaCalendarAlt className="text-[10px]" />
                        {postDate}
                      </span>
                      <Link
                        to={`/bat-dong-san/${prop.MaTTND}`}
                        className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Chi tiết →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. DỰ ÁN NỔI BẬT (DỮ LIỆU TỪ ADMIN -> QUẢN LÝ DỰ ÁN) */}
      {/* ======================================================== */}
      <section id="du-an-noi-bat" className="py-16 bg-white scroll-mt-20">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-100 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full mb-2">
                <FaBuilding className="text-indigo-600" />
                Quy hoạch & Đô thị
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                DỰ ÁN NỔI BẬT
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Các đại đô thị hiện đại với quy mô lớn, tiện ích toàn diện và chủ đầu tư hàng đầu
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.slice(0, 4).map((proj, idx) => {
              const imgUrl = getProjectImageUrl(proj, idx);
              return (
                <div
                  key={proj.MaDuAn || idx}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                  onClick={() => handleQuickKeyword(proj.TenDuAn)}
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={imgUrl}
                      alt={proj.TenDuAn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent" />

                    {/* Trạng thái dự án */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold text-white bg-blue-600/90 backdrop-blur-xs rounded-full shadow-md">
                      {proj.TrangThai || "Đang mở bán"}
                    </span>

                    {/* Tên dự án trên nền đen */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-lg font-black leading-tight group-hover:text-blue-300 transition-colors">
                        {proj.TenDuAn}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <p className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FaBuilding className="text-slate-400" />
                        <span>Chủ đầu tư:</span>
                        <strong className="text-blue-600">{proj.ChuDauTu || "Vingroup"}</strong>
                      </p>
                      <p className="font-medium text-slate-500 flex items-start gap-1.5">
                        <FaMapMarkerAlt className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{proj.DiaChi || "TP. Thủ Đức, TP.HCM"}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2 px-3 text-xs font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                    >
                      Xem bất động sản thuộc dự án
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. MÔI GIỚI NỔI BẬT / UY TÍN (TÀI KHOẢN MÔI GIỚI ĐÃ XÁC MINH) */}
      {/* ======================================================== */}
      {brokers.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="container px-4 mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200/80 gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full mb-2">
                  <FaCheckCircle className="text-emerald-500" />
                  Xác minh danh tính CCCD
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  MÔI GIỚI UY TÍN
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Đội ngũ chuyên viên tư vấn chuyên nghiệp, am hiểu thị trường và hỗ trợ thủ tục pháp lý trọn gói
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {brokers.map((broker) => {
                const avatarUrl =
                  broker.AnhDaiDien ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
                return (
                  <div
                    key={broker.MaNgDung}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center justify-between hover:-translate-y-1"
                  >
                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                        <img
                          src={avatarUrl}
                          alt={broker.HoTen}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150";
                          }}
                        />
                      </div>
                      <span
                        className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-sm"
                        title="Môi giới đã xác minh"
                      >
                        <FaCheckCircle className="text-emerald-500 text-base" />
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-1">
                      <span>{broker.HoTen || broker.Email}</span>
                      <span className="text-emerald-600 text-sm">✅</span>
                    </h3>

                    <p className="text-xs font-semibold text-blue-600 mt-0.5">
                      Chuyên viên tư vấn BĐS
                    </p>

                    {/* Khu vực chuyên môn */}
                    {broker.KhuVucChuyenMon && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        📍 {broker.KhuVucChuyenMon}
                      </p>
                    )}

                    {/* Số tin đăng & Đánh giá */}
                    <div className="w-full grid grid-cols-2 gap-2 my-4 p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="block font-black text-slate-800 text-sm">
                          {broker.SoTinDang > 0 ? broker.SoTinDang : 120}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">tin đăng</span>
                      </div>
                      <div>
                        <span className="block font-black text-amber-500 text-sm flex items-center justify-center gap-0.5">
                          <FaStar className="text-xs" />
                          {broker.DiemDanhGia || "5.0"}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">đánh giá</span>
                      </div>
                    </div>

                    {/* Nút liên hệ */}
                    <div className="w-full flex items-center gap-2">
                      <a
                        href={`tel:${broker.SDT || "0988000000"}`}
                        className="flex-1 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <FaPhoneAlt className="text-[10px]" />
                        <span>Gọi tư vấn</span>
                      </a>
                      <Link
                        to={`/tim-kiem?keyword=${encodeURIComponent(broker.HoTen || "")}`}
                        className="py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                      >
                        Xem tin
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 7. TIN THEO KHU VỰC (BẤT ĐỘNG SẢN TP.HCM, HÀ NỘI, ĐÀ NẴNG) */}
      {/* ======================================================== */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-100 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 rounded-full mb-2">
                <FaMapMarkerAlt className="text-rose-500" />
                Vị trí trọng điểm
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                BẤT ĐỘNG SẢN THEO KHU VỰC
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Khám phá thị trường bất động sản tại các đô thị năng động bậc nhất Việt Nam
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REGION_CARDS.map((reg) => (
              <div
                key={reg.code}
                onClick={() => handleRegionClick(reg.code)}
                className="group relative h-80 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
              >
                <img
                  src={reg.image}
                  alt={reg.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                <div className="absolute top-4 right-4 px-3 py-1 text-xs font-extrabold text-white bg-blue-600/90 backdrop-blur-xs rounded-full shadow-md">
                  {reg.countText}
                </div>

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <h3 className="text-xl font-black tracking-tight group-hover:text-blue-300 transition-colors">
                    {reg.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-200 mt-1 line-clamp-2">
                    {reg.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 mt-3 group-hover:translate-x-1 transition-transform">
                    Khám phá ngay →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. TIN TỨC BẤT ĐỘNG SẢN (LẤY TỪ ADMIN -> QUẢN LÝ TIN TỨC) */}
      {/* ======================================================== */}
      <section id="tin-tuc-bds" className="py-16 bg-slate-50 scroll-mt-20">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200/80 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-full mb-2">
                <FaNewspaper className="text-blue-600" />
                Cập nhật thị trường
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                TIN TỨC BẤT ĐỘNG SẢN
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Xu hướng bất động sản 2026, kinh nghiệm mua căn hộ lần đầu và các chính sách pháp lý mới
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsList.map((news) => (
              <div
                key={news.MaTinTuc}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                onClick={() => setSelectedNews(news)}
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={
                      news.HinhAnh ||
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={news.TieuDe}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-extrabold text-blue-800 bg-blue-100/95 backdrop-blur-xs rounded-full">
                    {news.DanhMuc || "Thị trường"}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">
                      {news.NgayDang
                        ? new Date(news.NgayDang).toLocaleDateString("vi-VN")
                        : "19/11/2026"}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-1 leading-snug">
                      {news.TieuDe}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                      {news.TomTat ||
                        "Cập nhật những thông tin và xu hướng nổi bật nhất của thị trường bất động sản."}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span>Đọc bài viết</span>
                    <FaArrowRight className="text-[10px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 9. THỐNG KÊ HỆ THỐNG (TĂNG ĐỘ UY TÍN CHO WEBSITE) */}
      {/* ======================================================== */}
      <section className="py-16 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
        {/* Họa tiết trang trí */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10 px-4 mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">
              Con số ấn tượng
            </span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
              HỆ THỐNG KẾT NỐI BẤT ĐỘNG SẢN HÀNG ĐẦU
            </h2>
            <p className="text-sm text-slate-300 mt-2 font-medium">
              Đồng hành cùng hàng triệu khách hàng và môi giới trên toàn quốc
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {/* Stat 1 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-all hover:scale-105">
              <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 mb-2">
                10.000+
              </div>
              <p className="text-sm font-extrabold text-white">Tin đăng</p>
              <p className="text-xs text-slate-400 mt-0.5">Xác thực pháp lý minh bạch</p>
            </div>

            {/* Stat 2 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-all hover:scale-105">
              <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-2">
                500+
              </div>
              <p className="text-sm font-extrabold text-white">Môi giới xác minh</p>
              <p className="text-xs text-slate-400 mt-0.5">Đã xác thực CCCD & chứng chỉ</p>
            </div>

            {/* Stat 3 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-all hover:scale-105">
              <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 mb-2">
                50+
              </div>
              <p className="text-sm font-extrabold text-white">Dự án</p>
              <p className="text-xs text-slate-400 mt-0.5">Khu đô thị & căn hộ cao cấp</p>
            </div>

            {/* Stat 4 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-all hover:scale-105">
              <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-300 mb-2">
                20.000+
              </div>
              <p className="text-sm font-extrabold text-white">Khách hàng</p>
              <p className="text-xs text-slate-400 mt-0.5">Giao dịch thành công an toàn</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODAL XEM CHI TIẾT TIN TỨC */}
      {/* ======================================================== */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-full">
                {selectedNews.DanhMuc || "Tin tức"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                {selectedNews.TieuDe}
              </h2>

              <div className="flex items-center gap-4 text-xs text-slate-400 pb-3 border-b border-slate-100">
                <span>Tác giả: {selectedNews.TacGia || "Ban Biên Tập 3MAN"}</span>
                <span>•</span>
                <span>
                  {selectedNews.NgayDang
                    ? new Date(selectedNews.NgayDang).toLocaleDateString("vi-VN")
                    : "Hôm nay"}
                </span>
                <span>•</span>
                <span>{selectedNews.LuotXem || 0} lượt xem</span>
              </div>

              {selectedNews.HinhAnh && (
                <div className="h-64 rounded-2xl overflow-hidden">
                  <img
                    src={selectedNews.HinhAnh}
                    alt={selectedNews.TieuDe}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="text-sm font-bold text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border-l-4 border-blue-600">
                {selectedNews.TomTat}
              </p>

              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-3">
                {selectedNews.NoiDung ||
                  "Nội dung chi tiết đang được ban biên tập cập nhật thêm các phân tích chuyên sâu về quy hoạch và chính sách mới nhất."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="px-6 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
