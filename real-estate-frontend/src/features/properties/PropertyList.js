"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaHeart,
  FaRegHeart,
  FaEye,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaFilter,
  FaSort,
  FaCheckCircle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import locationService from "../../services/locationService";
import { API_URL, SERVER_URL } from "../../services/api";
const PropertyList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filterType, setFilterType] = useState("Tất cả");
  const [sortOption, setSortOption] = useState("default");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationNames, setLocationNames] = useState({});
  const propertiesPerPage = 9;

  // Lấy danh sách loại nhà đất từ API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setPropertyTypes(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại nhà đất:", error);
      }
    };

    fetchPropertyTypes();
  }, []);

  // Lấy danh sách bất động sản
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/properties`);
        console.log("Properties data:", response.data.properties);
        // Lấy thông tin địa điểm cho mỗi bài đăng
        const propertiesWithLocations = [...response.data.properties];
        const locationNamesObj = {};

        // Lấy thông tin tỉnh/thành phố
        const provinces = await locationService.getProvinces();

        for (const property of propertiesWithLocations) {
          if (property.MaTinh) {
            // Tìm tên tỉnh
            const province = provinces.find(
              (p) => p.MaTinh === Number.parseInt(property.MaTinh)
            );
            if (province) {
              locationNamesObj[`province_${property.MaTinh}`] =
                province.TenTinh;

              // Lấy thông tin quận/huyện
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

                    // Lấy thông tin phường/xã
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
        setProperties(response.data.properties);
      } catch (err) {
        console.error("Lỗi lấy BĐS:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);
  // Lấy danh sách yêu thích từ localStorage khi component mount
  // useEffect(() => {
  //   const savedFavorites = localStorage.getItem("propertyFavorites")
  //   if (savedFavorites) {
  //     setFavorites(JSON.parse(savedFavorites))
  //   }
  // }, [])

  // // Lưu danh sách yêu thích vào localStorage khi thay đổi
  // useEffect(() => {
  //   localStorage.setItem("propertyFavorites", JSON.stringify(favorites))
  // }, [favorites])

  // Thay thế useEffect cho favorites
  useEffect(() => {
    const checkFavorites = async () => {
      if (!currentUser) return;

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

    if (properties.length > 0) {
      checkFavorites();
    }
  }, [properties, currentUser]);

  // Xử lý toggle yêu thích
  // const toggleFavorite = (id) => {
  //   if (!currentUser) {
  //     navigate("/auth")
  //     return
  //   }
  //   if (favorites.includes(id)) {
  //     setFavorites(favorites.filter((favId) => favId !== id))
  //   } else {
  //     setFavorites([...favorites, id])
  //   }
  // }

  // Cập nhật toggleFavorite function
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

  // Lọc theo loại bất động sản
  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  // Sắp xếp bất động sản
  const handleSortChange = (option) => {
    setSortOption(option);
    setCurrentPage(1);
  };

  // Lấy địa chỉ đầy đủ
  const getFullAddress = (property) => {
    const addressParts = [];

    // Thêm địa chỉ chi tiết
    if (property.DiaChi) {
      addressParts.push(property.DiaChi);
    }

    // Thêm phường/xã
    if (property.MaXa && locationNames[`ward_${property.MaXa}`]) {
      addressParts.push(locationNames[`ward_${property.MaXa}`]);
    }

    // Thêm quận/huyện
    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`]);
    }

    // Thêm tỉnh/thành phố
    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`]);
    }

    return addressParts.join(", ");
  };

  // Xử lý tăng lượt xem và chuyển đến trang chi tiết
  const handleViewDetails = async (id) => {
    try {
      console.log(`Viewing property details for ID: ${id}`);
      // Gọi API tăng lượt xem với ID người dùng (nếu đã đăng nhập)
      await axios.post(`${API_URL}/properties/${id}/view`, {
        viewerId: currentUser?.MaNgDung, // Truyền ID người xem
      });

      // Chuyển đến trang chi tiết
      navigate(`/bat-dong-san/${id}`);
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem:", error);
      // Vẫn chuyển đến trang chi tiết ngay cả khi có lỗi
      navigate(`/bat-dong-san/${id}`);
    }
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
  // Lọc và sắp xếp bất động sản
  const filteredAndSortedProperties = React.useMemo(() => {
    let result = [...properties];
    if (filterType !== "Tất cả") {
      result = result.filter((p) => {
        const type = propertyTypes.find((t) => t.MaLoai === p.MaLoaiND);
        return type?.TenLoai === filterType;
      });
    }

    // Sắp xếp
    switch (sortOption) {
      case "price-asc":
        return result.sort((a, b) => a.Gia - b.Gia);
      case "price-desc":
        return result.sort((a, b) => b.Gia - a.Gia);
      case "area-asc":
        return result.sort((a, b) => a.DienTich - b.DienTich);
      case "area-desc":
        return result.sort((a, b) => b.DienTich - a.DienTich);
      case "views-desc":
        return result.sort((a, b) => b.SoLuotXem - a.SoLuotXem);
      default:
        return result;
    }
  }, [properties, filterType, sortOption, propertyTypes]);

  // Phân trang
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = filteredAndSortedProperties.slice(
    indexOfFirstProperty,
    indexOfLastProperty
  );
  const totalPages = Math.ceil(
    filteredAndSortedProperties.length / propertiesPerPage
  );

  // Lấy tên loại bất động sản
  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND);
    return type ? type.TenLoai : "Không xác định";
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          <p className="text-lg font-bold text-gray-700">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-2 md:flex-row md:items-center md:justify-between animate-fadeInUp">
        <h2 className="text-3xl font-bold text-gray-800">
          Bất động sản nổi bật
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Nút mở bộ lọc */}
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 transition-all duration-300 bg-white border-2 border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-400 hover:shadow-md active:scale-95"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Bộ lọc
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
            <FaSort className="text-gray-500" />
            <select
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="area-asc">Diện tích: Nhỏ đến lớn</option>
              <option value="area-desc">Diện tích: Lớn đến nhỏ</option>
              <option value="views-desc">Lượt xem: Cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* FILTER CHIPS */}
      {showFilters && (
        <div className="overflow-x-auto animate-fadeIn">
          <div className="flex items-center gap-2 py-2 min-w-max">
            <button
              className={`px-4 py-2 rounded-full border 
                text-sm font-bold transition-all duration-200
                ${
                  filterType === "Tất cả"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:shadow"
                }
              `}
              onClick={() => handleFilterChange("Tất cả")}
            >
              Tất cả
            </button>

            {propertyTypes.map((type) => (
              <button
                key={type.MaLoai}
                className={`px-4 py-2 rounded-full border 
                  text-sm font-bold transition-all duration-200
                  ${
                    filterType === type.TenLoai
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:shadow"
                  }
                `}
                onClick={() => handleFilterChange(type.TenLoai)}
              >
                {type.TenLoai}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID LIST – 2 / 3 / 4 / 5 CARD HÀNG */}
      {currentProperties.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {currentProperties.map((property, index) => (
              <div
                key={property.MaTTND}
                className={`flex flex-col h-full overflow-hidden bg-white border border-gray-100 shadow-lg rounded-2xl transition-all duration-500 transform hover:shadow-2xl hover:-translate-y-2 animate-fadeInUp ${
                  property.isFeatured ? "ring-2 ring-orange-400" : ""
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* ẢNH */}
                <div className="relative h-40 overflow-hidden md:h-44 lg:h-48">
                  <img
                    src={
                      property.HinhAnh && property.HinhAnh.length > 0
                        ? `${SERVER_URL}${property.HinhAnh[0]}`
                        : "/placeholder.svg?height=200&width=400"
                    }
                    alt={property.TieuDe}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                    onError={(e) => {
                      console.error(
                        `Error loading image for property ${property.MaTTND}`
                      );
                      e.target.src = "/placeholder.svg?height=200&width=400";
                    }}
                  />

                  {/* Nút yêu thích */}
                  <button
                    className="absolute flex items-center justify-center text-sm transition-transform bg-white rounded-full shadow-lg w-9 h-9 top-3 right-3 hover:scale-110"
                    onClick={() => toggleFavorite(property.MaTTND)}
                    aria-label={
                      favorites.includes(property.MaTTND)
                        ? "Xóa khỏi yêu thích"
                        : "Thêm vào yêu thích"
                    }
                  >
                    {favorites.includes(property.MaTTND) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-gray-600" />
                    )}
                  </button>

                  {/* Badge xác thực / nổi bật / trạng thái */}
                  {property.TrangThaiXacThuc === "đã xác thực" && (
                    <div className="absolute flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full shadow-md top-3 left-3">
                      <FaCheckCircle className="text-xs" />
                      Đã xác thực
                    </div>
                  )}

                  {property.isFeatured && (
                    <span className="absolute px-2 py-1 text-xs font-bold text-white rounded-full shadow-md bg-gradient-to-r from-orange-500 to-red-500 bottom-3 left-3">
                      Nổi bật
                    </span>
                  )}

                  <span className="absolute px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded-full shadow-md bottom-3 right-3">
                    {property.TrangThai}
                  </span>
                </div>

                {/* NỘI DUNG CARD */}
                <div className="flex flex-col flex-1 p-4">
                  {/* Tiêu đề + địa chỉ – chiều cao cố định để đồng đều */}
                  <div className="mb-3 space-y-2 min-h-[80px] md:min-h-[90px]">
                    <h3 className="text-base font-bold text-gray-800 transition-colors line-clamp-2 hover:text-blue-600">
                      {property.TieuDe}
                    </h3>
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="flex-shrink-0 text-red-500" />
                      <span className="line-clamp-1">
                        {getFullAddress(property)}
                      </span>
                    </p>
                  </div>

                  {/* Giá + diện tích – vạch kẻ luôn cố định */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                    <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      {formatPrice(property.Gia)}
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

                  {/* Nút xem chi tiết luôn sát đáy card */}
                  <button
                    className="mt-auto w-full px-4 py-2.5 text-sm font-bold text-white rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                    onClick={() => handleViewDetails(property.MaTTND)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &laquo; Trước
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 text-sm font-bold rounded-lg transition-all ${
                        currentPage === page
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-110"
                          : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-blue-500"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau &raquo;
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-gray-600">
            Không tìm thấy bất động sản phù hợp với bộ lọc.
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
