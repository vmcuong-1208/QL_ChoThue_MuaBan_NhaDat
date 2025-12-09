"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaExclamationTriangle,
  FaFlag,
  FaCheckCircle,
  FaShieldAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { API_URL } from "../../../services/api";

const REPORT_REASONS = [
  "Thông tin sai sự thật",
  "Giá bán không chính xác",
  "Tin đăng trùng lặp",
  "Bất động sản không còn giao dịch",
  "Hình ảnh không đúng thực tế",
  "Có dấu hiệu lừa đảo",
  "Nội dung không phù hợp",
  "Khác",
];

const ReportListingModal = ({
  isOpen,
  onClose,
  property,
  currentUser = null,
  onSuccess = null,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Khởi tạo thông tin người báo cáo từ user đăng nhập nếu có
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.HoTen || "");
      setPhone(currentUser.SDT || "");
      setEmail(currentUser.Email || "");
    } else {
      setFullName("");
      setPhone("");
      setEmail("");
    }
    setSelectedReason(REPORT_REASONS[0]);
    setDescription("");
    setErrorMessage("");
    setIsSuccess(false);
  }, [currentUser, isOpen]);

  if (!isOpen || !property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedReason) {
      setErrorMessage("Vui lòng chọn lý do báo cáo tin sai phạm.");
      return;
    }

    if (!fullName.trim() && !currentUser) {
      setErrorMessage("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    if (!phone.trim() && !currentUser) {
      setErrorMessage("Vui lòng nhập số điện thoại để chúng tôi liên hệ xác minh khi cần.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await axios.post(
        `${API_URL}/property-reports`,
        {
          MaTTND: property.MaTTND,
          LyDo: selectedReason,
          MoTaChiTiet: description.trim(),
          HoTen: fullName.trim() || currentUser?.HoTen,
          SoDienThoai: phone.trim() || currentUser?.SDT,
          Email: email.trim() || currentUser?.Email,
        },
        { headers }
      );

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Lỗi khi gửi báo cáo tin sai phạm:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "Không thể gửi báo cáo vào lúc này. Vui lòng thử lại sau."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
              <FaFlag className="text-white text-base" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Báo cáo tin đăng sai phạm
              </h3>
              <p className="text-xs text-red-100 font-medium mt-0.5">
                Mã tin: #{property.MaTTND} • {property.TieuDe?.slice(0, 40)}...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
              <FaCheckCircle />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-800">
                Đã gửi báo cáo thành công!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Cảm ơn bạn đã phản hồi. Ban Quản trị sẽ tiến hành kiểm tra, xác minh
                với môi giới và xử lý tin đăng vi phạm trong thời gian sớm nhất.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Thông tin tin đăng tóm tắt */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="truncate mr-2">
                <span className="font-semibold text-slate-800">Tin đăng:</span>{" "}
                {property.TieuDe}
              </div>
              <span className="font-bold text-red-600 flex-shrink-0">
                #{property.MaTTND}
              </span>
            </div>

            {/* Chọn lý do vi phạm */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Lý do báo cáo vi phạm <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === reason
                        ? "border-red-500 bg-red-50/50 text-red-900 font-semibold shadow-xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="leading-tight">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mô tả chi tiết */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mô tả chi tiết vi phạm (nếu có)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Hình ảnh ngôi nhà không đúng với địa chỉ thực tế, giá hiển thị là 1 tỷ nhưng khi gọi hỏi môi giới báo 3 tỷ..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder-slate-400 text-slate-800"
              />
            </div>

            {/* Thông tin người gửi báo cáo */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FaShieldAlt className="text-slate-400" />
                <span>Thông tin người gửi báo cáo</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Bảo mật tuyệt đối)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Họ và tên *"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (không bắt buộc)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800"
                />
              </div>
            </div>

            {/* Cam kết / Quy định */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 leading-relaxed">
              <FaInfoCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
              <span>
                Báo cáo của bạn sẽ được gửi thẳng đến Ban Quản trị để đối chiếu và
                xử lý gỡ tin hoặc khóa tài khoản vi phạm theo đúng quy chế kiểm duyệt.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <FaFlag className="text-[10px]" />
                <span>{submitting ? "Đang gửi báo cáo..." : "Gửi báo cáo vi phạm"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportListingModal;
