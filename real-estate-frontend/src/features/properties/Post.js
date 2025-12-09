"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaPlus,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaEye,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaCheckCircle,
  FaSearch,
  FaEnvelopeOpenText,
  FaChartLine,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import locationService from "../../services/locationService";
import VerificationModal from "../auth/VerificationModal";
import { API_URL, SERVER_URL } from "../../services/api";

const Post = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [locationNames, setLocationNames] = useState({});
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryStats, setSummaryStats] = useState(null);

  // Lấy dữ liệu thống kê hoạt động tóm tắt của môi giới
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${API_URL}/broker-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && res.data?.data?.summary) {
          setSummaryStats(res.data.data.summary);
        }
      } catch (e) {
        console.warn("Không thể tải thống kê tóm tắt:", e.message);
      }
    };
    fetchAnalytics();
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
    }
  }, [navigate, currentUser]);

  // Lấy danh sách loại nhà đất
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPropertyTypes(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại nhà đất:", error);
      }
    };

    fetchPropertyTypes();
  }, []);

  // Lấy danh sách bài đăng của người dùng
  useEffect(() => {
    const fetchUserProperties = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth");
          return;
        }

        const response = await axios.get(`${API_URL}/properties/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProperties(response.data);
        setFilteredProperties(response.data);

        // Lấy thông tin địa điểm cho mỗi bài đăng
        const propertiesWithLocations = [...response.data];
        const locationNamesObj = {};

        const provinces = await locationService.getProvinces();

        for (const property of propertiesWithLocations) {
          if (property.MaTinh) {
            const province = provinces.find(
              (p) => p.MaTinh === Number.parseInt(property.MaTinh)
            );
            if (province) {
              locationNamesObj[`province_${property.MaTinh}`] =
                province.TenTinh;

              if (property.MaHuyen) {
                try {
                  const districts = await locationService.getDistricts(
                    property.MaTinh
                  );
                  const district = districts.find(
                    (d) => d.MaHuyen === Number.parseInt(property.MaHuyen)
                  );
                  if (district) {
                    locationNamesObj[`district_${property.MaHuyen}`] =
                      district.TenHuyen;

                    if (property.MaXa) {
                      try {
                        const wards = await locationService.getWards(
                          property.MaHuyen
                        );
                        const ward = wards.find(
                          (w) => w.MaXa === Number.parseInt(property.MaXa)
                        );
                        if (ward) {
                          locationNamesObj[`ward_${property.MaXa}`] =
                            ward.TenXa;
                        }
                      } catch (error) {
                        console.error(
                          "Lỗi khi lấy thông tin phường/xã:",
                          error
                        );
                      }
                    }
                  }
                } catch (error) {
                  console.error("Lỗi khi lấy thông tin quận/huyện:", error);
                }
              }
            }
          }
        }

        setLocationNames(locationNamesObj);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bài đăng:", error);
        if (error.response) {
          setError(
            error.response.status === 404
              ? "Không tìm thấy bài đăng."
              : "Lỗi server. Vui lòng thử lại sau."
          );
        } else if (error.request) {
          setError(
            "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
          );
        } else {
          setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
        }
        setLoading(false);
      }
    };

    fetchUserProperties();
  }, [navigate]);

  // ✅ Xử lý tìm kiếm
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProperties(properties);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = properties.filter((property) => {
        const title = property.TieuDe?.toLowerCase() || "";
        const address = getFullAddress(property).toLowerCase();
        const typeName = getPropertyTypeName(property.MaLoaiND).toLowerCase();

        return (
          title.includes(query) ||
          address.includes(query) ||
          typeName.includes(query)
        );
      });
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties]);

  // Xử lý hiển thị menu
  const toggleMenu = (id) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  // Xử lý xóa bài đăng
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/properties/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProperties((prev) => prev.filter((p) => p.MaTTND !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Lỗi khi xóa bài đăng:", error);
      alert("Không thể xóa bài đăng. Vui lòng thử lại sau.");
    }
  };

  // Xử lý chỉnh sửa bài đăng
  const handleEdit = (id) => {
    navigate(`/sua-bai/${id}`);
  };

  // Xử lý xem chi tiết bài đăng
  const handleView = (id) => {
    navigate(`/bat-dong-san/${id}`);
  };

  // Xử lý xác thực
  const handleVerification = (id) => {
    setSelectedPropertyId(id);
    setShowVerificationModal(true);
    setActiveMenu(null);
  };

  // Định dạng giá tiền
  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ";
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu";
    }
    return price.toLocaleString() + " VNĐ";
  };

  // Lấy địa chỉ đầy đủ
  const getFullAddress = (property) => {
    const addressParts = [];

    if (property.DiaChi) {
      addressParts.push(property.DiaChi);
    }

    if (property.MaXa && locationNames[`ward_${property.MaXa}`]) {
      addressParts.push(locationNames[`ward_${property.MaXa}`]);
    }

    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`]);
    }

    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`]);
    }

    return addressParts.join(", ");
  };

  // Lấy tên loại bất động sản
  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND);
    return type ? type.TenLoai : "Không xác định";
  };

  // Badge xác thực (dùng Tailwind)
  const getVerificationBadge = (status) => {
    if (status === "đã xác thực") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold border rounded-full text-emerald-700 bg-emerald-50 border-emerald-200">
          <FaCheckCircle className="text-emerald-500" />
          Đã xác thực
        </span>
      );
    }
    if (status === "chờ xác thực") {
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-bold border rounded-full text-amber-700 bg-amber-50 border-amber-200">
          Chờ xác thực
        </span>
      );
    }
    if (status === "từ chối") {
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-red-700 border border-red-200 rounded-full bg-red-50">
          Từ chối
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          <p className="text-lg font-bold text-slate-700">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-md p-6 text-center bg-white shadow-lg rounded-2xl">
          <p className="mb-4 text-base font-bold text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 pt-20 bg-gradient-to-b from-slate-100 to-indigo-100/40">
      <div className="px-4 mx-auto max-w-screen-2xl">
        {/* ✅ Header mới: Thanh tìm kiếm + Nút đăng tin */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, địa chỉ, loại BĐS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-4 text-sm font-medium transition-all border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute -translate-y-1/2 text-slate-400 hover:text-slate-600 right-4 top-1/2"
              >
                ✕
              </button>
            )}
          </div>

          {/* Nút Thống kê, Yêu cầu liên hệ & Nút đăng tin mới */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/thong-ke"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-indigo-700 bg-white border-2 border-indigo-200 rounded-xl shadow-xs hover:bg-indigo-50 hover:border-indigo-400 transition-all whitespace-nowrap"
            >
              <FaChartLine className="text-base text-indigo-600" />
              <span>Xem thống kê</span>
            </Link>

            <Link
              to="/quan-ly-khach-hang"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-blue-700 bg-white border-2 border-blue-200 rounded-xl shadow-xs hover:bg-blue-50 hover:border-blue-400 transition-all whitespace-nowrap"
            >
              <FaEnvelopeOpenText className="text-base text-blue-600" />
              <span>Khách quan tâm</span>
            </Link>

            <Link
              to="/dang-bai"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap"
            >
              <FaPlus className="text-base" />
              Đăng tin mới
            </Link>
          </div>
        </div>

        {/* ✅ WIDGET THỐNG KÊ HOẠT ĐỘNG (THEO MẪU YÊU CẦU) */}
        {summaryStats && (
          <div className="p-5 mb-6 bg-white border border-slate-200/90 shadow-2xs rounded-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <h2 className="text-xs font-black tracking-wider uppercase sm:text-sm text-slate-800">
                  THỐNG KÊ HOẠT ĐỘNG
                </h2>
              </div>
              <Link
                to="/thong-ke"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>Xem phân tích chi tiết</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Tổng lượt xem
                  </div>
                  <div className="mt-0.5 text-2xl font-black text-slate-900">
                    {summaryStats.tongLuotXem.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="flex items-center justify-center text-sm text-blue-600 bg-blue-100 rounded-lg w-9 h-9">
                  <FaEye />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Tổng lượt liên hệ
                  </div>
                  <div className="mt-0.5 text-2xl font-black text-emerald-600">
                    {summaryStats.tongLuotLienHe.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="flex items-center justify-center text-sm text-emerald-600 bg-emerald-100 rounded-lg w-9 h-9">
                  <FaEnvelopeOpenText />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Tin đang hoạt động
                  </div>
                  <div className="mt-0.5 text-2xl font-black text-indigo-600">
                    {summaryStats.tinDangHoatDong.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="flex items-center justify-center text-sm text-indigo-600 bg-indigo-100 rounded-lg w-9 h-9">
                  <FaCheckCircle />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Không có bài đăng */}
        {properties.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="max-w-md p-8 text-center bg-white shadow-xl rounded-2xl">
              <p className="mb-3 text-lg font-bold text-slate-800">
                Bạn chưa có bài đăng nào.
              </p>
              <p className="mb-6 text-sm text-slate-600">
                Đăng tin ngay để tiếp cận nhiều khách hàng hơn.
              </p>
              <Link
                to="/dang-bai"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold text-white rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <FaPlus />
                Đăng tin ngay
              </Link>
            </div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="max-w-md p-8 text-center bg-white shadow-xl rounded-2xl">
              <p className="mb-3 text-lg font-bold text-slate-800">
                Không tìm thấy bài đăng nào phù hợp
              </p>
              <p className="mb-6 text-sm text-slate-600">
                Thử tìm kiếm với từ khóa khác
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold text-white shadow-md rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Xóa tìm kiếm
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProperties.map((property, index) => (
              <div
                key={property.MaTTND}
                className="relative flex flex-col overflow-hidden transition-all duration-500 transform bg-white shadow-lg rounded-2xl group hover:shadow-2xl hover:-translate-y-2"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Ảnh */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={
                      property.HinhAnh && property.HinhAnh.length > 0
                        ? `${SERVER_URL}${property.HinhAnh[0]}`
                        : "/placeholder.svg?height=200&width=400"
                    }
                    alt={property.TieuDe}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      console.error(
                        `Error loading image for property ${property.MaTTND}`
                      );
                      e.target.src = "/placeholder.svg?height=200&width=400";
                    }}
                  />
                  <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100" />

                  {/* Badge trạng thái */}
                  <span className="absolute px-3 py-0.5 text-xs font-bold text-white rounded-full shadow-md bg-blue-600/90 bottom-3 right-3">
                    {property.TrangThai || "Đang đăng"}
                  </span>

                  {/* Badge đã xác thực */}
                  {property.TrangThaiXacThuc === "đã xác thực" && (
                    <div className="absolute flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-white rounded-full shadow-md bg-emerald-500 top-3 left-3">
                      <FaCheckCircle />
                      Xác thực
                    </div>
                  )}

                  {/* Nút menu 3 chấm */}
                  <button
                    onClick={() => toggleMenu(property.MaTTND)}
                    className="absolute flex items-center justify-center w-8 h-8 transition-transform bg-white rounded-full shadow-lg text-slate-600 top-3 right-3 hover:bg-slate-100 hover:scale-105 active:scale-95"
                  >
                    <FaEllipsisV className="text-xs" />
                  </button>

                  {/* Menu actions */}
                  {activeMenu === property.MaTTND && (
                    <div className="absolute z-20 w-40 py-2 text-sm bg-white border shadow-xl border-slate-100 rounded-xl top-12 right-3">
                      <button
                        className="flex items-center w-full gap-2 px-3 py-2 font-bold text-left text-slate-700 hover:bg-slate-50"
                        onClick={() => handleEdit(property.MaTTND)}
                      >
                        <FaEdit className="text-blue-500" />
                        Chỉnh sửa
                      </button>
                      <button
                        className="flex items-center w-full gap-2 px-3 py-2 font-bold text-left text-slate-700 hover:bg-slate-50"
                        onClick={() => handleVerification(property.MaTTND)}
                      >
                        <FaCheckCircle className="text-emerald-500" />
                        Xác thực
                      </button>
                      <button
                        className="flex items-center w-full gap-2 px-3 py-2 font-bold text-left text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(property.MaTTND)}
                      >
                        <FaTrash />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                {/* Nội dung */}
                <div className="flex flex-col flex-1 p-3">
                  {/* Tiêu đề + địa chỉ */}
                  <div className="mb-2 space-y-1 min-h-[65px]">
                    <h3 className="text-sm font-bold transition-colors text-slate-900 line-clamp-2 group-hover:text-blue-600">
                      {property.TieuDe}
                    </h3>
                    <p className="flex items-center gap-1 text-xs font-bold text-slate-600">
                      <FaMapMarkerAlt className="flex-shrink-0 text-red-500" />
                      <span className="line-clamp-1">
                        {getFullAddress(property)}
                      </span>
                    </p>
                  </div>

                  {/* Giá + diện tích */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      {formatPrice(property.Gia)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                      <FaRulerCombined className="text-slate-500" />
                      {property.DienTich} m²
                    </span>
                  </div>

                  {/* Loại BĐS + lượt xem */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-lg text-slate-700 bg-slate-100">
                      {getPropertyTypeName(property.MaLoaiND)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <FaEye className="text-slate-400" />
                      {property.SoLuotXem || 0}
                    </span>
                  </div>

                  {/* Badge trạng thái xác thực */}
                  <div className="mb-3">
                    {getVerificationBadge(property.TrangThaiXacThuc)}
                  </div>

                  {/* Nút xem chi tiết */}
                  <button
                    onClick={() => handleView(property.MaTTND)}
                    className="w-full px-4 py-2 mt-auto text-xs font-bold text-white transition-all transform shadow-md rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    Xem chi tiết
                  </button>
                </div>

                {/* Overlay xác nhận xóa */}
                {confirmDelete === property.MaTTND && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
                    <div className="w-[90%] max-w-xs p-4 text-center bg-white rounded-2xl shadow-xl">
                      <p className="mb-4 text-sm font-bold text-slate-800">
                        Bạn có chắc chắn muốn xóa bài đăng này?
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleDelete(property.MaTTND)}
                          className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                          Có
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-4 py-2 text-sm font-bold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
                        >
                          Không
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal xác thực */}
      {showVerificationModal && (
        <VerificationModal
          propertyId={selectedPropertyId}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedPropertyId(null);
          }}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Post;
