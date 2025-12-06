"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaHome,
  FaStar,
  FaCheckCircle,
  FaChartLine,
  FaAward,
  FaRulerCombined,
  FaShareAlt,
} from "react-icons/fa";
import { API_URL, SERVER_URL } from "../../services/api";

const formatPrice = (price) => {
  if (!price) return "Liên hệ";
  if (price >= 1000000000) {
    return (price / 1000000000).toFixed(1) + " tỷ";
  } else if (price >= 1000000) {
    return (price / 1000000).toFixed(0) + " triệu";
  }
  return price.toLocaleString() + " VNĐ";
};

const formatDate = (dateString) => {
  if (!dateString) return "Chưa xác định";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Chưa xác định";
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return "Chưa xác định";
  }
};

const BrokerProfile = () => {
  const { id } = useParams();
  const [broker, setBroker] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchBrokerData = async () => {
      try {
        setLoading(true);

        let brokerData = null;

        try {
          const brokerResponse = await axios.get(`${API_URL}/users/${id}`, {
            timeout: 5000,
          });

          if (
            brokerResponse.data &&
            Object.keys(brokerResponse.data).length > 0
          ) {
            brokerData = brokerResponse.data;
          }
        } catch (apiError) {
          console.warn(
            "[BrokerProfile] API /users/{id} failed:",
            apiError.message
          );
        }

        if (!brokerData) {
          try {
            const allUsersResponse = await axios.get(`${API_URL}/users`, {
              timeout: 5000,
            });

            const users = Array.isArray(allUsersResponse.data)
              ? allUsersResponse.data
              : allUsersResponse.data.users || [];

            brokerData = users.find(
              (u) => u.MaNgDung === id || u.MaNgDung === Number.parseInt(id)
            );
          } catch (error) {
            console.warn(
              "[BrokerProfile] Fallback /users failed:",
              error.message
            );
          }
        }

        if (!brokerData) {
          throw new Error(`Không thể lấy thông tin người bán có ID: ${id}`);
        }

        setBroker(brokerData);

        let allProperties = [];
        try {
          const propertiesResponse = await axios.get(
            `${API_URL}/properties?MaNgDung=${id}`,
            {
              timeout: 5000,
            }
          );
          if (Array.isArray(propertiesResponse.data)) {
            allProperties = propertiesResponse.data;
          } else if (
            propertiesResponse.data?.data &&
            Array.isArray(propertiesResponse.data.data)
          ) {
            allProperties = propertiesResponse.data.data;
          } else if (
            propertiesResponse.data?.properties &&
            Array.isArray(propertiesResponse.data.properties)
          ) {
            allProperties = propertiesResponse.data.properties;
          } else {
            allProperties = [];
          }
        } catch (err) {
          try {
            const allPropsResponse = await axios.get(`${API_URL}/properties`, {
              timeout: 5000,
            });
            if (Array.isArray(allPropsResponse.data)) {
              allProperties = allPropsResponse.data;
            } else if (
              allPropsResponse.data?.data &&
              Array.isArray(allPropsResponse.data.data)
            ) {
              allProperties = allPropsResponse.data.data;
            } else if (
              allPropsResponse.data?.properties &&
              Array.isArray(allPropsResponse.data.properties)
            ) {
              allProperties = allPropsResponse.data.properties;
            } else {
              allProperties = [];
            }
          } catch (error) {
            allProperties = [];
          }
        }

        const filteredProperties = Array.isArray(allProperties)
          ? allProperties.filter((p) => {
              const propertyMaNgDung = String(p.MaNgDung || p.MaGiaoDich || "");
              const sellerId = String(id);
              return (
                propertyMaNgDung === sellerId ||
                propertyMaNgDung === String(Number.parseInt(id))
              );
            })
          : [];

        setProperties(filteredProperties);
        setError(null);
      } catch (err) {
        console.error("[BrokerProfile] Error fetching broker data:", err);
        setError(
          err.message ||
            "Không thể lấy thông tin môi giới. Vui lòng thử lại sau."
        );
        setBroker(null);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBrokerData();
    }
  }, [id]);

  // Share handlers
  const handleShare = () => setShowShareModal(true);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Đang tải thông tin môi giới...</p>
        </div>
      </div>
    );
  }

  if (error || !broker) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">😞</div>
          <p className="mb-2 text-xl font-bold text-gray-900">
            Không tìm thấy thông tin môi giới
          </p>
          <p className="mb-4 text-gray-600">{error || `ID: ${id}`}</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  let yearsActive = "N/A";
  let joinedDate = "Chưa xác định";

  if (properties.length > 0) {
    const oldestProperty = properties.reduce((oldest, current) => {
      if (!oldest || !current.NgayTao) return oldest;
      const oldestDate = new Date(oldest.NgayTao).getTime();
      const currentDate = new Date(current.NgayTao).getTime();
      return currentDate < oldestDate ? current : oldest;
    });

    if (oldestProperty?.NgayTao) {
      try {
        const date = new Date(oldestProperty.NgayTao);
        if (!isNaN(date.getTime())) {
          joinedDate = formatDate(oldestProperty.NgayTao);
          const now = new Date();
          const yearsDiff = now.getFullYear() - date.getFullYear();
          if (yearsDiff > 0) {
            yearsActive = yearsDiff.toString();
          } else {
            yearsActive = "< 1";
          }
        }
      } catch (e) {
        console.log("[BrokerProfile] Error parsing oldest property date:", e);
      }
    }
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      {/* Hero Section - Cover + Avatar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-48 h-48 -mt-24 -mr-24 bg-white rounded-full opacity-5"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 -mb-16 -ml-16 bg-white rounded-full opacity-5"></div>

        <div className="relative px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-end">
            {/* Avatar */}
            <div className="relative transition-transform duration-500 group hover:scale-105 animate-fadeInUp">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-xl opacity-40 animate-pulse"></div>
              <img
                src={
                  broker.Avatar ||
                  broker.AnhDaiDien ||
                  "/placeholder.svg?height=150&width=150"
                }
                alt={broker.HoTen || "Broker"}
                className="relative object-cover w-20 h-20 transition-all duration-300 border-4 border-white rounded-full shadow-2xl md:w-28 md:h-28 group-hover:shadow-blue-500/50"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=150&width=150";
                }}
              />
              {/* Verified Badge */}
              {broker.TrangThaiXacThuc === "đã xác thực" && (
                <div className="absolute flex items-center justify-center w-10 h-10 bg-green-500 border-4 border-white rounded-full shadow-lg bottom-2 right-2">
                  <FaCheckCircle className="text-lg text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left animate-fadeInUp animation-delay-200">
              <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
                {broker.HoTen || broker.Email || "Không xác định"}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-4 md:justify-start">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-blue-100 rounded-full bg-white/20 backdrop-blur-sm">
                  <FaAward className="text-yellow-300" />
                  {broker.LoaiTaiKhoan || "Môi giới"}
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-blue-100 rounded-full bg-white/20 backdrop-blur-sm">
                  <FaCalendarAlt />
                  Tham gia từ {joinedDate}
                </span>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-blue-100 md:justify-start">
                {broker.Email && (
                  <a
                    href={`mailto:${broker.Email}`}
                    className="flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <FaEnvelope /> {broker.Email}
                  </a>
                )}
                {(broker.SDT || broker.SoDienThoai) && (
                  <a
                    href={`tel:${broker.SDT || broker.SoDienThoai}`}
                    className="flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <FaPhone /> {broker.SDT || broker.SoDienThoai}
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 animate-fadeInUp animation-delay-400">
              <button
                onClick={handleShare}
                className="flex items-center justify-center w-12 h-12 text-white transition-all duration-300 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-110"
                title="Chia sẻ"
              >
                <FaShareAlt />
              </button>
              <a
                href={`tel:${broker.SDT || broker.SoDienThoai}`}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-blue-600 transition-all duration-300 bg-white shadow-lg rounded-xl hover:bg-gray-50 hover:scale-105 hover:shadow-xl"
              >
                <FaPhone /> Liên hệ
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mx-auto mt-6 max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 animate-fadeInUp animation-delay-400">
          {/* Years Active */}
          <div className="p-4 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-2xl hover:scale-105 group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center flex-shrink-0 transition-transform w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:scale-110">
                <FaChartLine className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Năm hoạt động
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {yearsActive}
                </p>
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="p-4 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-2xl hover:scale-105 group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center flex-shrink-0 transition-transform w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 group-hover:scale-110">
                <FaHome className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tin đăng</p>
                <p className="text-3xl font-bold text-gray-900">
                  {properties.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Properties Section */}
        <div className="mb-12 animate-fadeInUp animation-delay-600">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Bất động sản đã đăng
              </h2>
              <p className="font-medium text-gray-600">
                {properties.length} tin đăng đang hoạt động
              </p>
            </div>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((property, index) => {
                const firstImage =
                  property.HinhAnh && property.HinhAnh.length > 0
                    ? property.HinhAnh[0]
                    : null;
                const imageUrl = firstImage
                  ? `${SERVER_URL}${firstImage}`
                  : "/placeholder.svg?height=200&width=300";

                return (
                  <Link
                    key={property.MaTTND}
                    to={`/bat-dong-san/${property.MaTTND}`}
                    className="overflow-hidden transition-all duration-300 bg-white shadow-lg group rounded-xl hover:shadow-2xl hover:scale-105 animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden aspect-video">
                      <img
                        src={imageUrl}
                        alt={property.TieuDe || "Bất động sản"}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src =
                            "/placeholder.svg?height=200&width=300";
                        }}
                      />
                      <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100"></div>

                      {/* Badge */}
                      {property.TrangThai && (
                        <div className="absolute px-3 py-1 text-xs font-bold text-white rounded-full top-3 left-3 bg-gradient-to-r from-blue-600 to-indigo-600">
                          {property.TrangThai}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="mb-2 text-base font-bold text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600">
                        {property.TieuDe || "Chưa có tên"}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        <FaRulerCombined className="text-sm text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {property.DienTich || "N/A"} m²
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-lg font-bold text-red-600">
                          {formatPrice(property.Gia)}
                        </span>
                        <span className="text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-700">
                          Xem chi tiết →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white shadow-lg rounded-xl">
              <div className="mb-4 text-6xl">📭</div>
              <p className="mb-2 text-xl font-bold text-gray-900">
                Chưa có bất động sản nào
              </p>
              <p className="text-gray-600">
                Môi giới chưa đăng tin nào trong hệ thống
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-md p-6 m-4 bg-white shadow-2xl rounded-xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Chia sẻ hồ sơ</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 mb-4 rounded-lg bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all ${
                    copySuccess
                      ? "bg-green-500"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {copySuccess ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerProfile;
