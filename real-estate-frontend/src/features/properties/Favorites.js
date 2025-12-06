"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaRegHeart,
  FaEye,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaTrash,
  FaEdit,
  FaStickyNote,
  FaArrowLeft,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import locationService from "../../services/locationService";
import { API_URL, SERVER_URL } from "../../services/api";

const Favorites = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [locationNames, setLocationNames] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const favoritesPerPage = 12;

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
    }
  }, [currentUser, navigate]);

  const fetchFavorites = async (page = 1) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/favorites?page=${page}&limit=${favoritesPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFavorites(response.data.favorites);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(response.data.pagination.page);

      await fetchLocationNames(response.data.favorites);

      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu thích:", error);
      setError("Không thể tải danh sách yêu thích. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  const fetchLocationNames = async (favoritesList) => {
    try {
      const locationNamesObj = {};
      const provinces = await locationService.getProvinces();

      for (const favorite of favoritesList) {
        if (favorite.MaTinh) {
          const province = provinces.find(
            (p) => p.MaTinh === Number.parseInt(favorite.MaTinh)
          );
          if (province) {
            locationNamesObj[`province_${favorite.MaTinh}`] = province.TenTinh;

            if (favorite.MaHuyen) {
              try {
                const districts = await locationService.getDistricts(
                  favorite.MaTinh
                );
                const district = districts.find(
                  (d) => d.MaHuyen === Number.parseInt(favorite.MaHuyen)
                );
                if (district) {
                  locationNamesObj[`district_${favorite.MaHuyen}`] =
                    district.TenHuyen;

                  if (favorite.MaXa) {
                    try {
                      const wards = await locationService.getWards(
                        favorite.MaHuyen
                      );
                      const ward = wards.find(
                        (w) => w.MaXa === Number.parseInt(favorite.MaXa)
                      );
                      if (ward) {
                        locationNamesObj[`ward_${favorite.MaXa}`] = ward.TenXa;
                      }
                    } catch (error) {
                      console.error("Lỗi khi lấy thông tin phường/xã:", error);
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
    } catch (error) {
      console.error("Lỗi khi lấy thông tin địa điểm:", error);
    }
  };

  useEffect(() => {
    fetchFavorites(currentPage);
  }, [currentUser, currentPage]);

  const handleRemoveFavorite = async (propertyId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa bất động sản này khỏi danh sách yêu thích?"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/favorites/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFavorites((prev) => prev.filter((fav) => fav.MaTTND !== propertyId));

      if (favorites.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchFavorites(currentPage);
      }
    } catch (error) {
      console.error("Lỗi khi xóa khỏi yêu thích:", error);
      alert("Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại.");
    }
  };

  const handleUpdateNote = async (propertyId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/favorites/${propertyId}`,
        { GhiChu: noteText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFavorites((prev) =>
        prev.map((fav) =>
          fav.MaTTND === propertyId ? { ...fav, GhiChu: noteText } : fav
        )
      );

      setEditingNote(null);
      setNoteText("");
    } catch (error) {
      console.error("Lỗi khi cập nhật ghi chú:", error);
      alert("Không thể cập nhật ghi chú. Vui lòng thử lại.");
    }
  };

  const startEditingNote = (favorite) => {
    setEditingNote(favorite.MaTTND);
    setNoteText(favorite.GhiChu || "");
  };

  const cancelEditingNote = () => {
    setEditingNote(null);
    setNoteText("");
  };

  const handleViewDetails = async (propertyId) => {
    try {
      await axios.post(`${API_URL}/properties/${propertyId}/view`, {
        viewerId: currentUser?.MaNgDung,
      });
      navigate(`/bat-dong-san/${propertyId}`);
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem:", error);
      navigate(`/bat-dong-san/${propertyId}`);
    }
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
    const parts = [];
    if (property.DiaChi) parts.push(property.DiaChi);
    if (property.MaXa && locationNames[`ward_${property.MaXa}`])
      parts.push(locationNames[`ward_${property.MaXa}`]);
    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`])
      parts.push(locationNames[`district_${property.MaHuyen}`]);
    if (property.MaTinh && locationNames[`province_${property.MaTinh}`])
      parts.push(locationNames[`province_${property.MaTinh}`]);
    return parts.join(", ");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-100 to-indigo-100/40">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-xl font-bold text-gray-700">
            Đang tải danh sách yêu thích...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-100 to-indigo-100/40">
        <div className="p-6 bg-white shadow-xl rounded-2xl">
          <p className="mb-4 text-lg font-semibold text-red-600">{error}</p>
          <button
            onClick={() => fetchFavorites(currentPage)}
            className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pt-20 bg-gradient-to-b from-slate-100 to-indigo-100/40">
      <div className="max-w-screen-xl px-4 mx-auto">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
              Bất động sản yêu thích
            </h1>
            <p className="text-lg font-semibold text-gray-600">
              Bạn đã lưu{" "}
              <span className="font-bold text-blue-600">
                {favorites.length}
              </span>{" "}
              bất động sản
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="py-20 text-center">
            <div className="max-w-md p-8 mx-auto bg-white shadow-xl rounded-2xl">
              <FaRegHeart className="mx-auto mb-4 text-5xl text-blue-500 animate-pulse" />
              <h3 className="mb-3 text-2xl font-extrabold text-gray-900">
                Chưa có bất động sản yêu thích
              </h3>
              <p className="mb-6 text-lg font-semibold text-gray-600">
                Hãy khám phá và thêm những bất động sản bạn quan tâm vào danh
                sách yêu thích.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-3 text-lg font-extrabold text-white transition-all duration-500 transform shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 hover:shadow-xl"
              >
                Khám phá bất động sản
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Grid cards giống SearchResults: 1–2–3–5 cột */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {favorites.map((favorite, index) => (
                <div
                  key={favorite.MaTTND}
                  className="flex flex-col h-full overflow-hidden transition-all duration-500 transform bg-white shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2 group"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden h-44">
                    <img
                      src={
                        favorite.HinhAnh && favorite.HinhAnh.length > 0
                          ? `${SERVER_URL}${favorite.HinhAnh[0]}`
                          : "/placeholder.svg?height=200&width=400"
                      }
                      alt={favorite.TieuDe}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=200&width=400";
                      }}
                    />
                    <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100"></div>

                    {/* Xoá khỏi yêu thích */}
                    <button
                      className="absolute flex items-center justify-center text-sm text-white transition-transform duration-300 bg-red-500 rounded-full shadow-md w-9 h-9 top-3 right-3 hover:bg-red-600 hover:scale-110"
                      title="Xóa khỏi yêu thích"
                      onClick={() => handleRemoveFavorite(favorite.MaTTND)}
                    >
                      <FaTrash />
                    </button>

                    <span className="absolute px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-full shadow-lg bottom-3 right-3">
                      {favorite.TrangThai}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-4">
                    <div className="mb-3 space-y-2 min-h-[90px]">
                      <h3 className="text-base font-bold text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600">
                        {favorite.TieuDe}
                      </h3>

                      <p className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        <FaMapMarkerAlt className="flex-shrink-0 text-red-500" />
                        <span className="line-clamp-1">
                          {getFullAddress(favorite)}
                        </span>
                      </p>
                    </div>

                    {/* Price + Area */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                      <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        {formatPrice(favorite.Gia)}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold text-gray-700">
                        <FaRulerCombined className="text-gray-500" />
                        {favorite.DienTich} m²
                      </span>
                    </div>

                    {/* Type + views */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="px-2 py-1 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg">
                        {favorite.LoaiBDS || "Không xác định"}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-600">
                        <FaEye className="text-gray-400" />
                        {favorite.SoLuotXem || 0}
                      </span>
                    </div>

                    {/* Date added */}
                    <div className="mb-2 text-xs text-gray-500">
                      Đã thêm:{" "}
                      <span className="font-bold">
                        {formatDate(favorite.NgayYeuThich)}
                      </span>
                    </div>

                    {/* Note section */}
                    <div className="mb-3">
                      {editingNote === favorite.MaTTND ? (
                        <div className="p-2 border border-blue-200 rounded-lg bg-blue-50">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Thêm ghi chú..."
                            rows={2}
                            className="w-full text-xs border-none resize-none bg-blue-50 focus:outline-none focus:ring-0"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => handleUpdateNote(favorite.MaTTND)}
                              className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={cancelEditingNote}
                              className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex-1 text-xs text-gray-700">
                            {favorite.GhiChu ? (
                              <p className="flex items-start gap-1">
                                <FaStickyNote className="mt-[2px] text-yellow-400" />
                                <span className="line-clamp-2">
                                  {favorite.GhiChu}
                                </span>
                              </p>
                            ) : (
                              <div className="mb-3 min-h-[88px]">
                                <p className="italic text-gray-400">
                                  Chưa có ghi chú
                                </p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => startEditingNote(favorite)}
                            className="flex items-center justify-center text-xs text-blue-600 bg-white border border-blue-200 rounded-full w-7 h-7 hover:bg-blue-50"
                            title="Chỉnh sửa ghi chú"
                          >
                            <FaEdit />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Button aligned bottom */}
                    <button
                      onClick={() => handleViewDetails(favorite.MaTTND)}
                      className="w-full px-4 py-2 mt-auto text-sm font-bold text-white transition-all duration-500 transform shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 hover:shadow-xl"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination giống SearchResults */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 text-sm font-bold rounded-xl transition-all ${
                          currentPage === page
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110"
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
                  className="px-6 py-3 text-base font-bold text-gray-700 transition-all bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;
