"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaHeart,
  FaRegHeart,
  FaEye,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaLightbulb,
  FaCheckCircle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import locationService from "../../services/locationService";
import { API_URL, SERVER_URL } from "../../services/api";

const Recommendations = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationNames, setLocationNames] = useState({});
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [reason, setReason] = useState("");

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

  // Lấy gợi ý bất động sản
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        if (currentUser) {
          // Nếu đã đăng nhập, lấy gợi ý cá nhân hóa
          const token = localStorage.getItem("token");
          const response = await axios.get(`${API_URL}/recommendations`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setRecommendations(response.data.recommendations || []);
          setReason(response.data.reason || "Gợi ý cho bạn");
        } else {
          // Nếu chưa đăng nhập, lấy bài đăng phổ biến
          const response = await axios.get(
            `${API_URL}/properties?limit=20&sort=views-desc`
          );
          setRecommendations(response.data.properties || []);
          setReason("Bất động sản phổ biến");
        }

        // Lấy thông tin địa điểm
        await fetchLocationNames(recommendations);
      } catch (err) {
        console.error("Lỗi lấy gợi ý:", err);
        // Fallback: lấy bài đăng mới nhất
        try {
          const response = await axios.get(`${API_URL}/properties?limit=20`);
          setRecommendations(response.data.properties || []);
          setReason("Bất động sản mới nhất");
        } catch (fallbackError) {
          console.error("Lỗi fallback:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser]);

  // Lấy thông tin địa điểm
  const fetchLocationNames = async (properties) => {
    try {
      const locationNamesObj = {};
      const provinces = await locationService.getProvinces();

      for (const property of properties) {
        if (property.MaTinh) {
          const province = provinces.find(
            (p) => p.MaTinh === Number.parseInt(property.MaTinh)
          );
          if (province) {
            locationNamesObj[`province_${property.MaTinh}`] = province.TenTinh;

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
                }
              } catch (error) {
                console.error("Lỗi khi lấy thông tin quận/huyện:", error);
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

  // Lấy trạng thái yêu thích
  useEffect(() => {
    const checkFavorites = async () => {
      if (!currentUser || recommendations.length === 0) return;

      const token = localStorage.getItem("token");
      const favoriteStatuses = {};

      for (const property of recommendations) {
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
  }, [recommendations, currentUser]);

  // Xử lý toggle yêu thích
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

  // Xử lý xem chi tiết
  const handleViewDetails = async (id) => {
    try {
      console.log(`Viewing property details for ID: ${id}`);
      // Tăng lượt xem
      await axios.post(`${API_URL}/properties/${id}/view`, {
        viewerId: currentUser?.MaNgDung,
      });

      navigate(`/bat-dong-san/${id}`);
    } catch (error) {
      console.error("Lỗi khi xử lý xem chi tiết:", error);
      navigate(`/bat-dong-san/${id}`);
    }
  };

  // Utility functions
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

  if (loading) {
    return <div className="loading-container">Đang tải gợi ý...</div>;
  }

  return (
    <section className="py-10 bg-white">
      <div className="max-w-6xl px-4 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FaLightbulb className="text-3xl text-yellow-400 animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Bất động sản được gợi ý
              </h2>
              <p className="text-sm font-bold text-gray-600">{reason}</p>
            </div>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {recommendations.map((property, index) => (
              <div
                key={property.MaTTND}
                className="flex flex-col h-full overflow-hidden transition-all duration-500 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2 group animate-fadeInUp"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Ảnh + trạng thái + yêu thích */}
                <div className="relative h-40 overflow-hidden md:h-44 lg:h-48">
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
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100"></div>

                  {property.TrangThaiXacThuc === "đã xác thực" && (
                    <div className="absolute flex items-center gap-1 px-2 py-1 text-xs font-bold text-white bg-green-500 rounded-full shadow-lg top-3 left-3">
                      <FaCheckCircle />
                      Đã xác thực
                    </div>
                  )}

                  {property.score && property.score > 3 && (
                    <div className="absolute px-2 py-1 text-xs font-bold text-yellow-100 bg-yellow-500 rounded-full shadow-lg bottom-3 left-3">
                      Phù hợp
                    </div>
                  )}

                  <button
                    className="absolute flex items-center justify-center w-8 h-8 text-sm transition-transform bg-white rounded-full shadow-lg top-3 right-3 hover:scale-110"
                    onClick={() => toggleFavorite(property.MaTTND)}
                  >
                    {favorites.includes(property.MaTTND) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-gray-600" />
                    )}
                  </button>

                  <span className="absolute px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded-full shadow-lg bottom-3 right-3">
                    {property.TrangThai}
                  </span>
                </div>

                {/* Nội dung */}
                <div className="flex flex-col flex-1 p-4">
                  <div className="mb-3 space-y-2 min-h-[80px] md:min-h-[90px]">
                    <h3 className="text-sm font-bold text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600">
                      {property.TieuDe}
                    </h3>
                    <p className="flex items-center gap-2 text-xs text-gray-600">
                      <FaMapMarkerAlt className="flex-shrink-0 text-red-500" />
                      <span className="line-clamp-1">
                        {getFullAddress(property)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                    <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      {formatPrice(property.Gia)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                      <FaRulerCombined className="text-gray-500" />
                      {property.DienTich} m²
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="px-2 py-1 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg">
                      {getPropertyTypeName(property.MaLoaiND)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                      <FaEye className="text-gray-400" />
                      {property.SoLuotXem || 0}
                    </span>
                  </div>

                  <button
                    className="w-full px-4 py-2 mt-auto text-xs font-bold text-white transition-all duration-300 transform rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 active:scale-95 hover:shadow-lg"
                    onClick={() => handleViewDetails(property.MaTTND)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-600">
            Không có gợi ý nào phù hợp lúc này.
          </div>
        )}
      </div>
    </section>
  );
};

export default Recommendations;
