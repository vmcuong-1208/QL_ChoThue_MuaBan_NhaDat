"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart,
  FaRegHeart,
  FaEye,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaSort,
  FaSearch,
  FaCheckCircle,
  FaChevronDown,
  FaUndo,
  FaCheck,
  FaArrowLeft,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import locationService from "../../services/locationService";
import { API_URL, SERVER_URL } from "../../services/api";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State cho dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);
  const [tempPriceRange, setTempPriceRange] = useState([0, 1000000000000]);
  const [tempAreaRange, setTempAreaRange] = useState([0, 1000000000]);
  const [tempPriceInput, setTempPriceInput] = useState(["", ""]);
  const [tempAreaInput, setTempAreaInput] = useState(["", ""]);

  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [locationNames, setLocationNames] = useState({});
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [sortOption, setSortOption] = useState("default");

  const [searchData, setSearchData] = useState({
    keyword: "",
    loaiBDS: "",
    tinh: "",
    huyen: "",
    xa: "",
    trangThai: "",
    giaMin: "",
    giaMax: "",
    dienTichMin: "",
    dienTichMax: "",
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const propertiesPerPage = 12;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setSearchData({
      keyword: searchParams.get("keyword") || "",
      loaiBDS: searchParams.get("loaiBDS") || "",
      tinh: searchParams.get("tinh") || "",
      huyen: searchParams.get("huyen") || "",
      xa: searchParams.get("xa") || "",
      trangThai: searchParams.get("trangThai") || "",
      giaMin: searchParams.get("giaMin") || "",
      giaMax: searchParams.get("giaMax") || "",
      dienTichMin: searchParams.get("dienTichMin") || "",
      dienTichMax: searchParams.get("dienTichMax") || "",
    });

    // Sync temp values từ URL
    const giaMin = Number(searchParams.get("giaMin")) || 0;
    const giaMax = Number(searchParams.get("giaMax")) || 0;
    const dienTichMin = Number(searchParams.get("dienTichMin")) || 0;
    const dienTichMax = Number(searchParams.get("dienTichMax")) || 0;

    setTempPriceRange([giaMin, giaMax || 1000000000000]);
    setTempAreaRange([dienTichMin, dienTichMax || 1000000000]);
    setTempPriceInput([
      giaMin > 0 ? giaMin.toString() : "",
      giaMax > 0 ? giaMax.toString() : "",
    ]);
    setTempAreaInput([
      dienTichMin > 0 ? dienTichMin.toString() : "",
      dienTichMax > 0 ? dienTichMax.toString() : "",
    ]);
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertyTypesRes, provincesData] = await Promise.all([
          axios.get(`${API_URL}/property-types`),
          locationService.getProvinces(),
        ]);
        setPropertyTypes(propertyTypesRes.data);
        setProvinces(provincesData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (searchData.tinh) {
        try {
          const data = await locationService.getDistricts(searchData.tinh);
          setDistricts(data);
        } catch (error) {
          console.error("Lỗi khi lấy quận/huyện:", error);
          setDistricts([]);
        }
      } else {
        setDistricts([]);
      }
    };
    fetchDistricts();
  }, [searchData.tinh]);

  useEffect(() => {
    const fetchWards = async () => {
      if (searchData.huyen) {
        try {
          const data = await locationService.getWards(searchData.huyen);
          setWards(data);
        } catch (error) {
          console.error("Lỗi khi lấy phường/xã:", error);
          setWards([]);
        }
      } else {
        setWards([]);
      }
    };
    fetchWards();
  }, [searchData.huyen]);

  useEffect(() => {
    const searchProperties = async () => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: propertiesPerPage,
          ...Object.fromEntries(
            Object.entries(searchData).filter(([_, v]) => v !== "")
          ),
        });

        if (sortOption !== "default") {
          queryParams.append("sort", sortOption);
        }

        const response = await axios.get(
          `${API_URL}/properties/search?${queryParams}`
        );

        setProperties(response.data.properties || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalResults(response.data.pagination?.total || 0);

        await fetchLocationNames(response.data.properties || []);
      } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    searchProperties();
  }, [searchData, currentPage, sortOption]);

  const fetchLocationNames = async (properties) => {
    try {
      const locationNamesObj = {};
      const provinces = await locationService.getProvinces();

      for (const property of properties) {
        if (property.MaTinh) {
          const province = provinces.find(
            (p) => p.MaTinh === parseInt(property.MaTinh)
          );
          if (province) {
            locationNamesObj[`province_${property.MaTinh}`] = province.TenTinh;

            if (property.MaHuyen) {
              try {
                const districts = await locationService.getDistricts(
                  property.MaTinh
                );
                const district = districts.find(
                  (d) => d.MaHuyen === parseInt(property.MaHuyen)
                );
                if (district) {
                  locationNamesObj[`district_${property.MaHuyen}`] =
                    district.TenHuyen;
                }
              } catch (error) {
                console.error("Lỗi khi lấy quận/huyện:", error);
              }
            }
          }
        }
      }

      setLocationNames(locationNamesObj);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin địa điểm:", error);
    }
  };

  useEffect(() => {
    const checkFavorites = async () => {
      if (!currentUser || properties.length === 0) return;

      const token = localStorage.getItem("token");
      const favoriteStatuses = {};

      for (const property of properties) {
        try {
          const response = await axios.get(
            `${API_URL}/favorites/check/${property.MaTTND}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          favoriteStatuses[property.MaTTND] = response.data.isFavorite;
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }

      setFavorites(
        Object.keys(favoriteStatuses)
          .filter((id) => favoriteStatuses[id])
          .map(Number)
      );
    };

    checkFavorites();
  }, [properties, currentUser]);

  // Close dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra nếu click không nằm trong dropdown
      if (openDropdown && !event.target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    // Thêm event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup khi unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Close dropdown khi nhấn ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [openDropdown]);

  const toggleFavorite = async (id) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (favorites.includes(id)) {
        await axios.delete(`${API_URL}/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(favorites.filter((favId) => favId !== id));
      } else {
        await axios.post(
          `${API_URL}/favorites/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFavorites([...favorites, id]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Có lỗi xảy ra khi cập nhật yêu thích");
    }
  };

  const handleViewDetails = async (id) => {
    try {
      await axios.post(`${API_URL}/properties/${id}/view`, {
        viewerId: currentUser?.MaNgDung,
      });
      navigate(`/bat-dong-san/${id}`);
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem:", error);
      navigate(`/bat-dong-san/${id}`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    Object.entries(searchData).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    navigate(`/tim-kiem?${queryParams.toString()}`);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "tinh") {
      setSearchData((prev) => ({ ...prev, huyen: "", xa: "" }));
    } else if (name === "huyen") {
      setSearchData((prev) => ({ ...prev, xa: "" }));
    }
  };

  // Format functions
  const formatPriceValue = (value) => {
    if (value === 0) return "0";
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(0) + " tỷ";
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(0) + " triệu";
    }
    return value.toLocaleString();
  };

  const formatAreaValue = (value) => {
    if (value === 0) return "0";
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + " triệu";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + " nghìn";
    }
    return value.toLocaleString();
  };

  // Price Range Handlers
  const handlePriceInputChange = (index, value) => {
    const newInput = [...tempPriceInput];
    newInput[index] = value;
    setTempPriceInput(newInput);

    if (value !== "") {
      const numValue = Number(value);
      if (index === 0) {
        setTempPriceRange([numValue, tempPriceRange[1]]);
      } else {
        setTempPriceRange([tempPriceRange[0], numValue]);
      }
    }
  };

  const handlePriceSliderChange = (index, value) => {
    const numValue = Number(value);
    if (index === 0) {
      // Thumb trái có thể kéo tự do, chỉ không vượt quá thumb phải
      if (numValue <= tempPriceRange[1]) {
        setTempPriceRange([numValue, tempPriceRange[1]]);
        setTempPriceInput([numValue.toString(), tempPriceInput[1]]);
      }
    } else {
      // Thumb phải có thể kéo tự do, chỉ không vượt xuống dưới thumb trái
      if (numValue >= tempPriceRange[0]) {
        setTempPriceRange([tempPriceRange[0], numValue]);
        setTempPriceInput([tempPriceInput[0], numValue.toString()]);
      }
    }
  };

  const handleApplyPrice = () => {
    setSearchData((prev) => ({
      ...prev,
      giaMin: tempPriceRange[0] > 0 ? tempPriceRange[0].toString() : "",
      giaMax:
        tempPriceRange[1] < 1000000000000 ? tempPriceRange[1].toString() : "",
    }));
    setOpenDropdown(null);
  };

  const handleResetPrice = () => {
    setTempPriceRange([0, 1000000000000]);
    setTempPriceInput(["", ""]);
    setSearchData((prev) => ({
      ...prev,
      giaMin: "",
      giaMax: "",
    }));
  };

  // Area Range Handlers
  const handleAreaInputChange = (index, value) => {
    const newInput = [...tempAreaInput];
    newInput[index] = value;
    setTempAreaInput(newInput);

    if (value !== "") {
      const numValue = Number(value);
      if (index === 0) {
        setTempAreaRange([numValue, tempAreaRange[1]]);
      } else {
        setTempAreaRange([tempAreaRange[0], numValue]);
      }
    }
  };

  const handleAreaSliderChange = (index, value) => {
    const numValue = Number(value);
    if (index === 0) {
      // Thumb trái có thể kéo tự do, chỉ không vượt quá thumb phải
      if (numValue <= tempAreaRange[1]) {
        setTempAreaRange([numValue, tempAreaRange[1]]);
        setTempAreaInput([numValue.toString(), tempAreaInput[1]]);
      }
    } else {
      // Thumb phải có thể kéo tự do, chỉ không vượt xuống dưới thumb trái
      if (numValue >= tempAreaRange[0]) {
        setTempAreaRange([tempAreaRange[0], numValue]);
        setTempAreaInput([tempAreaInput[0], numValue.toString()]);
      }
    }
  };

  const handleApplyArea = () => {
    setSearchData((prev) => ({
      ...prev,
      dienTichMin: tempAreaRange[0] > 0 ? tempAreaRange[0].toString() : "",
      dienTichMax:
        tempAreaRange[1] < 1000000000 ? tempAreaRange[1].toString() : "",
    }));
    setOpenDropdown(null);
  };

  const handleResetArea = () => {
    setTempAreaRange([0, 1000000000]);
    setTempAreaInput(["", ""]);
    setSearchData((prev) => ({
      ...prev,
      dienTichMin: "",
      dienTichMax: "",
    }));
  };

  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ";
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu";
    }
    return price.toLocaleString() + " VNĐ";
  };

  const getFullAddress = (property) => {
    const addressParts = [];
    if (property.DiaChi) addressParts.push(property.DiaChi);
    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`]);
    }
    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`]);
    }
    return addressParts.join(", ");
  };

  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND);
    return type ? type.TenLoai : "Không xác định";
  };

  return (
    <div className="min-h-screen py-6 pt-20 bg-gradient-to-b from-slate-100 to-indigo-100/40">
      <div className="max-w-screen-xl px-4 mx-auto">
        {/* Search Form */}
        <div className="p-4 mb-4 bg-white shadow-xl md:p-5 rounded-2xl animate-fadeIn">
          {/* TABS CHỢ TỐT: TẤT CẢ / CẦN BÁN / CHO THUÊ */}
          <div className="flex gap-2 pb-3 mb-3 border-b border-gray-100">
            <button
              type="button"
              onClick={() => {
                setSearchData((prev) => ({ ...prev, trangThai: "" }));
                const searchParams = new URLSearchParams(location.search);
                searchParams.delete("trangThai");
                navigate(`/tim-kiem?${searchParams.toString()}`);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                !searchData.trangThai
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchData((prev) => ({ ...prev, trangThai: "đang bán" }));
                const searchParams = new URLSearchParams(location.search);
                searchParams.set("trangThai", "đang bán");
                navigate(`/tim-kiem?${searchParams.toString()}`);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                searchData.trangThai === "đang bán"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <span>🏷️</span> Cần bán
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchData((prev) => ({ ...prev, trangThai: "cho thuê" }));
                const searchParams = new URLSearchParams(location.search);
                searchParams.set("trangThai", "cho thuê");
                navigate(`/tim-kiem?${searchParams.toString()}`);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                searchData.trangThai === "cho thuê"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              <span>🔑</span> Cho thuê
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-2.5">
            {/* ROW 1: Input + Nút Tìm kiếm */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="keyword"
                placeholder="Nhập tìm theo từ khóa, địa điểm..."
                value={searchData.keyword}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 text-sm md:text-base font-medium transition-all border-2 border-gray-300 outline-none rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400"
              />
              <button
                type="submit"
                className="flex items-center justify-center flex-shrink-0 text-white transition-all rounded-lg shadow-md w-11 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-110 active:scale-95 hover:shadow-lg"
                title="Tìm kiếm"
              >
                <FaSearch className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* ROW 2: 7 Select - RESPONSIVE GRID */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {/* Loại BĐS */}
              <div className="relative group">
                <select
                  name="loaiBDS"
                  value={searchData.loaiBDS}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-2 pr-7 text-xs md:text-sm font-medium transition-all bg-white border-2 border-gray-300 outline-none appearance-none cursor-pointer rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400"
                >
                  <option value="">Loại BĐS</option>
                  {propertyTypes.map((type) => (
                    <option key={type.MaLoai} value={type.MaLoai}>
                      {type.TenLoai}
                    </option>
                  ))}
                </select>
                <div className="absolute text-gray-500 transition-all duration-300 -translate-y-1/2 pointer-events-none right-1.5 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                  <FaChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Tỉnh/Thành */}
              <div className="relative group">
                <select
                  name="tinh"
                  value={searchData.tinh}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-2 pr-7 text-xs md:text-sm font-medium transition-all bg-white border-2 border-gray-300 outline-none appearance-none cursor-pointer rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400"
                >
                  <option value="">Tỉnh/Thành</option>
                  {provinces.map((province) => (
                    <option key={province.MaTinh} value={province.MaTinh}>
                      {province.TenTinh}
                    </option>
                  ))}
                </select>
                <div className="absolute text-gray-500 transition-all duration-300 -translate-y-1/2 pointer-events-none right-1.5 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                  <FaChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Quận/Huyện */}
              <div className="relative group">
                <select
                  name="huyen"
                  value={searchData.huyen}
                  onChange={handleInputChange}
                  disabled={!searchData.tinh}
                  className="w-full px-2.5 py-2 pr-7 text-xs md:text-sm font-medium transition-all bg-white border-2 border-gray-300 outline-none appearance-none cursor-pointer rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Quận/Huyện</option>
                  {districts.map((district) => (
                    <option key={district.MaHuyen} value={district.MaHuyen}>
                      {district.TenHuyen}
                    </option>
                  ))}
                </select>
                <div className="absolute text-gray-500 transition-all duration-300 -translate-y-1/2 pointer-events-none right-1.5 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                  <FaChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Phường/Xã */}
              <div className="relative group">
                <select
                  name="xa"
                  value={searchData.xa}
                  onChange={handleInputChange}
                  disabled={!searchData.huyen}
                  className="w-full px-2.5 py-2 pr-7 text-xs md:text-sm font-medium transition-all bg-white border-2 border-gray-300 outline-none appearance-none cursor-pointer rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Phường/Xã</option>
                  {wards.map((ward) => (
                    <option key={ward.MaXa} value={ward.MaXa}>
                      {ward.TenXa}
                    </option>
                  ))}
                </select>
                <div className="absolute text-gray-500 transition-all duration-300 -translate-y-1/2 pointer-events-none right-1.5 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                  <FaChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Dropdown Giá */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "price" ? null : "price")
                  }
                  className="flex items-center justify-between w-full px-2.5 py-2 text-xs md:text-sm font-medium text-gray-700 transition-all bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <span className="truncate">
                    {searchData.giaMin || searchData.giaMax
                      ? "Giá: đã chọn"
                      : "Giá"}
                  </span>
                  <FaChevronDown
                    className={`ml-1 flex-shrink-0 w-3 h-3 text-gray-500 transition-transform duration-300 ${
                      openDropdown === "price" ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {/* DROPDOWN CONTENT - CĂN PHẢI + NÚT CÓ HIỆU ỨNG */}
                {openDropdown === "price" && (
                  <div className="absolute right-0 z-50 w-full p-4 mt-2 space-y-3 bg-white border-2 border-blue-200 shadow-2xl sm:w-80 top-full rounded-xl animate-slideInTop">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="text-blue-600">0đ</span>
                        <span className="text-blue-600">1000 tỷ</span>
                      </div>
                      <div className="relative h-6 pt-1">
                        <input
                          type="range"
                          min="0"
                          max="1000000000000"
                          step="10000000"
                          value={tempPriceRange[0]}
                          onChange={(e) =>
                            handlePriceSliderChange(0, e.target.value)
                          }
                          className="absolute z-40 w-full bg-transparent cursor-pointer pointer-events-auto"
                          style={{
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000000000000"
                          step="10000000"
                          value={tempPriceRange[1]}
                          onChange={(e) =>
                            handlePriceSliderChange(1, e.target.value)
                          }
                          className={`absolute w-full bg-transparent pointer-events-auto cursor-pointer ${
                            tempPriceRange[1] > tempPriceRange[0]
                              ? "z-30"
                              : "z-50"
                          }`}
                          style={{
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                        />
                        <div className="absolute w-full h-1.5 -translate-y-1/2 bg-gray-200 rounded-full pointer-events-none top-1/2">
                          <div
                            className="absolute h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                            style={{
                              left: `${
                                (tempPriceRange[0] / 1000000000000) * 100
                              }%`,
                              right: `${
                                100 - (tempPriceRange[1] / 1000000000000) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Từ"
                        value={tempPriceInput[0]}
                        onChange={(e) =>
                          handlePriceInputChange(0, e.target.value)
                        }
                        className="px-2 py-1.5 text-xs border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Đến"
                        value={tempPriceInput[1]}
                        onChange={(e) =>
                          handlePriceInputChange(1, e.target.value)
                        }
                        className="px-2 py-1.5 text-xs border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Buttons - THÊM HIỆU ỨNG */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={handleResetPrice}
                        className="flex items-center justify-center flex-1 gap-1.5 py-1.5 text-xs font-bold text-gray-700 transition-all duration-300 transform bg-gray-100 border-2 border-transparent rounded-lg hover:bg-gray-200 hover:border-gray-300 hover:scale-105 active:scale-95 hover:shadow-md"
                      >
                        <FaUndo className="w-3 h-3" />
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyPrice}
                        className="flex items-center justify-center flex-1 gap-1.5 py-1.5 text-xs font-bold text-white transition-all duration-300 transform shadow-sm rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 hover:shadow-lg"
                      >
                        <FaCheck className="w-3 h-3" />
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown Diện tích */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "area" ? null : "area")
                  }
                  className="flex items-center justify-between w-full px-2.5 py-2 text-xs md:text-sm font-medium text-gray-700 transition-all bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <span className="truncate">
                    {searchData.dienTichMin || searchData.dienTichMax
                      ? "DT: đã chọn"
                      : "Diện tích"}
                  </span>
                  <FaChevronDown
                    className={`ml-1 flex-shrink-0 w-3 h-3 text-gray-500 transition-transform duration-300 ${
                      openDropdown === "area"
                        ? "rotate-180 text-emerald-600"
                        : ""
                    }`}
                  />
                </button>

                {/* DROPDOWN CONTENT - CĂN PHẢI + NÚT CÓ HIỆU ỨNG */}
                {openDropdown === "area" && (
                  <div className="absolute right-0 z-50 w-full p-4 mt-2 space-y-3 bg-white border-2 shadow-2xl sm:w-80 border-emerald-200 top-full rounded-xl animate-slideInTop">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="text-emerald-600">0 m²</span>
                        <span className="text-emerald-600">1 tỷ m²</span>
                      </div>
                      <div className="relative h-6 pt-1">
                        <input
                          type="range"
                          min="0"
                          max="1000000000"
                          step="10"
                          value={tempAreaRange[0]}
                          onChange={(e) =>
                            handleAreaSliderChange(0, e.target.value)
                          }
                          className="absolute z-40 w-full bg-transparent cursor-pointer pointer-events-auto"
                          style={{
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000000000"
                          step="10"
                          value={tempAreaRange[1]}
                          onChange={(e) =>
                            handleAreaSliderChange(1, e.target.value)
                          }
                          className={`absolute w-full bg-transparent pointer-events-auto cursor-pointer ${
                            tempAreaRange[1] > tempAreaRange[0]
                              ? "z-30"
                              : "z-50"
                          }`}
                          style={{
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                        />
                        <div className="absolute w-full h-1.5 -translate-y-1/2 bg-gray-200 rounded-full pointer-events-none top-1/2">
                          <div
                            className="absolute h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
                            style={{
                              left: `${(tempAreaRange[0] / 1000000000) * 100}%`,
                              right: `${
                                100 - (tempAreaRange[1] / 1000000000) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Từ"
                        value={tempAreaInput[0]}
                        onChange={(e) =>
                          handleAreaInputChange(0, e.target.value)
                        }
                        className="px-2 py-1.5 text-xs border-2 border-gray-300 rounded-lg outline-none focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Đến"
                        value={tempAreaInput[1]}
                        onChange={(e) =>
                          handleAreaInputChange(1, e.target.value)
                        }
                        className="px-2 py-1.5 text-xs border-2 border-gray-300 rounded-lg outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Buttons - THÊM HIỆU ỨNG */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={handleResetArea}
                        className="flex items-center justify-center flex-1 gap-1.5 py-1.5 text-xs font-bold text-gray-700 transition-all duration-300 transform bg-gray-100 border-2 border-transparent rounded-lg hover:bg-gray-200 hover:border-gray-300 hover:scale-105 active:scale-95 hover:shadow-md"
                      >
                        <FaUndo className="w-3 h-3" />
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyArea}
                        className="flex items-center justify-center flex-1 gap-1.5 py-1.5 text-xs font-bold text-white transition-all duration-300 transform shadow-sm rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:scale-105 active:scale-95 hover:shadow-lg"
                      >
                        <FaCheck className="w-3 h-3" />
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort - Mặc định */}
              <div className="relative group">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-2.5 py-2 pr-7 text-xs md:text-sm font-medium transition-all bg-white border-2 border-gray-300 outline-none appearance-none cursor-pointer rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="area-asc">DT tăng dần</option>
                  <option value="area-desc">DT giảm dần</option>
                  <option value="views-desc">Xem nhiều</option>
                  <option value="newest">Mới nhất</option>
                </select>
                <div className="absolute text-gray-500 transition-all duration-300 -translate-y-1/2 pointer-events-none right-1.5 top-1/2 group-focus-within:rotate-180 group-focus-within:text-blue-600">
                  <FaChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Results Info - RÚT NGẮN */}
        <div className="flex items-center px-3 py-1.5 mb-3 bg-white border border-gray-200 shadow-sm rounded-lg">
          <p className="text-xs font-bold text-gray-700 md:text-sm">
            Tìm thấy <span className="text-blue-600">{totalResults}</span> kết
            quả
          </p>
        </div>

        {/* GIỮ NGUYÊN PHẦN PROPERTIES GRID TỪ CODE CŨ */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-xl font-bold text-gray-700">
                Đang tìm kiếm...
              </p>
            </div>
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {properties.map((property, index) => (
                <div
                  key={property.MaTTND}
                  className="flex flex-col h-full overflow-hidden transition-all duration-500 transform bg-white shadow-lg rounded-xl hover:shadow-2xl hover:-translate-y-2 group animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Ảnh - GIẢM CHIỀU CAO */}
                  <div className="relative h-32 overflow-hidden sm:h-36 md:h-40">
                    <img
                      src={
                        property.HinhAnh && property.HinhAnh.length > 0
                          ? `${SERVER_URL}${property.HinhAnh[0]}`
                          : "/placeholder.svg?height=200&width=400"
                      }
                      alt={property.TieuDe}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=200&width=400";
                      }}
                    />
                    <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100"></div>

                    {property.TrangThaiXacThuc === "đã xác thực" && (
                      <div className="absolute flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-white bg-green-500 rounded-full shadow-lg top-2 left-2 animate-slideInLeft">
                        <FaCheckCircle className="w-2.5 h-2.5" />
                        Xác thực
                      </div>
                    )}

                    <button
                      onClick={() => toggleFavorite(property.MaTTND)}
                      className="absolute flex items-center justify-center transition-transform duration-500 bg-white rounded-full shadow-lg w-7 h-7 top-2 right-2 hover:scale-110"
                    >
                      {favorites.includes(property.MaTTND) ? (
                        <FaHeart className="text-sm text-red-500" />
                      ) : (
                        <FaRegHeart className="text-sm text-gray-600" />
                      )}
                    </button>

                    <span className={`absolute px-2 py-0.5 text-[10px] font-bold text-white rounded-full shadow-lg bottom-2 right-2 ${
                      property.TrangThai === "cho thuê" ? "bg-green-600" : "bg-blue-600"
                    }`}>
                      {property.TrangThai === "cho thuê" ? "Cho thuê" : "Cần bán"}
                    </span>
                  </div>

                  {/* Nội dung - GIẢM PADDING */}
                  <div className="flex flex-col flex-1 p-3">
                    <div className="mb-2 space-y-1.5 min-h-[70px] md:min-h-[75px]">
                      <h3 className="text-sm font-bold text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600">
                        {property.TieuDe}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <FaMapMarkerAlt className="flex-shrink-0 w-3 h-3 text-red-500" />
                        <span className="line-clamp-1">
                          {getFullAddress(property)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                      <span className={`text-base font-bold ${
                        property.TrangThai === "cho thuê" ? "text-green-600" : "text-blue-600"
                      }`}>
                        {formatPrice(property.Gia)}
                        {property.TrangThai === "cho thuê" && <span className="text-[11px] font-normal text-gray-500">/tháng</span>}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                        <FaRulerCombined className="w-3 h-3 text-gray-500" />
                        {property.DienTich} m²
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-gray-700 bg-gray-100 rounded-lg">
                        {getPropertyTypeName(property.MaLoaiND)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-600">
                        <FaEye className="w-3 h-3 text-gray-400" />
                        {property.SoLuotXem || 0}
                      </span>
                    </div>

                    <button
                      onClick={() => handleViewDetails(property.MaTTND)}
                      className="w-full px-3 py-2 mt-auto text-xs font-bold text-white transition-all duration-300 transform rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 hover:shadow-lg"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* GIỮ NGUYÊN PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 animate-fadeIn">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-6 py-3 text-base font-bold text-gray-700 transition-all bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &laquo; Trước
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-12 h-12 text-base font-bold rounded-xl transition-all ${
                          currentPage === page
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110"
                            : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-blue-500"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 text-base font-bold text-gray-700 transition-all bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau &raquo;
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center animate-fadeIn">
            <div className="max-w-md mx-auto">
              <div className="mb-6 text-6xl">🔍</div>
              <h3 className="mb-4 text-2xl font-extrabold text-gray-900">
                Không tìm thấy kết quả phù hợp
              </h3>
              <p className="mb-8 text-lg font-medium text-gray-600">
                Hãy thử điều chỉnh bộ lọc tìm kiếm của bạn
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-4 text-lg font-extrabold text-white transition-all duration-500 transform shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 hover:shadow-xl"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
