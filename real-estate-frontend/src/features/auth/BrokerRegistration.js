"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaIdCard,
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaShieldAlt,
  FaUserTie,
  FaChartLine,
  FaUsers,
  FaBullhorn,
  FaCamera,
  FaArrowRight,
  FaRedo,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { API_URL, SERVER_URL } from "../../services/api";
import PaymentModal from "../payment/PaymentModal";

const BrokerRegistration = () => {
  const { currentUser, loadUserInfo } = useAuth();
  const navigate = useNavigate();

  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [soCCCD, setSoCCCD] = useState("");
  const [sdtLienHe, setSdtLienHe] = useState("");
  const [khuVucHoatDong, setKhuVucHoatDong] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);

  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/broker-verification/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setVerificationData(response.data);
      }
    } catch (err) {
      console.error("Lỗi lấy trạng thái xác minh:", err);
      setError(err.response?.data?.message || "Không thể tải trạng thái xác minh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    if (currentUser) {
      if (currentUser.SDT && !sdtLienHe) setSdtLienHe(currentUser.SDT);
      if (currentUser.KhuVucChuyenMon && !khuVucHoatDong) setKhuVucHoatDong(currentUser.KhuVucChuyenMon);
    }
  }, [fetchStatus, currentUser]);

  const handleFrontChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontImage(file);
      setFrontPreview(URL.createObjectURL(file));
      setFormError("");
    }
  };

  const handleBackChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackImage(file);
      setBackPreview(URL.createObjectURL(file));
      setFormError("");
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
    setFormError("");

    if (!soCCCD.trim()) {
      setFormError("Vui lòng nhập số CMND / CCCD!");
      return;
    }

    if (!/^\d{9,12}$/.test(soCCCD.trim())) {
      setFormError("Số CMND/CCCD phải gồm từ 9 đến 12 chữ số hợp lệ!");
      return;
    }

    if (!sdtLienHe.trim()) {
      setFormError("Vui lòng nhập số điện thoại liên hệ của bạn!");
      return;
    }

    if (!frontImage || !backImage) {
      setFormError("Vui lòng tải lên cả 2 mặt của CMND/CCCD (mặt trước và mặt sau)!");
      return;
    }

    if (!selfieImage) {
      setFormError("Vui lòng tải lên ảnh chân dung cá nhân!");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("soCCCD", soCCCD.trim());
      formData.append("sdtLienHe", sdtLienHe.trim());
      formData.append("khuVucHoatDong", khuVucHoatDong.trim());
      formData.append("anhCCCDMatTruoc", frontImage);
      formData.append("anhCCCDMatSau", backImage);
      formData.append("anhChanDung", selfieImage);

      await axios.post(`${API_URL}/broker-verification/request`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Hồ sơ đã được ghi nhận! Vui lòng tiến hành thanh toán phí nâng cấp tài khoản.");
      setIsResubmitting(false);
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Lỗi gửi hồ sơ xác minh:", err);
      setFormError(
        err.response?.data?.message || "Không thể gửi hồ sơ xác minh. Vui lòng thử lại!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Xác định trạng thái hiển thị
  // 1. CHUA_GUI (Chưa gửi)
  // 2. CHO_DUYET (Chờ duyệt / PENDING)
  // 3. DA_XAC_MINH (Đã xác minh / VERIFIED)
  // 4. BI_TU_CHOI (Bị từ chối / REJECTED)
  const userStatus = verificationData?.userStatus || "CHUA_XAC_MINH";
  const record = verificationData?.latestRecord;
  const status = record?.TrangThai || userStatus;

  const isBrokerAlready =
    (currentUser?.LoaiTaiKhoan || "").toLowerCase().includes("môi") ||
    (currentUser?.LoaiTaiKhoan || "").toLowerCase().includes("broker");

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Breadcrumb */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-2xl font-bold">
                💼
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  Đăng ký làm môi giới bất động sản
                </h1>
                <p className="text-sm md:text-base text-slate-500 mt-1">
                  Nâng cấp tài khoản để đăng tin không giới hạn, kết nối khách hàng tiềm năng và tối đa hóa doanh thu
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải thông tin xác minh...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <FaExclamationTriangle className="mx-auto text-3xl mb-2 text-red-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchStatus}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* TRẠNG THÁI: ĐÃ XÁC MINH (VERIFIED hoặc ĐÃ LÀ MÔI GIỚI) */}
            {(status === "VERIFIED" || isBrokerAlready) && !isResubmitting && (
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 backdrop-blur-xs">
                    <FaCheckCircle className="text-white" />
                  </div>
                  <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 mb-2">
                    Trạng thái: Đã xác minh
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold">
                    Chúc mừng! Bạn đã là Môi giới chính thức
                  </h2>
                  <p className="text-emerald-100 max-w-xl mx-auto mt-2 text-sm md:text-base">
                    Hồ sơ định danh của bạn đã được kiểm duyệt thành công. Bạn hiện có đầy đủ các quyền hạn quản lý tin đăng, chăm sóc khách hàng và xem thống kê kinh doanh.
                  </p>
                </div>

                <div className="p-8">
                  <h3 className="font-bold text-slate-900 text-lg mb-4 text-center">
                    Bắt đầu khai thác các tính năng dành cho Môi giới
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                      to="/quan-ly-bai-dang"
                      className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition text-center group"
                    >
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto text-xl mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                        📝
                      </div>
                      <h4 className="font-bold text-slate-900">Quản lý bài đăng</h4>
                      <p className="text-xs text-slate-500 mt-1">Đăng và chỉnh sửa tin bất động sản</p>
                    </Link>

                    <Link
                      to="/quan-ly-khach-hang"
                      className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition text-center group"
                    >
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto text-xl mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                        👥
                      </div>
                      <h4 className="font-bold text-slate-900">Khách hàng quan tâm</h4>
                      <p className="text-xs text-slate-500 mt-1">Xem và chăm sóc danh sách liên hệ</p>
                    </Link>

                    <Link
                      to="/thong-ke"
                      className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition text-center group"
                    >
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto text-xl mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
                        📊
                      </div>
                      <h4 className="font-bold text-slate-900">Xem thống kê</h4>
                      <p className="text-xs text-slate-500 mt-1">Theo dõi lượt xem và tỷ lệ chuyển đổi</p>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TRẠNG THÁI: CHỜ DUYỆT (PENDING) */}
            {status === "PENDING" && !isResubmitting && (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 backdrop-blur-xs">
                    <FaClock className="text-white" />
                  </div>
                  <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 mb-2">
                    Trạng thái: Chờ duyệt
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold">
                    Hồ sơ của bạn đang được xét duyệt
                  </h2>
                  <p className="text-amber-100 max-w-xl mx-auto mt-2 text-sm md:text-base">
                    Ban quản trị đang tiến hành xác minh thông tin giấy tờ tùy thân của bạn. Thời gian xét duyệt thông thường diễn ra trong vòng 24h - 48h làm việc.
                  </p>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
                    <h4 className="font-bold text-amber-900 text-sm mb-3">
                      Thông tin hồ sơ đã gửi:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Số CCCD/CMND: </span>
                        <strong className="text-slate-800">{record?.SoCCCD || "Chưa ghi nhận"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Số điện thoại liên hệ: </span>
                        <strong className="text-slate-800">{record?.SDTLienHe || currentUser?.SDT || "Chưa ghi nhận"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Khu vực dự kiến: </span>
                        <strong className="text-emerald-700">{record?.KhuVucHoatDong || "Toàn quốc"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Trạng thái thanh toán: </span>
                        <span className="font-bold text-emerald-700">
                          {record?.TrangThaiThanhToan === "DA_THANH_TOAN"
                            ? "✅ Đã thanh toán 299.000 VNĐ"
                            : "Đã xác nhận thanh toán"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Thời gian gửi: </span>
                        <strong className="text-slate-800">{formatDate(record?.NgayGui)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ảnh CCCD đã tải lên */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-3">
                      Hình ảnh chứng từ đã tải lên:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {record?.AnhCCCDMatTruoc && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-500">Mặt trước CCCD</span>
                          <img
                            src={renderImageUrl(record.AnhCCCDMatTruoc)}
                            alt="CCCD mặt trước"
                            className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}
                      {record?.AnhCCCDMatSau && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-500">Mặt sau CCCD</span>
                          <img
                            src={renderImageUrl(record.AnhCCCDMatSau)}
                            alt="CCCD mặt sau"
                            className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}
                      {record?.AnhChanDung && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-500">Ảnh chân dung</span>
                          <img
                            src={renderImageUrl(record.AnhChanDung)}
                            alt="Ảnh chân dung"
                            className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TRẠNG THÁI: BỊ TỪ CHỐI (REJECTED) */}
            {status === "REJECTED" && !isResubmitting && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-8 text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 backdrop-blur-xs">
                    <FaTimesCircle className="text-white" />
                  </div>
                  <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 mb-2">
                    Trạng thái: Bị từ chối
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold">
                    Hồ sơ xác minh chưa được thông qua
                  </h2>
                  <p className="text-red-100 max-w-xl mx-auto mt-2 text-sm md:text-base">
                    Rất tiếc, hồ sơ đăng ký làm môi giới của bạn chưa đủ điều kiện phê duyệt. Bạn có thể kiểm tra lý do và gửi lại thông tin chính xác.
                  </p>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {/* Lý do từ chối */}
                  <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
                    <h4 className="font-bold text-red-900 text-sm mb-1">
                      Lý do từ chối từ Ban quản trị:
                    </h4>
                    <p className="text-red-700 text-sm font-medium">
                      "{record?.GhiChuAdmin || "Thông tin ảnh CCCD bị mờ, không rõ nét hoặc không khớp với thông tin tài khoản."}"
                    </p>
                    {record?.NgayDuyet && (
                      <span className="block text-xs text-red-400 mt-2">
                        Thời gian từ chối: {formatDate(record.NgayDuyet)}
                      </span>
                    )}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setIsResubmitting(true)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                    >
                      <FaRedo />
                      <span>Cập nhật và nộp lại hồ sơ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TRẠNG THÁI: CHƯA GỬI (CHUA_XAC_MINH) hoặc đang NỘP LẠI HỒ SƠ */}
            {(status === "CHUA_XAC_MINH" || !record || isResubmitting) && (
              <div className="space-y-6">
                {/* Banner giới thiệu lợi ích */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      🚀
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Đăng tin không giới hạn</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Tiếp cận hàng ngàn người mua và thuê nhà mỗi ngày trên hệ thống.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      🎯
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Quản lý khách tiềm năng</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Nhận thông báo tức thì khi có khách hàng gửi yêu cầu tư vấn.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      🛡️
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Huy hiệu uy tín ✅</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Tăng độ tin cậy và tỷ lệ chốt giao dịch vượt trội so với tài khoản thường.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form điền thông tin */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          Trạng thái: Chưa gửi
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                        Điền thông tin xác minh danh tính
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Vui lòng cung cấp số CCCD và chụp ảnh 2 mặt rõ nét để Ban quản trị đối chiếu và duyệt tài khoản
                      </p>
                    </div>
                    {isResubmitting && (
                      <button
                        onClick={() => setIsResubmitting(false)}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
                      >
                        Quay lại
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {formError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
                        <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Thông tin tài khoản mặc định */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                      <div>
                        <span className="text-xs text-slate-500 block">Họ và tên</span>
                        <strong className="text-slate-900">{currentUser?.HoTen || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Email tài khoản</span>
                        <strong className="text-slate-900">{currentUser?.Email}</strong>
                      </div>
                    </div>

                    {/* Số điện thoại & Khu vực hoạt động dự kiến */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1.5">
                          Số điện thoại liên hệ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={sdtLienHe}
                          onChange={(e) => setSdtLienHe(e.target.value)}
                          placeholder="Nhập số điện thoại nhận liên hệ (VD: 0988xxxxxx)"
                          className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1.5">
                          Khu vực hoạt động dự kiến <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={khuVucHoatDong}
                          onChange={(e) => setKhuVucHoatDong(e.target.value)}
                          placeholder="VD: TP. Thủ Đức, Quận 7, Bình Thạnh..."
                          className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Số CCCD */}
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1.5">
                        Số CCCD / CMND <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={soCCCD}
                        onChange={(e) => setSoCCCD(e.target.value)}
                        placeholder="Nhập 12 chữ số CCCD (hoặc 9 số CMND)"
                        maxLength={12}
                        className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        required
                      />
                    </div>

                    {/* Upload ảnh CCCD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Mặt trước */}
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1.5">
                          Ảnh CCCD mặt trước <span className="text-red-500">*</span>
                        </label>
                        <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 h-52 flex flex-col items-center justify-center overflow-hidden">
                          {frontPreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={frontPreview}
                                alt="CCCD mặt trước"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <label className="absolute bottom-2 right-2 px-3 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer transition">
                                Đổi ảnh
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFrontChange}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-2">
                                <FaIdCard />
                              </div>
                              <span className="text-sm font-bold text-slate-700">
                                Tải ảnh mặt trước
                              </span>
                              <span className="text-xs text-slate-400 mt-1">
                                JPG, PNG, WEBP (Tối đa 15MB)
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFrontChange}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Mặt sau */}
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1.5">
                          Ảnh CCCD mặt sau <span className="text-red-500">*</span>
                        </label>
                        <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 h-52 flex flex-col items-center justify-center overflow-hidden">
                          {backPreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={backPreview}
                                alt="CCCD mặt sau"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <label className="absolute bottom-2 right-2 px-3 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer transition">
                                Đổi ảnh
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleBackChange}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-2">
                                <FaIdCard />
                              </div>
                              <span className="text-sm font-bold text-slate-700">
                                Tải ảnh mặt sau
                              </span>
                              <span className="text-xs text-slate-400 mt-1">
                                JPG, PNG, WEBP (Tối đa 15MB)
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleBackChange}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ảnh chân dung (Bắt buộc) */}
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1.5">
                        Ảnh chân dung cá nhân <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50">
                        {selfiePreview ? (
                          <img
                            src={selfiePreview}
                            alt="Chân dung"
                            className="w-24 h-24 object-cover rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-2xl">
                            <FaCamera />
                          </div>
                        )}
                        <div className="flex-1 text-center sm:text-left">
                          <p className="text-sm font-semibold text-slate-700">
                            Ảnh chân dung khuôn mặt trực diện
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ảnh rõ nét, thấy rõ mặt, không đeo kính râm hoặc đội mũ
                          </p>
                          <label className="inline-block mt-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition">
                            {selfiePreview ? "Đổi ảnh khác" : "Chọn ảnh chân dung"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSelfieChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang gửi hồ sơ...</span>
                          </>
                        ) : (
                          <>
                            <FaShieldAlt />
                            <span>Gửi hồ sơ đăng ký môi giới</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal thanh toán MoMo phí nâng cấp môi giới */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={async () => {
          setShowPaymentModal(false);
          try {
            const token = localStorage.getItem("token");
            await axios.post(
              `${API_URL}/broker-verification/cancel`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            toast.info("Bạn đã hủy thanh toán. Hồ sơ chưa được gửi đi.");
          } catch (cancelErr) {
            console.error("Lỗi khi hủy hồ sơ:", cancelErr);
          } finally {
            await fetchStatus();
          }
        }}
        onSuccess={() => {
          toast.success("Thanh toán thành công! Hồ sơ của bạn đã được chuyển sang trạng thái Chờ xét duyệt.");
          fetchStatus();
          if (loadUserInfo) loadUserInfo();
        }}
        amount={299000}
        description="Phí đăng ký tài khoản môi giới"
      />
    </div>
  );
};

export default BrokerRegistration;
