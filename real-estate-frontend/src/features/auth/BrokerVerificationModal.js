"use client";

import React, { useState } from "react";
import {
  FaTimes,
  FaIdCard,
  FaUpload,
  FaCheckCircle,
  FaInfoCircle,
  FaUser,
} from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../services/api";

const BrokerVerificationModal = ({ isOpen, onClose, onSuccess }) => {
  const [soCCCD, setSoCCCD] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);

  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleFrontChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontImage(file);
      setFrontPreview(URL.createObjectURL(file));
      setErrorMessage("");
    }
  };

  const handleBackChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackImage(file);
      setBackPreview(URL.createObjectURL(file));
      setErrorMessage("");
    }
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfieImage(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!frontImage || !backImage) {
      setErrorMessage("Vui lòng tải lên cả 2 mặt của CMND/CCCD (mặt trước và mặt sau)!");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("soCCCD", soCCCD.trim());
      formData.append("anhCCCDMatTruoc", frontImage);
      formData.append("anhCCCDMatSau", backImage);
      if (selfieImage) {
        formData.append("anhChanDung", selfieImage);
      }

      await axios.post(`${API_URL}/broker-verification/request`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (typeof onSuccess === "function") {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Lỗi gửi hồ sơ xác minh:", err);
      setErrorMessage(
        err.response?.data?.message || "Không thể gửi hồ sơ xác minh. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <FaIdCard className="text-base text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Xác minh danh tính Môi giới</h3>
              <p className="text-[11px] text-blue-100">
                Gửi ảnh CMND/CCCD để nhận huy hiệu "Môi giới đã xác minh ✅"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Hướng dẫn */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900">
            <FaInfoCircle className="text-base text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <p className="font-bold">Lợi ích sau khi xác minh:</p>
              <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-blue-800">
                <li>Tất cả tin đăng bất động sản của bạn sẽ có huy hiệu <b>✅ Môi giới đã xác minh</b>.</li>
                <li>Tạo niềm tin vững chắc, tăng tỷ lệ khách hàng gọi điện và liên hệ giao dịch.</li>
                <li>Thông tin giấy tờ chỉ dùng để thẩm định và được bảo mật tuyệt đối.</li>
              </ul>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Nhập số CCCD */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Số CMND / CCCD (Tùy chọn):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 07920100xxxx"
              value={soCCCD}
              onChange={(e) => setSoCCCD(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Grid upload 3 ảnh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Mặt trước */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col">
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>1. Mặt trước <span className="text-rose-500">*</span></span>
              </label>

              <label className="flex-1 min-h-[140px] border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white flex flex-col items-center justify-center p-2 cursor-pointer transition-colors relative overflow-hidden">
                {frontPreview ? (
                  <img
                    src={frontPreview}
                    alt="CCCD mặt trước"
                    className="w-full h-full object-contain absolute inset-0"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <FaUpload className="text-xl mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] font-medium block">Tải ảnh mặt trước</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrontChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* 2. Mặt sau */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col">
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>2. Mặt sau <span className="text-rose-500">*</span></span>
              </label>

              <label className="flex-1 min-h-[140px] border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white flex flex-col items-center justify-center p-2 cursor-pointer transition-colors relative overflow-hidden">
                {backPreview ? (
                  <img
                    src={backPreview}
                    alt="CCCD mặt sau"
                    className="w-full h-full object-contain absolute inset-0"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <FaUpload className="text-xl mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] font-medium block">Tải ảnh mặt sau</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* 3. Chân dung */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col">
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>3. Cầm CCCD</span>
                <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
              </label>

              <label className="flex-1 min-h-[140px] border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white flex flex-col items-center justify-center p-2 cursor-pointer transition-colors relative overflow-hidden">
                {selfiePreview ? (
                  <img
                    src={selfiePreview}
                    alt="Ảnh chân dung"
                    className="w-full h-full object-contain absolute inset-0"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <FaUser className="text-xl mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] font-medium block">Ảnh chụp chân dung</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic text-center">
            * Định dạng hỗ trợ: JPG, PNG, WEBP. Ảnh cần rõ nét, không bị lóa sáng hay mất góc.
          </p>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>Gửi hồ sơ xác minh</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrokerVerificationModal;
