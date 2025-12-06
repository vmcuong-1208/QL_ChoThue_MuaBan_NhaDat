"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaUpload,
  FaCheckCircle,
  FaFileAlt,
  FaVideo,
  FaFileContract,
} from "react-icons/fa";
import { API_URL } from "../../services/api";

const VerificationModal = ({ propertyId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    camKetCapNhatDinhKy: false,
    ghiChuNguoiBan: "",
  });

  const [files, setFiles] = useState({
    fileSoDo: [],
    videoXacThuc: null,
    fileGiayXacNhan: [],
    fileQuyHoach: [],
  });

  const [loading, setLoading] = useState(false);
  const [existingData, setExistingData] = useState(null);

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/verification/${propertyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.thongTinXacThuc) {
          const data = response.data.thongTinXacThuc;
          setFormData({
            camKetCapNhatDinhKy: data.CamKetCapNhatDinhKy,
            ghiChuNguoiBan: data.GhiChuNguoiBan || "",
          });
          setExistingData(data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin xác thực:", error);
      }
    };

    fetchExistingData();
  }, [propertyId]);

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;

    if (
      name === "fileSoDo" ||
      name === "fileGiayXacNhan" ||
      name === "fileQuyHoach"
    ) {
      setFiles((prev) => ({
        ...prev,
        [name]: Array.from(selectedFiles),
      }));
    } else if (name === "videoXacThuc") {
      setFiles((prev) => ({
        ...prev,
        videoXacThuc: selectedFiles[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      files.fileSoDo.forEach((file) => {
        submitData.append("fileSoDo", file);
      });

      files.fileGiayXacNhan.forEach((file) => {
        submitData.append("fileGiayXacNhan", file);
      });

      files.fileQuyHoach.forEach((file) => {
        submitData.append("fileQuyHoach", file);
      });

      if (files.videoXacThuc) {
        submitData.append("videoXacThuc", files.videoXacThuc);
      }

      await axios.post(`${API_URL}/verification/${propertyId}`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Gửi yêu cầu xác thực thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu xác thực:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay với fade-in */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        {/* Modal Container với slide-up và scale-in */}
        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white shadow-2xl rounded-2xl animate-slideInUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Gradient giống Home.js */}
          <div className="sticky top-0 z-10 px-6 py-5 border-b border-blue-200 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg animate-bounce">
                  <FaCheckCircle className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Xác thực bất động sản
                  </h2>
                  <p className="text-sm font-medium text-blue-100">
                    Cung cấp tài liệu để xác minh tính chính xác
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 text-white transition-all duration-300 bg-white/20 rounded-xl hover:bg-white/30 hover:rotate-90 hover:scale-110 active:scale-95"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          {/* Form Content - Scrollable */}
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto max-h-[calc(90vh-180px)]"
          >
            <div className="p-6 space-y-6">
              {/* Section 1: Tài liệu cần thiết */}
              <div className="p-5 transition-all duration-300 border-2 border-blue-100 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 hover:shadow-lg hover:border-blue-200 animate-fadeInUp">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                    <FaFileAlt className="text-lg text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Tài liệu cần thiết
                    </h3>
                    <p className="text-sm font-medium text-gray-600">
                      Vui lòng cung cấp đầy đủ tài liệu để xác thực
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* File Sổ đỏ */}
                  <div className="p-4 transition-all duration-300 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md group">
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FaUpload className="text-blue-600" />
                        Bản chụp sổ đỏ/sổ hồng
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          name="fileSoDo"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="fileSoDo"
                          required={!existingData}
                        />
                        <label
                          htmlFor="fileSoDo"
                          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold text-blue-600 transition-all duration-300 border-2 border-blue-300 border-dashed cursor-pointer rounded-xl hover:bg-blue-50 hover:border-blue-500 hover:scale-105 active:scale-95"
                        >
                          <FaUpload />
                          Chọn file ảnh (tối đa 5 file)
                        </label>
                      </div>
                    </label>
                    {files.fileSoDo.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {files.fileSoDo.map((file, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-xs font-bold text-blue-700 transition-all duration-300 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 animate-scaleIn"
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video xác thực */}
                  <div className="p-4 transition-all duration-300 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md group">
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FaVideo className="text-purple-600" />
                        Video xác thực bất động sản
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          name="videoXacThuc"
                          accept="video/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="videoXacThuc"
                          required={!existingData}
                        />
                        <label
                          htmlFor="videoXacThuc"
                          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold text-purple-600 transition-all duration-300 border-2 border-purple-300 border-dashed cursor-pointer rounded-xl hover:bg-purple-50 hover:border-purple-500 hover:scale-105 active:scale-95"
                        >
                          <FaVideo />
                          Chọn video (quay toàn cảnh BĐS)
                        </label>
                      </div>
                      <p className="mt-2 text-xs font-medium text-gray-500">
                        Video quay toàn bộ BĐS cùng giọng đọc mô tả, ảnh GPS,
                        quay mặt tiền, đường đi
                      </p>
                    </label>
                    {files.videoXacThuc && (
                      <div className="flex items-center gap-2 p-2 mt-3 transition-all duration-300 border border-purple-200 bg-purple-50 rounded-xl animate-scaleIn">
                        <FaVideo className="text-purple-600" />
                        <span className="text-xs font-bold text-purple-700">
                          {files.videoXacThuc.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Giấy xác nhận */}
                  <div className="p-4 transition-all duration-300 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-md group">
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FaFileContract className="text-green-600" />
                        Giấy xác nhận không tranh chấp
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          name="fileGiayXacNhan"
                          multiple
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="fileGiayXacNhan"
                        />
                        <label
                          htmlFor="fileGiayXacNhan"
                          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold text-green-600 transition-all duration-300 border-2 border-green-300 border-dashed cursor-pointer rounded-xl hover:bg-green-50 hover:border-green-500 hover:scale-105 active:scale-95"
                        >
                          <FaUpload />
                          Chọn file (tối đa 3 file)
                        </label>
                      </div>
                      <p className="mt-2 text-xs font-medium text-gray-500">
                        Giấy xác nhận hoặc cam kết từ người sở hữu
                      </p>
                    </label>
                    {files.fileGiayXacNhan.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {files.fileGiayXacNhan.map((file, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-xs font-bold text-green-700 transition-all duration-300 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 animate-scaleIn"
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* File quy hoạch */}
                  <div className="p-4 transition-all duration-300 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md group">
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FaFileAlt className="text-amber-600" />
                        Thông tin quy hoạch
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          name="fileQuyHoach"
                          multiple
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="fileQuyHoach"
                        />
                        <label
                          htmlFor="fileQuyHoach"
                          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold transition-all duration-300 border-2 border-dashed cursor-pointer text-amber-600 border-amber-300 rounded-xl hover:bg-amber-50 hover:border-amber-500 hover:scale-105 active:scale-95"
                        >
                          <FaUpload />
                          Chọn file (tối đa 3 file)
                        </label>
                      </div>
                      <p className="mt-2 text-xs font-medium text-gray-500">
                        Trích lục thông tin quy hoạch từ địa phương
                      </p>
                    </label>
                    {files.fileQuyHoach.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {files.fileQuyHoach.map((file, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-xs font-bold border rounded-lg text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 animate-scaleIn"
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Cam kết */}
              <div
                className="p-5 transition-all duration-300 border-2 rounded-xl bg-gradient-to-br from-emerald-50/50 to-green-50/50 border-emerald-100 hover:shadow-lg hover:border-emerald-200 animate-fadeInUp"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600">
                    <FaCheckCircle className="text-lg text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Cam kết từ người đăng
                  </h3>
                </div>

                <label className="flex items-start gap-3 p-4 transition-all duration-300 bg-white border-2 border-gray-200 cursor-pointer rounded-xl hover:border-emerald-400 hover:shadow-md group">
                  <div className="relative flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      name="camKetCapNhatDinhKy"
                      checked={formData.camKetCapNhatDinhKy}
                      onChange={handleInputChange}
                      required
                      className="w-5 h-5 text-blue-600 transition-all border-2 border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 hover:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">
                      Tôi cam kết cập nhật trạng thái định kỳ và chịu trách
                      nhiệm về tính chính xác của thông tin
                      <span className="ml-1 text-red-500">*</span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Bao gồm cập nhật giá, tình trạng pháp lý và thông tin liên
                      quan
                    </p>
                  </div>
                </label>
              </div>

              {/* Section 3: Ghi chú */}
              <div
                className="p-5 transition-all duration-300 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 hover:shadow-lg hover:border-gray-300 animate-fadeInUp"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-slate-600">
                    <FaFileAlt className="text-lg text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Ghi chú bổ sung
                  </h3>
                </div>

                <textarea
                  name="ghiChuNguoiBan"
                  value={formData.ghiChuNguoiBan}
                  onChange={handleInputChange}
                  placeholder="Thêm ghi chú hoặc thông tin bổ sung (tùy chọn)..."
                  className="w-full px-4 py-3 text-sm font-medium transition-all duration-300 border-2 border-gray-200 resize-none rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-300"
                  rows="4"
                />
              </div>

              {/* Existing Status - Nếu có */}
              {existingData && (
                <div
                  className="p-5 transition-all duration-300 border-2 rounded-xl animate-fadeInUp border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                  style={{ animationDelay: "300ms" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500">
                      <FaCheckCircle className="text-lg text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-2 text-lg font-bold text-gray-800">
                        Trạng thái hiện tại
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-700">
                          <span className="text-gray-600">Trạng thái:</span>{" "}
                          <span
                            className={`px-3 py-1 rounded-lg text-white ${
                              existingData.TrangThaiXacThuc === "đã xác thực"
                                ? "bg-emerald-500"
                                : existingData.TrangThaiXacThuc ===
                                  "chờ xác thực"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                          >
                            {existingData.TrangThaiXacThuc}
                          </span>
                        </p>
                        {existingData.GhiChuAdmin && (
                          <div className="p-3 border-l-4 rounded-lg bg-white/70 border-amber-500">
                            <p className="text-sm font-bold text-gray-700">
                              <span className="text-amber-600">
                                Ghi chú từ admin:
                              </span>
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-600">
                              {existingData.GhiChuAdmin}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Footer - Sticky buttons */}
          <div className="sticky bottom-0 z-10 flex gap-3 px-6 py-4 border-t border-gray-200 shadow-lg bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 hover:scale-105 active:scale-95"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 text-sm font-bold text-white transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                "Gửi yêu cầu xác thực"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerificationModal;
