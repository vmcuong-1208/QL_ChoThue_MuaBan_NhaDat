"use client";

import { useState, useEffect } from "react";
import locationService from "../../services/locationService";
import {
  FaChartLine,
  FaMapMarkerAlt,
  FaHome,
  FaArrowUp,
  FaArrowDown,
  FaFilter,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaChevronDown,
} from "react-icons/fa";
import { API_URL } from "../../services/api";

const normalizeString = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const getPriceForTimeRange = (properties, monthsAgo) => {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const nextMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    1
  );

  const filteredPrices = properties
    .filter((p) => {
      const propDate = new Date(p.NgayTao);
      return propDate >= targetDate && propDate < nextMonth;
    })
    .map((p) => {
      const price = p.Gia || p.GiaBan || p.Tien || p.price || p.MucGia || 0;
      return price > 0 ? price / 1000000 : 0;
    })
    .filter((p) => p > 0);

  if (filteredPrices.length === 0) return 0;
  return (
    Math.round(
      (filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length) * 10
    ) / 10
  );
};

export default function PriceReference() {
  const [searchParams, setSearchParams] = useState({
    propertyType: "",
    district: "",
  });

  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceLastMonth, setPriceLastMonth] = useState(0);
  const [priceLastYear, setPriceLastYear] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [regionalData, setRegionalData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);
        const [typesRes, propsRes, provincesData] = await Promise.all([
          fetch(`${API_URL}/property-types`),
          fetch(`${API_URL}/properties?limit=1000`),
          locationService.getProvinces(),
        ]);

        const types = await typesRes.json();
        const props = await propsRes.json();

        setPropertyTypes(Array.isArray(types) ? types : []);
        setProvinces(provincesData);

        // ✅ BỎ AUTO-SELECT - Giữ nguyên giá trị rỗng
        // Không còn setSearchParams và setSelectedProvince
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setError("Lỗi khi tải dữ liệu ban đầu");
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        // ✅ Reset districts khi không có province
        setDistricts([]);
        setSearchParams((prev) => ({
          ...prev,
          district: "",
        }));
        return;
      }

      try {
        const districtsData = await locationService.getDistricts(
          selectedProvince
        );
        setDistricts(districtsData);

        // ✅ BỎ AUTO-SELECT DISTRICT
        // Reset district về rỗng khi đổi province
        setSearchParams((prev) => ({
          ...prev,
          district: "",
        }));
      } catch (error) {
        console.error("Error fetching districts:", error);
        setError("Lỗi khi tải danh sách quận/huyện");
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (
      !searchParams.propertyType ||
      !searchParams.district ||
      !selectedProvince
    ) {
      // Reset data khi chưa chọn đủ
      setCurrentPrice(0);
      setPriceData([]);
      setRegionalData([]);
      setLoading(false);
      return;
    }

    const fetchPriceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          loaiBDS: searchParams.propertyType,
          huyen: searchParams.district,
          limit: 1000,
        });

        if (selectedProvince) {
          queryParams.append("tinh", selectedProvince);
        }

        const response = await fetch(
          `${API_URL}/properties/search?${queryParams.toString()}`
        );
        const data = await response.json();

        const filtered = data.properties || [];

        if (filtered.length > 0) {
          const prices = filtered
            .map((p) => {
              const price = p.Gia || 0;
              return price > 0 ? price / 1000000 : 0;
            })
            .filter((p) => p > 0);

          if (prices.length === 0) {
            setCurrentPrice(0);
            setPriceData([]);
            setRegionalData([]);
            setError("Không có giá trị hợp lệ cho dữ liệu này");
            return;
          }

          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const min = Math.min(...prices);
          const max = Math.max(...prices);

          const priceLastMonthReal = getPriceForTimeRange(filtered, 1);
          const priceLastYearReal = getPriceForTimeRange(filtered, 12);

          setCurrentPrice(Math.round(avgPrice * 10) / 10);
          setMinPrice(Math.round(min * 10) / 10);
          setMaxPrice(Math.round(max * 10) / 10);
          setPriceLastMonth(
            priceLastMonthReal > 0
              ? priceLastMonthReal
              : Math.round(avgPrice * 10) / 10
          );
          setPriceLastYear(
            priceLastYearReal > 0
              ? priceLastYearReal
              : Math.round(avgPrice * 10) / 10
          );

          const trend = Array.from({ length: 12 }, (_, i) => {
            const currentMonth = new Date().getMonth() + 1;
            const monthsBack = 11 - i;
            let month = currentMonth - monthsBack;
            if (month <= 0) month += 12;

            return {
              month: `T${month}`,
              price: avgPrice - (i - 5) * 0.5,
              minPrice: min,
              maxPrice: max,
            };
          });
          setPriceData(trend);

          const regional = [];
          for (const dist of districts) {
            if (regional.length >= 5) break;

            try {
              const distQueryParams = new URLSearchParams({
                loaiBDS: searchParams.propertyType,
                huyen: dist.MaHuyen,
                limit: 100,
              });
              if (selectedProvince) {
                distQueryParams.append("tinh", selectedProvince);
              }

              const distResponse = await fetch(
                `${API_URL}/properties/search?${distQueryParams.toString()}`
              );
              const distData = await distResponse.json();
              const distProps = distData.properties || [];

              if (distProps.length === 0) continue;

              const distPrices = distProps
                .map((p) => {
                  const price = p.Gia || 0;
                  return price > 0 ? price / 1000000 : 0;
                })
                .filter((p) => p > 0);

              if (distPrices.length === 0) continue;

              const distAvg =
                distPrices.reduce((a, b) => a + b, 0) / distPrices.length;
              regional.push({
                name: dist.TenHuyen,
                price: Math.round(distAvg * 10) / 10,
                minPrice: Math.round(Math.min(...distPrices) * 10) / 10,
                maxPrice: Math.round(Math.max(...distPrices) * 10) / 10,
              });
            } catch (error) {
              console.error(
                `Error fetching data for district ${dist.TenHuyen}:`,
                error
              );
            }
          }

          setRegionalData(regional);
          setError(null);
        } else {
          setCurrentPrice(0);
          setPriceData([]);
          setRegionalData([]);
          setError("Không tìm thấy dữ liệu giá cho lựa chọn này.");
        }
      } catch (error) {
        console.error("Error fetching price data:", error);
        setError("Lỗi khi tải dữ liệu giá");
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [searchParams, districts, selectedProvince]);

  const getSelectedPropertyTypeName = () => {
    const type = propertyTypes.find(
      (t) => t.MaLoai === parseInt(searchParams.propertyType)
    );
    return type ? type.TenLoai : "";
  };

  const getSelectedDistrictName = () => {
    const district = districts.find(
      (d) => d.MaHuyen === parseInt(searchParams.district)
    );
    return district ? district.TenHuyen : "";
  };

  const priceChangeMonth =
    currentPrice && priceLastMonth
      ? (((currentPrice - priceLastMonth) / priceLastMonth) * 100).toFixed(1)
      : 0;
  const priceChangeYear =
    currentPrice && priceLastYear
      ? (((currentPrice - priceLastYear) / priceLastYear) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-96 h-96 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 bg-white rounded-full w-96 h-96 blur-3xl"></div>
        </div>

        <div className="relative px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center animate-fadeIn">
            <div className="flex items-center justify-center mb-4">
              <FaChartLine className="mr-3 text-5xl text-white animate-bounce" />
            </div>
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-4xl animate-slideInDown">
              Tham Khảo Giá Bất Động Sản
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-blue-100 md:text-xl animate-slideInUp">
              Cập nhật xu hướng giá, phân tích thị trường và so sánh giá trị bất
              động sản theo từng khu vực
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* ===== SEARCH FILTERS CARD ===== */}
        <div className="p-6 mb-8 transition-all duration-300 bg-white shadow-xl md:p-8 rounded-2xl hover:shadow-2xl animate-slideInUp">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 mr-4 bg-blue-100 rounded-full">
              <FaFilter className="text-xl text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Bộ lọc tìm kiếm
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Property Type */}
            {/* Property Type - ANIMATED CHEVRON */}
            <div className="space-y-1.5 animate-fadeIn">
              <label className="flex items-center text-xs font-semibold text-gray-700">
                <FaHome className="mr-1.5 text-blue-600" />
                Loại bất động sản
              </label>
              <div className="relative group">
                <select
                  value={searchParams.propertyType}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      propertyType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pr-8 text-sm font-medium transition-all duration-300 bg-white border-2 border-gray-200 rounded-lg appearance-none cursor-pointer focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none hover:border-blue-400 hover:shadow-md"
                >
                  <option value="">-- Chọn loại nhà --</option>
                  {propertyTypes.map((type) => (
                    <option key={type.MaLoai} value={type.MaLoai}>
                      {type.TenLoai}
                    </option>
                  ))}
                </select>

                {/* Animated Chevron */}
                <div className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2">
                  <FaChevronDown className="w-3.5 h-3.5 text-gray-500 transition-all duration-300 ease-out transform group-hover:text-blue-600 group-hover:scale-110 group-focus-within:rotate-180 group-focus-within:text-blue-600 group-focus-within:scale-125" />
                </div>
              </div>
            </div>

            {/* Province - ANIMATED CHEVRON */}
            <div
              className="space-y-1.5 animate-fadeIn"
              style={{ animationDelay: "50ms" }}
            >
              <label className="flex items-center text-xs font-semibold text-gray-700">
                <FaMapMarkerAlt className="mr-1.5 text-blue-600" />
                Tỉnh/Thành phố
              </label>
              <div className="relative group">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-sm font-medium transition-all duration-300 bg-white border-2 border-gray-200 rounded-lg appearance-none cursor-pointer focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none hover:border-blue-400 hover:shadow-md"
                >
                  <option value="">-- Chọn tỉnh/thành phố --</option>
                  {provinces.map((prov) => (
                    <option key={prov.MaTinh} value={prov.MaTinh}>
                      {prov.TenTinh}
                    </option>
                  ))}
                </select>

                {/* Animated Chevron với Bounce */}
                <div className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2">
                  <FaChevronDown className="w-3.5 h-3.5 text-gray-500 transition-all duration-300 ease-out transform group-hover:text-blue-600 group-hover:scale-110 group-hover:animate-bounce group-focus-within:rotate-180 group-focus-within:text-blue-600 group-focus-within:scale-125" />
                </div>
              </div>
            </div>

            {/* District - ANIMATED CHEVRON */}
            <div
              className="space-y-1.5 animate-fadeIn"
              style={{ animationDelay: "100ms" }}
            >
              <label className="flex items-center text-xs font-semibold text-gray-700">
                <FaMapMarkerAlt className="mr-1.5 text-indigo-600" />
                Quận/Huyện
              </label>
              <div className="relative group">
                <select
                  value={searchParams.district}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      district: e.target.value,
                    })
                  }
                  disabled={!selectedProvince || districts.length === 0}
                  className="w-full px-3 py-2 pr-8 text-sm font-medium transition-all duration-300 bg-white border-2 border-gray-200 rounded-lg appearance-none cursor-pointer focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none hover:border-blue-400 hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 disabled:hover:border-gray-200 disabled:hover:shadow-none"
                >
                  <option value="">-- Chọn quận/huyện --</option>
                  {districts.map((dist) => (
                    <option key={dist.MaHuyen} value={dist.MaHuyen}>
                      {dist.TenHuyen}
                    </option>
                  ))}
                </select>

                {/* Animated Chevron với Pulse khi disabled */}
                <div className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2">
                  <FaChevronDown
                    className={`w-3.5 h-3.5 transition-all duration-300 ease-out transform ${
                      !selectedProvince || districts.length === 0
                        ? "text-gray-400 opacity-50"
                        : "text-gray-500 group-hover:text-indigo-600 group-hover:scale-110 group-focus-within:rotate-180 group-focus-within:text-indigo-600 group-focus-within:scale-125"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== ERROR STATE ===== */}
        {error && (
          <div className="flex items-center p-4 mb-8 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md animate-shake">
            <FaExclamationTriangle className="mr-3 text-2xl" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <FaSpinner className="mb-4 text-6xl text-blue-600 animate-spin" />
            <p className="text-xl font-semibold text-gray-700">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : (
          <>
            {currentPrice > 0 && (
              <>
                {/* ===== PRICE SUMMARY CARDS ===== */}
                <div className="grid gap-6 mb-8 md:grid-cols-3">
                  {/* Current Price */}
                  <div className="relative p-6 overflow-hidden transition-all duration-300 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 group rounded-2xl hover:shadow-2xl hover:-translate-y-2 animate-fadeIn">
                    <div className="absolute top-0 right-0 w-32 h-32 transition-transform duration-500 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full opacity-10 group-hover:scale-150"></div>
                    <div className="relative z-10">
                      <p className="mb-2 text-sm font-medium text-blue-100">
                        Giá trung bình hiện tại
                      </p>
                      <div className="flex items-baseline">
                        <span className="text-5xl font-extrabold text-white">
                          {currentPrice}
                        </span>
                        <span className="ml-2 text-xl text-blue-100">
                          triệu/m²
                        </span>
                      </div>
                      <div className="flex items-center mt-4">
                        <FaCheckCircle className="mr-2 text-white" />
                        <span className="text-sm text-blue-100">
                          Dữ liệu cập nhật
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Month Change */}
                  <div
                    className={`relative p-6 overflow-hidden transition-all duration-300 shadow-xl group rounded-2xl hover:shadow-2xl hover:-translate-y-2 animate-fadeIn ${
                      priceChangeMonth >= 0
                        ? "bg-gradient-to-br from-green-500 to-green-600"
                        : "bg-gradient-to-br from-red-500 to-red-600"
                    }`}
                    style={{ animationDelay: "100ms" }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 transition-transform duration-500 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full opacity-10 group-hover:scale-150"></div>
                    <div className="relative z-10">
                      <p className="mb-2 text-sm font-medium text-white opacity-90">
                        So với tháng trước
                      </p>
                      <div className="flex items-center">
                        {priceChangeMonth >= 0 ? (
                          <FaArrowUp className="mr-2 text-3xl text-white animate-bounce" />
                        ) : (
                          <FaArrowDown className="mr-2 text-3xl text-white animate-bounce" />
                        )}
                        <span className="text-5xl font-extrabold text-white">
                          {priceChangeMonth > 0 ? "+" : ""}
                          {priceChangeMonth}%
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-white opacity-90">
                        {priceChangeMonth >= 0
                          ? "Tăng trưởng tích cực"
                          : "Xu hướng giảm"}
                      </p>
                    </div>
                  </div>

                  {/* Year Change */}
                  <div
                    className={`relative p-6 overflow-hidden transition-all duration-300 shadow-xl group rounded-2xl hover:shadow-2xl hover:-translate-y-2 animate-fadeIn ${
                      priceChangeYear >= 0
                        ? "bg-gradient-to-br from-purple-500 to-purple-600"
                        : "bg-gradient-to-br from-orange-500 to-orange-600"
                    }`}
                    style={{ animationDelay: "200ms" }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 transition-transform duration-500 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full opacity-10 group-hover:scale-150"></div>
                    <div className="relative z-10">
                      <p className="mb-2 text-sm font-medium text-white opacity-90">
                        So với năm trước
                      </p>
                      <div className="flex items-center">
                        {priceChangeYear >= 0 ? (
                          <FaArrowUp className="mr-2 text-3xl text-white animate-bounce" />
                        ) : (
                          <FaArrowDown className="mr-2 text-3xl text-white animate-bounce" />
                        )}
                        <span className="text-5xl font-extrabold text-white">
                          {priceChangeYear > 0 ? "+" : ""}
                          {priceChangeYear}%
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-white opacity-90">
                        Biến động dài hạn
                      </p>
                    </div>
                  </div>
                </div>

                {/* ===== PRICE RANGE VISUALIZATION ===== */}
                <div className="p-6 mb-8 transition-all duration-300 bg-white shadow-xl md:p-8 rounded-2xl hover:shadow-2xl animate-fadeIn">
                  <h2 className="mb-6 text-2xl font-bold text-gray-800">
                    Phân tích giá {getSelectedPropertyTypeName()} tại{" "}
                    {getSelectedDistrictName()}
                  </h2>

                  <div className="space-y-6">
                    {/* Price Labels */}
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="px-3 py-1 text-blue-700 bg-blue-100 rounded-full">
                        Thấp nhất: {minPrice} triệu
                      </span>
                      <span className="px-4 py-2 text-lg text-white rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
                        TB: {currentPrice} triệu/m²
                      </span>
                      <span className="px-3 py-1 text-red-700 bg-red-100 rounded-full">
                        Cao nhất: {maxPrice} triệu
                      </span>
                    </div>

                    {/* Price Range Bar */}
                    <div className="relative h-8 overflow-hidden bg-gray-200 rounded-full shadow-inner">
                      <div
                        className="absolute h-full transition-all duration-1000 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-slideInLeft"
                        style={{
                          left: `${(minPrice / Math.max(maxPrice, 1)) * 100}%`,
                          width: `${
                            ((maxPrice - minPrice) / Math.max(maxPrice, 1)) *
                            100
                          }%`,
                        }}
                      ></div>

                      {/* Current Price Indicator */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg animate-pulse"
                        style={{
                          left: `${
                            (currentPrice / Math.max(maxPrice, 1)) * 100
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <div className="w-3 h-3 mr-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                        Khoảng giá thị trường
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 mr-2 bg-white border-2 border-gray-400 rounded-full"></div>
                        Giá trung bình
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== PRICE TREND CHART ===== */}
                {priceData.length > 0 && (
                  <div className="p-6 mb-8 transition-all duration-300 bg-white shadow-xl md:p-8 rounded-2xl hover:shadow-2xl animate-fadeIn">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        Xu hướng giá 12 tháng gần nhất
                      </h2>
                      <div className="px-4 py-2 font-bold text-blue-600 bg-blue-100 rounded-full">
                        {currentPrice} triệu/m²
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <svg viewBox="0 0 1200 350" className="w-full h-auto">
                        {/* Grid Lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="50"
                            y1={50 + i * 60}
                            x2="1150"
                            y2={50 + i * 60}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="5,5"
                          />
                        ))}

                        {/* Gradient Definition */}
                        <defs>
                          <linearGradient
                            id="chartGradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop
                              offset="0%"
                              stopColor="#3b82f6"
                              stopOpacity="0.4"
                            />
                            <stop
                              offset="100%"
                              stopColor="#8b5cf6"
                              stopOpacity="0.1"
                            />
                          </linearGradient>
                        </defs>

                        {/* Area Fill */}
                        <polygon
                          points={`50,290 ${priceData
                            .map((d, i) => {
                              const x = 50 + i * 100;
                              const y =
                                290 -
                                (d.price -
                                  (Math.min(...priceData.map((p) => p.price)) -
                                    2)) *
                                  12;
                              return `${x},${y}`;
                            })
                            .join(" ")} 1150,290`}
                          fill="url(#chartGradient)"
                        />

                        {/* Line Chart */}
                        <polyline
                          points={priceData
                            .map((d, i) => {
                              const x = 50 + i * 100;
                              const y =
                                290 -
                                (d.price -
                                  (Math.min(...priceData.map((p) => p.price)) -
                                    2)) *
                                  12;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke="url(#lineGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <defs>
                          <linearGradient
                            id="lineGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>

                        {/* Data Points */}
                        {priceData.map((d, i) => {
                          const x = 50 + i * 100;
                          const y =
                            290 -
                            (d.price -
                              (Math.min(...priceData.map((p) => p.price)) -
                                2)) *
                              12;
                          return (
                            <g key={i}>
                              ircle cx={x} cy={y} r="5" fill="white"
                              stroke="#3b82f6" strokeWidth="3" /> ircle cx={x}{" "}
                              cy={y} r="3" fill="#3b82f6" />
                            </g>
                          );
                        })}

                        {/* Month Labels */}
                        {priceData.map((d, i) => (
                          <text
                            key={i}
                            x={50 + i * 100}
                            y="320"
                            textAnchor="middle"
                            fontSize="12"
                            fill="#6b7280"
                            fontWeight="600"
                          >
                            {d.month}
                          </text>
                        ))}
                      </svg>
                    </div>
                  </div>
                )}

                {/* ===== REGIONAL COMPARISON ===== */}
                {regionalData.length > 0 && (
                  <div className="p-6 transition-all duration-300 bg-white shadow-xl md:p-8 rounded-2xl hover:shadow-2xl animate-fadeIn">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">
                      So sánh giá theo khu vực
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {regionalData.map((region, idx) => {
                        const difference = region.price - currentPrice;
                        const isHigher = difference > 0;

                        return (
                          <div
                            key={idx}
                            className="relative p-6 overflow-hidden transition-all duration-300 border-2 border-gray-100 group rounded-xl hover:border-blue-300 hover:shadow-xl hover:-translate-y-2 animate-fadeIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 transition-transform duration-500 transform translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 bg-gradient-to-br from-blue-100 to-purple-100 group-hover:scale-150"></div>

                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">
                                  {region.name}
                                </h3>
                                <FaMapMarkerAlt className="text-2xl text-blue-500" />
                              </div>

                              <div className="mb-4">
                                <span className="text-3xl font-extrabold text-blue-600">
                                  {region.price}
                                </span>
                                <span className="ml-2 text-gray-600">
                                  triệu/m²
                                </span>
                              </div>

                              <div
                                className={`flex items-center mb-4 px-3 py-2 rounded-lg ${
                                  isHigher
                                    ? "bg-red-50 text-red-700"
                                    : "bg-green-50 text-green-700"
                                }`}
                              >
                                {isHigher ? (
                                  <FaArrowUp className="mr-2" />
                                ) : (
                                  <FaArrowDown className="mr-2" />
                                )}
                                <span className="text-sm font-semibold">
                                  {isHigher ? "Cao hơn" : "Thấp hơn"}{" "}
                                  {Math.abs(difference).toFixed(1)} triệu/m²
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>{region.minPrice}M</span>
                                  <span>{region.maxPrice}M</span>
                                </div>
                                <div className="relative h-3 overflow-hidden bg-gray-200 rounded-full">
                                  <div
                                    className="absolute h-full transition-all duration-1000 rounded-full animate-slideInLeft"
                                    style={{
                                      width: `${
                                        (region.price /
                                          Math.max(
                                            ...regionalData.map(
                                              (r) => r.maxPrice
                                            ),
                                            maxPrice
                                          )) *
                                        100
                                      }%`,
                                      background: `linear-gradient(to right, ${
                                        idx % 3 === 0
                                          ? "#3b82f6"
                                          : idx % 3 === 1
                                          ? "#8b5cf6"
                                          : "#ec4899"
                                      }, ${
                                        idx % 3 === 0
                                          ? "#60a5fa"
                                          : idx % 3 === 1
                                          ? "#a78bfa"
                                          : "#f472b6"
                                      })`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
