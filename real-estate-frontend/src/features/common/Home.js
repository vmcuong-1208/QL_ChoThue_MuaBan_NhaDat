import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaHome,
  FaChevronDown,
  FaRulerCombined,
  FaEye,
} from "react-icons/fa";
import PropertyList from "../properties/PropertyList";
import { useAuth } from "../../context/AuthContext";
import locationService from "../../services/locationService";
import { API_URL, SERVER_URL } from "../../services/api";

const backgroundImages = [
  "/images/hero/BDS1.jpg",
  "/images/hero/BDS2.jpg",
  "/images/hero/BDS3.jpg",
  "/images/hero/BDS4.jpg",
  "/images/hero/BDS5.jpg",
];

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    keyword: "",
    loaiBDS: "",
    tinhThanh: "",
    quanHuyen: "",
    phuongXa: "",
    trangThai: "đang bán", // Mặc định là tìm Mua Bán (Chợ Tốt Style)
  });

  const [openLocationDropdown, setOpenLocationDropdown] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [activeBgIndex, setActiveBgIndex] = useState(0);

  // Slideshow background: mỗi 4s đổi index, Tailwind lo fade
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000); // 4s đổi ảnh

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await axios.get(`${API_URL}/property-types`);
        setPropertyTypes(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy loại nhà đất:", error);
      }
    };
    fetchPropertyTypes();
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesData = await locationService.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (searchData.tinhThanh) {
        try {
          const districtsData = await locationService.getDistricts(
            searchData.tinhThanh
          );
          setDistricts(districtsData);
        } catch (error) {
          console.error("Lỗi khi lấy danh sách quận/huyện:", error);
          setDistricts([]);
        }
      } else {
        setDistricts([]);
        setSearchData((prev) => ({ ...prev, quanHuyen: "", phuongXa: "" }));
      }
    };
    fetchDistricts();
  }, [searchData.tinhThanh]);

  useEffect(() => {
    const fetchWards = async () => {
      if (searchData.quanHuyen) {
        try {
          const wardsData = await locationService.getWards(
            searchData.quanHuyen
          );
          setWards(wardsData);
        } catch (error) {
          console.error("Lỗi khi lấy danh sách phường/xã:", error);
          setWards([]);
        }
      } else {
        setWards([]);
        setSearchData((prev) => ({ ...prev, phuongXa: "" }));
      }
    };
    fetchWards();
  }, [searchData.quanHuyen]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (currentUser) {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${API_URL}/recommendations`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 6 },
          });
          setRecommendations(response.data.recommendations || []);
        } else {
          const response = await axios.get(`${API_URL}/properties`, {
            params: { limit: 6, sort: "views-desc" },
          });
          setRecommendations(response.data.properties || []);
        }
      } catch (error) {
        console.error("Lỗi khi lấy gợi ý:", error);
        try {
          const response = await axios.get(`${API_URL}/properties`, {
            params: { limit: 6, sort: "views-desc" },
          });
          setRecommendations(response.data.properties || []);
        } catch (fallbackError) {
          console.error("Lỗi fallback:", fallbackError);
        }
      }
    };
    fetchRecommendations();
  }, [currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchData.keyword) queryParams.append("keyword", searchData.keyword);
    if (searchData.loaiBDS) queryParams.append("loaiBDS", searchData.loaiBDS);
    if (searchData.tinhThanh) queryParams.append("tinh", searchData.tinhThanh);
    if (searchData.quanHuyen) queryParams.append("huyen", searchData.quanHuyen);
    if (searchData.phuongXa) queryParams.append("xa", searchData.phuongXa);
    if (searchData.trangThai) queryParams.append("trangThai", searchData.trangThai);
    navigate(`/tim-kiem?${queryParams.toString()}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({ ...prev, [name]: value }));
  };

  // Get display text for location
  const getLocationDisplayText = () => {
    let text = "Chọn khu vực";
    if (searchData.tinhThanh) {
      const province = provinces.find(
        (p) => p.MaTinh === Number(searchData.tinhThanh)
      );
      text = province?.TenTinh || "Tỉnh/Thành";

      if (searchData.quanHuyen) {
        const district = districts.find(
          (d) => d.MaHuyen === Number(searchData.quanHuyen)
        );
        text += ` > ${district?.TenHuyen || "Quận/Huyện"}`;

        if (searchData.phuongXa) {
          const ward = wards.find(
            (w) => w.MaXa === Number(searchData.phuongXa)
          );
          text += ` > ${ward?.TenXa || "Phường/Xã"}`;
        }
      }
    }
    return text;
  };

  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ";
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu";
    }
    return price.toLocaleString() + " VNĐ";
  };

  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND);
    return type ? type.TenLoai : "Không xác định";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section với Animation */}
      <section className="relative min-h-[650px] flex items-center overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0">
          {backgroundImages.map((img, index) => (
            <div
              key={img}
              className={`
        absolute inset-0 bg-center bg-cover bg-no-repeat
        transition-opacity duration-1000
        ${index === activeBgIndex ? "opacity-100" : "opacity-0"}
      `}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${img}')`,
              }}
            />
          ))}
        </div>
        <div className="container relative z-10 px-4 py-16 mx-auto lg:py-24">
          {/* Hero Text với Fade In Animation */}
          <div className="mb-12 text-center animate-fadeIn">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl drop-shadow-2xl">
              Chào mừng đến với <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 animate-gradient">
                Website Bất Động Sản!
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl font-semibold text-gray-100 md:text-2xl drop-shadow-lg animate-fadeInDelay">
              Tìm kiếm ngôi nhà mơ ước của bạn với hàng nghìn lựa chọn đa dạng
            </p>
          </div>

          {/* Search Form - Compact 1 Row */}
          <div className="mx-auto max-w-7xl animate-scaleIn">
            {/* TABS CHỢ TỐT: MUA BÁN vs CHO THUÊ */}
            <div className="flex gap-2 mb-2 ml-2">
              <button
                type="button"
                onClick={() => setSearchData((prev) => ({ ...prev, trangThai: "đang bán" }))}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-t-xl font-bold text-sm transition-all cursor-pointer ${
                  searchData.trangThai === "đang bán"
                    ? "bg-white text-blue-600 shadow-md border-t-4 border-blue-600"
                    : "bg-white/80 text-gray-700 hover:bg-white"
                }`}
              >
                <span>🏷️</span> Mua bán BĐS
              </button>
              <button
                type="button"
                onClick={() => setSearchData((prev) => ({ ...prev, trangThai: "cho thuê" }))}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-t-xl font-bold text-sm transition-all cursor-pointer ${
                  searchData.trangThai === "cho thuê"
                    ? "bg-white text-green-600 shadow-md border-t-4 border-green-600"
                    : "bg-white/80 text-gray-700 hover:bg-white"
                }`}
              >
                <span>🔑</span> Cho thuê BĐS
              </button>
            </div>

            <form
              onSubmit={handleSearch}
              className="p-4 transition-all duration-300 bg-white shadow-xl md:p-5 rounded-2xl hover:shadow-2xl"
            >
              {/* Row 1 - Trên 1 hàng: Input | Khu vực | Loại BĐS | Nút Tìm | Nút Nâng cao */}
              <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                {/* Input Tìm kiếm - Flex grow */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    name="keyword"
                    placeholder="Tìm bất động sản..."
                    value={searchData.keyword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base font-medium transition-all duration-300 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-blue-400"
                  />
                </div>

                {/* Chọn Khu Vực Dropdown */}
                <div className="relative md:w-48">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenLocationDropdown(!openLocationDropdown)
                    }
                    className="flex items-center justify-between w-full px-3 py-3 text-base font-medium text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  >
                    <div className="flex items-center flex-1 min-w-0 gap-2">
                      <FaMapMarkerAlt className="flex-shrink-0 text-blue-500" />
                      <span className="text-base font-medium truncate md:text-lg">
                        {getLocationDisplayText()}
                      </span>
                    </div>
                    <FaChevronDown
                      className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ml-1 ${
                        openLocationDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Location Dropdown Content */}
                  {openLocationDropdown && (
                    <div
                      className="absolute left-0 z-50 px-4 py-4 mt-2 bg-white border-2 border-blue-300 shadow-2xl rounded-xl top-full animate-slideInTop"
                      style={{ minWidth: "280px" }}
                    >
                      {/* Container các select */}
                      <div className="flex flex-row justify-start gap-3 overflow-x-auto">
                        {/* Tỉnh/Thành phố */}
                        <div className="flex-shrink-0 w-56">
                          <label className="block mb-2 text-sm font-black tracking-wide text-blue-700">
                            Tỉnh/Thành phố
                          </label>
                          <div className="relative group">
                            <select
                              name="tinhThanh"
                              value={searchData.tinhThanh}
                              onChange={(e) => {
                                handleInputChange(e);
                                setSearchData((prev) => ({
                                  ...prev,
                                  quanHuyen: "",
                                  phuongXa: "",
                                }));
                              }}
                              className="w-full px-3 py-2 text-sm font-bold transition-all duration-300 bg-white border-2 border-gray-300 rounded-lg appearance-none cursor-pointer pr-9 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none hover:border-blue-400 hover:shadow-lg"
                            >
                              <option value="">-- Chọn Tỉnh/Thành --</option>
                              {provinces.map((province) => (
                                <option
                                  key={province.MaTinh}
                                  value={province.MaTinh}
                                >
                                  {province.TenTinh}
                                </option>
                              ))}
                            </select>
                            <div className="absolute text-gray-500 transition-transform duration-300 -translate-y-1/2 pointer-events-none right-3 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Quận/Huyện */}
                        {searchData.tinhThanh && (
                          <div className="flex-shrink-0 w-56 animate-slideInRight">
                            <label className="block mb-2 text-sm font-black tracking-wide text-blue-700">
                              Quận/Huyện
                            </label>
                            <div className="relative group">
                              <select
                                name="quanHuyen"
                                value={searchData.quanHuyen}
                                onChange={(e) => {
                                  handleInputChange(e);
                                  setSearchData((prev) => ({
                                    ...prev,
                                    phuongXa: "",
                                  }));
                                }}
                                className="w-full px-3 py-2 text-sm font-bold transition-all duration-300 bg-white border-2 border-gray-300 rounded-lg appearance-none cursor-pointer pr-9 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none hover:border-blue-400 hover:shadow-lg"
                              >
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {districts.map((district) => (
                                  <option
                                    key={district.MaHuyen}
                                    value={district.MaHuyen}
                                  >
                                    {district.TenHuyen}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute text-gray-500 transition-transform duration-300 -translate-y-1/2 pointer-events-none right-3 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Phường/Xã */}
                        {searchData.quanHuyen && (
                          <div className="flex-shrink-0 w-56 animate-slideInRight">
                            <label className="block mb-2 text-sm font-black tracking-wide text-blue-700">
                              Phường/Xã
                            </label>
                            <div className="relative group">
                              <select
                                name="phuongXa"
                                value={searchData.phuongXa}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-sm font-bold transition-all duration-300 bg-white border-2 border-gray-300 rounded-lg appearance-none cursor-pointer pr-9 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none hover:border-blue-400 hover:shadow-lg"
                              >
                                <option value="">-- Chọn Phường/Xã --</option>
                                {wards.map((ward) => (
                                  <option key={ward.MaXa} value={ward.MaXa}>
                                    {ward.TenXa}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute text-gray-500 transition-transform duration-300 -translate-y-1/2 pointer-events-none right-3 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nút xác nhận - gọn, không có border-t */}
                      <div className="flex justify-center mt-3">
                        <button
                          type="button"
                          onClick={() => setOpenLocationDropdown(false)}
                          className="px-6 py-2 text-sm font-bold text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Loại BĐS Dropdown */}
                {/* Loại BĐS Dropdown với Chevron Animated */}
                <div className="relative md:w-44 group">
                  <select
                    name="loaiBDS"
                    value={searchData.loaiBDS}
                    onChange={handleInputChange}
                    className="px-3 py-3 text-base font-medium transition-all duration-300 bg-white border-2 border-gray-300 rounded-lg appearance-none md:text-lg md:w-44 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-300"
                  >
                    <option value="">Tất cả loại BĐS</option>
                    {propertyTypes.map((type) => (
                      <option key={type.MaLoai} value={type.MaLoai}>
                        {type.TenLoai}
                      </option>
                    ))}
                  </select>

                  {/* Chevron Icon Animated */}
                  <div className="absolute text-gray-500 transition-all duration-300 -translate-y-1/2 pointer-events-none right-3 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                {/* Nút Tìm kiếm - Xanh dương */}
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                  <FaSearch className="text-lg" />
                  Tìm kiếm
                </button>

                {/* Nút Tìm kiếm nâng cao - Button */}
                <Link
                  to="/tim-kiem"
                  className="flex items-center justify-center px-6 py-3 text-base font-bold text-blue-600 transition-all duration-300 border-2 border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                  Nâng cao
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Recommendations Section với Stagger Animation */}
      {recommendations.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container px-4 mx-auto">
            {/* HEADER / LABEL */}
            <div className="mb-12 text-center animate-fadeInUp">
              <h2 className="flex items-center justify-center gap-3 mb-4 text-4xl font-bold text-gray-800">
                <span className="text-5xl animate-bounce">💡</span>
                {currentUser
                  ? "Bất động sản được gợi ý"
                  : "Bất động sản nổi bật"}
              </h2>
              <p className="text-xl font-semibold text-gray-600">
                {currentUser
                  ? "Dựa trên sở thích của bạn"
                  : "Bất động sản phổ biến nhất"}
              </p>
            </div>

            {/* GRID CARD – 4–5 CARD / HÀNG */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {recommendations.map((property, index) => (
                <div
                  key={property.MaTTND}
                  className="flex flex-col h-full overflow-hidden transition-all duration-500 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2 animate-fadeInUp group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Ảnh */}
                  <div className="relative h-40 overflow-hidden md:h-44 lg:h-48">
                    <img
                      src={
                        property.HinhAnh && property.HinhAnh.length > 0
                          ? `${SERVER_URL}${property.HinhAnh[0]}`
                          : "https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                      }
                      alt={property.TieuDe}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                    />
                    <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100" />

                    {property.TrangThaiXacThuc === "đã xác thực" && (
                      <div className="absolute flex items-center gap-2 px-3 py-1 text-xs font-bold text-white transition-all duration-300 transform bg-green-500 rounded-full shadow-lg top-3 left-3 animate-slideInLeft hover:scale-110">
                        <FaCheckCircle className="animate-spin-slow" />
                        Đã xác thực
                      </div>
                    )}

                    <div className={`absolute px-3 py-1 text-xs font-bold text-white transition-all duration-300 transform rounded-full shadow-lg top-3 right-3 animate-slideInRight hover:scale-110 ${
                      property.TrangThai === "cho thuê" ? "bg-green-600" : "bg-blue-600"
                    }`}>
                      {property.TrangThai === "cho thuê" ? "Cho thuê" : "Cần bán"}
                    </div>
                  </div>

                  {/* Nội dung card */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Tiêu đề + địa chỉ (fix chiều cao) */}
                    <div className="mb-3 space-y-2 min-h-[80px] md:min-h-[90px]">
                      <h3 className="text-base font-bold text-gray-800 transition-colors duration-300 line-clamp-2 group-hover:text-blue-600">
                        {property.TieuDe}
                      </h3>
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <FaMapMarkerAlt className="flex-shrink-0 text-red-500 animate-pulse" />
                        <span className="line-clamp-1">
                          {property.DiaChi || "Đang cập nhật địa chỉ"}
                        </span>
                      </p>
                    </div>

                    {/* Giá + diện tích */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                      <span className={`text-lg font-bold ${
                        property.TrangThai === "cho thuê" ? "text-green-600" : "text-blue-600"
                      }`}>
                        {formatPrice(property.Gia)}
                        {property.TrangThai === "cho thuê" && <span className="text-xs font-normal text-gray-500">/tháng</span>}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold text-gray-700">
                        <FaRulerCombined className="text-gray-500" />
                        {property.DienTich} m²
                      </span>
                    </div>

                    {/* Loại BĐS + lượt xem */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="px-2 py-1 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg">
                        {getPropertyTypeName(property.MaLoaiND)}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                        <FaEye className="text-gray-400" />
                        {property.SoLuotXem || 0}
                      </span>
                    </div>

                    {/* Nút xem chi tiết – sát đáy */}
                    <Link
                      to={`/bat-dong-san/${property.MaTTND}`}
                      className="mt-auto relative block w-full px-4 py-2.5 overflow-hidden text-sm font-extrabold text-center text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:scale-105 active:scale-95 group/btn"
                    >
                      <span className="relative z-10 font-bold">
                        Xem chi tiết
                      </span>
                      <span className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-blue-700 to-indigo-700 group-hover/btn:opacity-100" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Properties Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container px-4 mx-auto">
          <div className="mb-12 text-center animate-fadeInUp">
            <h2 className="flex items-center justify-center gap-3 mb-4 text-4xl font-bold text-gray-800">
              <FaHome className="text-5xl text-blue-600 animate-bounce" />
              Tất cả bất động sản
            </h2>
            <p className="text-xl font-semibold text-gray-700">
              Khám phá toàn bộ danh sách bất động sản
            </p>
          </div>
          <PropertyList />
        </div>
      </section>
    </div>
  );
};

export default Home;
