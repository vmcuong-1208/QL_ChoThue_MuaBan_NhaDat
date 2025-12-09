"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaPaperPlane,
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCommentDots,
  FaCheckCircle,
  FaShieldAlt,
  FaBuilding,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { API_URL, SERVER_URL } from "../../../services/api";

const QUICK_SUGGESTIONS = [
  "Tôi muốn xem nhà vào cuối tuần",
  "Tôi muốn thương lượng thêm về giá",
  "Cần tư vấn thủ tục pháp lý & sổ đỏ",
  "Gửi thêm hình ảnh và video thực tế giúp tôi",
  "Bất động sản này còn không?",
];

const ContactRequestModal = ({
  isOpen,
  onClose,
  property,
  seller,
  currentUser,
  formatPrice,
}) => {
  const [formData, setFormData] = useState({
    HoTen: "",
    SoDienThoai: "",
    Email: "",
    NoiDung: "Tôi muốn xem nhà vào cuối tuần.",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tự động điền thông tin nếu user đã đăng nhập
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        HoTen: currentUser.HoTen || currentUser.TenDangNhap || "",
        SoDienThoai: currentUser.SDT || "",
        Email: currentUser.Email || "",
      }));
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.HoTen.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên của bạn!");
      return;
    }
    if (!formData.SoDienThoai.trim()) {
      setErrorMsg("Vui lòng nhập số điện thoại để môi giới liên hệ!");
      return;
    }
    if (!formData.NoiDung.trim()) {
      setErrorMsg("Vui lòng nhập nội dung bạn cần tư vấn!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(
        `${API_URL}/contact-requests`,
        {
          MaTTND: property.MaTTND,
          HoTen: formData.HoTen,
          SoDienThoai: formData.SoDienThoai,
          Email: formData.Email || null,
          NoiDung: formData.NoiDung,
          MaNgGui: currentUser?.MaNgDung || null,
        },
        { headers }
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Lỗi gửi yêu cầu liên hệ:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      NoiDung: suggestion,
    }));
  };

  const firstImage =
    property.HinhAnh && property.HinhAnh.length > 0
      ? property.HinhAnh[0]
      : null;
  const imageUrl = firstImage
    ? firstImage.startsWith("http")
      ? firstImage
      : `${SERVER_URL}${firstImage}`
    : "/placeholder.svg?height=100&width=140";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-scaleIn max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <FaPaperPlane className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Gửi yêu cầu liên hệ & tư vấn
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Môi giới phụ trách sẽ chủ động liên hệ tư vấn trực tiếp cho bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors text-sm"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Thông báo thành công */}
          {success ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                <FaCheckCircle />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Gửi yêu cầu liên hệ thành công!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Hệ thống đã chuyển thông tin của bạn đến môi giới{" "}
                <strong>{seller?.HoTen || "phụ trách"}</strong>. Môi giới sẽ sớm gọi
                hoặc nhắn tin trao đổi với bạn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Bất động sản đang quan tâm */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-200">
                  <img
                    src={imageUrl}
                    alt={property.TieuDe}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.svg?height=100&width=140";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-0.5">
                    <span>Mã tin: BDS{property.MaTTND}</span>
                    <span>&bull;</span>
                    <span className="text-blue-600">{property.LoaiBDS || "BĐS"}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={property.TieuDe}>
                    {property.TieuDe}
                  </h4>
                  <div className="text-xs font-extrabold text-red-600 mt-0.5">
                    {formatPrice ? formatPrice(property.Gia) : `${property.Gia} VNĐ`}
                    {property.DienTich && (
                      <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                        &bull; {property.DienTich} m²
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Thông tin Môi giới phụ trách */}
              <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={seller?.AnhDaiDien || "/placeholder.svg?height=40&width=40"}
                    alt={seller?.HoTen || "Môi giới"}
                    className="w-9 h-9 rounded-full object-cover border border-blue-200"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=40&width=40";
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium">
                      Môi giới phụ trách tin đăng
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {seller?.HoTen || "Chuyên viên tư vấn"}
                    </div>
                  </div>
                </div>
                {seller?.TrangThaiXacMinhMoiGioi === "VERIFIED" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FaCheckCircle className="text-[9px]" /> Đã xác minh
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {seller?.LoaiTaiKhoan || "Môi giới"}
                  </span>
                )}
              </div>

              {/* Thông báo lỗi nếu có */}
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {errorMsg}
                </div>
              )}

              {/* Nhập Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên của bạn *
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={formData.HoTen}
                    onChange={(e) =>
                      setFormData({ ...formData, HoTen: e.target.value })
                    }
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Nhập SĐT & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <div className="relative">
                    <FaPhoneAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912345678"
                      value={formData.SoDienThoai}
                      onChange={(e) =>
                        setFormData({ ...formData, SoDienThoai: e.target.value })
                      }
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email nhận thông tin (tùy chọn)
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.Email}
                      onChange={(e) =>
                        setFormData({ ...formData, Email: e.target.value })
                      }
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Gợi ý nhu cầu tư vấn nhanh */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Chọn nhanh nội dung tư vấn:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((sug, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectSuggestion(sug)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                        formData.NoiDung === sug
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nội dung yêu cầu chi tiết */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung yêu cầu chi tiết *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập thời gian bạn rảnh để xem nhà, thắc mắc về giá cả, giấy tờ pháp lý..."
                  value={formData.NoiDung}
                  onChange={(e) =>
                    setFormData({ ...formData, NoiDung: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none leading-relaxed"
                />
              </div>

              {/* Cam kết an toàn & bảo mật */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <FaShieldAlt className="text-emerald-600 flex-shrink-0" />
                <span>
                  Thông tin của bạn được bảo mật tuyệt đối, chỉ phục vụ mục đích tư vấn bất động sản.
                </span>
              </div>

              {/* Nút Submit */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <FaPaperPlane className="text-[11px]" />
                  <span>{loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu tư vấn"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactRequestModal;
