"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPen,
  FaCheck,
  FaTimes,
  FaCrown,
  FaIdCard,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCertificate,
  FaFileAlt,
  FaCalendarAlt,
  FaUpload,
  FaExternalLinkAlt,
  FaBuilding,
  FaAward,
} from "react-icons/fa";
import axios from "axios";
import { API_URL, SERVER_URL } from "../../services/api";
import PaymentModal from "../payment/PaymentModal";
import BrokerVerificationModal from "./BrokerVerificationModal";

const Profile = () => {
  const { currentUser, updateProfile, loading, loadUserInfo, token } =
    useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data chung & môi giới
  const [formData, setFormData] = useState({
    HoTen: "",
    SDT: "",
    DiaChi: "",
    MoTaBanThan: "",
    AnhDaiDien: null,
    // Thông tin môi giới bổ sung
    TenChungChi: "",
    SoChungChi: "",
    NgayCapChungChi: "",
    KhuVucChuyenMon: "",
    FileChungChi: null,
  });

  const [previewImage, setPreviewImage] = useState("");
  const [previewCertificate, setPreviewCertificate] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBrokerVerifyModal, setShowBrokerVerifyModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Phân loại tài khoản môi giới
  const isBroker = useMemo(() => {
    const role = (currentUser?.LoaiTaiKhoan || "").toLowerCase();
    return role.includes("môi") || role.includes("broker") || role.includes("đầu tư");
  }, [currentUser]);

  const fetchVerificationStatus = async () => {
    try {
      const activeToken = token || localStorage.getItem("token");
      if (!activeToken) return;
      const res = await axios.get(`${API_URL}/broker-verification/status`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      setVerificationStatus(res.data);
    } catch (err) {
      console.error("Lỗi lấy trạng thái xác minh:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchVerificationStatus();
    }
  }, [currentUser, token]);

  // Suy ra màu / badge cho loại tài khoản
  const roleInfo = useMemo(() => {
    const role = (currentUser?.LoaiTaiKhoan || "Người dùng").toLowerCase();

    if (role.includes("admin")) {
      return {
        label: "Quản trị viên",
        className: "bg-red-100 text-red-700 border-red-300",
        icon: <FaCrown className="text-red-500" />,
      };
    }
    if (role.includes("môi") || role.includes("broker")) {
      return {
        label: "Tài khoản môi giới",
        className: "bg-amber-100 text-amber-700 border-amber-300",
        icon: <FaCrown className="text-amber-500" />,
      };
    }
    return {
      label: "Tài khoản thường",
      className: "bg-slate-100 text-slate-700 border-slate-300",
      icon: <FaUser className="text-slate-500" />,
    };
  }, [currentUser]);

  // Load user info khi có token nhưng chưa có currentUser
  useEffect(() => {
    const loadData = async () => {
      if (token && !currentUser) {
        await loadUserInfo(token);
      }
    };
    loadData();
  }, [token, currentUser, loadUserInfo]);

  // Định dạng ngày hiển thị cho input date (YYYY-MM-DD)
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // Cập nhật form khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      setFormData({
        HoTen: currentUser.HoTen || "",
        SDT: currentUser.SDT || "",
        DiaChi: currentUser.DiaChi || "",
        MoTaBanThan: currentUser.MoTaBanThan || "",
        AnhDaiDien: null,
        TenChungChi: currentUser.TenChungChi || "",
        SoChungChi: currentUser.SoChungChi || "",
        NgayCapChungChi: formatDateForInput(currentUser.NgayCapChungChi),
        KhuVucChuyenMon: currentUser.KhuVucChuyenMon || "",
        FileChungChi: null,
      });
      setPreviewImage(currentUser.AnhDaiDien || "");
      setPreviewCertificate(currentUser.FileChungChi || "");
    }
  }, [currentUser]);

  // Nếu chưa đăng nhập thì đẩy về /auth
  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/auth");
    }
  }, [currentUser, loading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setFormData((prev) => ({
        ...prev,
        AnhDaiDien: file,
      }));
    }
  };

  const handleCertificateFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewCertificate(URL.createObjectURL(file));
      setFormData((prev) => ({
        ...prev,
        FileChungChi: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append("HoTen", formData.HoTen || "");
      formDataToSend.append("SDT", formData.SDT || "");
      formDataToSend.append("DiaChi", formData.DiaChi || "");
      formDataToSend.append("MoTaBanThan", formData.MoTaBanThan || "");

      if (formData.AnhDaiDien instanceof File) {
        formDataToSend.append("AnhDaiDien", formData.AnhDaiDien);
      }

      // Nếu là môi giới thì gửi thêm các trường nghề nghiệp
      if (isBroker) {
        formDataToSend.append("TenChungChi", formData.TenChungChi || "");
        formDataToSend.append("SoChungChi", formData.SoChungChi || "");
        formDataToSend.append("NgayCapChungChi", formData.NgayCapChungChi || "");
        formDataToSend.append("KhuVucChuyenMon", formData.KhuVucChuyenMon || "");

        if (formData.FileChungChi instanceof File) {
          formDataToSend.append("FileChungChi", formData.FileChungChi);
        }
      }

      await updateProfile(formDataToSend);
      setIsEditing(false);
      alert(
        isBroker
          ? "Cập nhật hồ sơ môi giới thành công!"
          : "Cập nhật thông tin cá nhân thành công!"
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Có lỗi xảy ra khi cập nhật hồ sơ!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        HoTen: currentUser.HoTen || "",
        SDT: currentUser.SDT || "",
        DiaChi: currentUser.DiaChi || "",
        MoTaBanThan: currentUser.MoTaBanThan || "",
        AnhDaiDien: null,
        TenChungChi: currentUser.TenChungChi || "",
        SoChungChi: currentUser.SoChungChi || "",
        NgayCapChungChi: formatDateForInput(currentUser.NgayCapChungChi),
        KhuVucChuyenMon: currentUser.KhuVucChuyenMon || "",
        FileChungChi: null,
      });
      setPreviewImage(currentUser.AnhDaiDien || "");
      setPreviewCertificate(currentUser.FileChungChi || "");
    }
    setIsEditing(false);
  };

  const handleUpgradeToBroker = () => {
    navigate("/dang-ky-moi-gioi");
  };

  const handlePaymentSuccess = async (pmToken, method) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("paymentToken", pmToken);
      formDataToSend.append("paymentMethod", method);
      formDataToSend.append("upgradeType", "broker");

      await updateProfile(formDataToSend);
      alert("Nâng cấp tài khoản thành công! Bạn đã trở thành môi giới.");
    } catch (error) {
      alert("Có lỗi xảy ra khi nâng cấp tài khoản. Vui lòng liên hệ hỗ trợ.");
    }
  };

  const renderFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "Chưa cập nhật";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
          <p className="text-lg font-semibold text-slate-700">
            Đang tải hồ sơ...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 pt-20 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out]">
        {/* Header Breadcrumb */}
        {isBroker ? (
          /* Đối với môi giới: Hiển thị gọn gàng các nút trên 1 hàng, bỏ tiêu đề & mô tả thừa */
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Badge Tài khoản môi giới */}
            <div
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-full shadow-xs ${roleInfo.className}`}
            >
              {roleInfo.icon}
              <span>{roleInfo.label}</span>
            </div>

            {/* 2. Trạng thái xác minh môi giới */}
            {verificationStatus?.userStatus === "VERIFIED" ? (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-full shadow-xs">
                <FaCheckCircle className="text-emerald-500 text-sm" />
                <span>Môi giới đã xác minh ✅</span>
              </div>
            ) : verificationStatus?.userStatus === "PENDING" ? (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-full shadow-xs">
                <FaClock className="text-amber-500 animate-pulse text-sm" />
                <span>Đang chờ Admin duyệt CCCD</span>
              </div>
            ) : verificationStatus?.userStatus === "REJECTED" ? (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded-full shadow-xs">
                <FaTimesCircle className="text-rose-500 text-sm" />
                <span>Hồ sơ CCCD bị từ chối</span>
                <button
                  type="button"
                  onClick={() => setShowBrokerVerifyModal(true)}
                  className="ml-1 underline font-bold hover:text-rose-900"
                >
                  Gửi lại
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBrokerVerifyModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200"
              >
                <FaIdCard />
                <span>Xác minh môi giới (CCCD)</span>
              </button>
            )}

            {/* 3. Nút Chỉnh sửa hồ sơ */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 transition-all duration-200 bg-white border border-blue-200 rounded-full hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-xs"
              >
                <FaPen className="text-xs" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            )}
          </div>
        ) : (
          /* Đối với tài khoản thường */
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
                Hồ sơ cá nhân
              </h1>
              <p className="mt-2 font-medium text-slate-600">
                Quản lý hồ sơ, thông tin liên hệ và trạng thái tài khoản của bạn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-full shadow-xs ${roleInfo.className}`}
              >
                {roleInfo.icon}
                <span>{roleInfo.label}</span>
              </div>

              {currentUser?.LoaiTaiKhoan?.toLowerCase() === "thường" && (
                <button
                  onClick={handleUpgradeToBroker}
                  className="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-full shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-300 hover:-translate-y-[2px]"
                >
                  <FaCrown className="animate-pulse" />
                  <span>Nâng cấp thành môi giới</span>
                </button>
              )}

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 transition-all duration-200 bg-white border border-blue-200 rounded-full hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-xs"
                >
                  <FaPen className="text-xs" />
                  <span>Chỉnh sửa hồ sơ</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid gap-6 md:grid-cols-[1.05fr,1.35fr]">
          {/* Card Cột trái: Avatar + Liên hệ cơ bản */}
          <div className="relative p-6 overflow-hidden bg-white border shadow-xl rounded-3xl border-slate-100 flex flex-col justify-between">
            <div className="absolute w-40 h-40 bg-blue-100 rounded-full -top-16 -right-10 blur-2xl opacity-60" />
            <div className="absolute w-32 h-32 bg-indigo-100 rounded-full -bottom-16 -left-6 blur-2xl opacity-60" />

            <div className="relative flex flex-col items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 overflow-hidden border-4 border-white rounded-full shadow-xl bg-slate-100 ring-2 ring-blue-500/40">
                  <img
                    src={previewImage || "https://via.placeholder.com/150"}
                    alt="Avatar"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                </div>
                <div className="absolute px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full shadow-md -bottom-1 -right-1">
                  {currentUser?.LoaiTaiKhoan || "Người dùng"}
                </div>
              </div>

              {/* Thay đổi ảnh đại diện */}
              {isEditing && (
                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-all duration-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <FaPen className="text-[10px]" />
                  <span>
                    {previewImage ? "Thay đổi ảnh đại diện" : "Tải ảnh đại diện"}
                  </span>
                </label>
              )}

              {/* Basic info */}
              <div className="w-full mt-2 text-center">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                  {currentUser.HoTen || currentUser.Email}
                  {isBroker && (
                    <span className="text-blue-600 text-base" title="Môi giới bất động sản">
                      ✅
                    </span>
                  )}
                </h2>
                {isBroker && (
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                    Chuyên viên tư vấn bất động sản
                  </p>
                )}
                <p className="flex items-center justify-center gap-2 mt-1.5 text-sm font-medium text-slate-500">
                  <FaEnvelope className="text-slate-400" />
                  <span>{currentUser.Email}</span>
                </p>
              </div>

              {/* Thông tin liên hệ nhanh */}
              <div className="w-full pt-4 mt-2 border-t border-slate-100">
                <div className="grid gap-3 text-sm text-left">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 text-blue-500 rounded-xl bg-blue-50">
                      <FaPhone />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Số điện thoại
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {currentUser.SDT || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500">
                      <FaMapMarkerAlt />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Địa chỉ
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {currentUser.DiaChi || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nếu là môi giới: Hiển thị nhanh tóm tắt Khu vực chuyên môn */}
              {isBroker && currentUser.KhuVucChuyenMon && (
                <div className="w-full pt-4 mt-2 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-rose-500" />
                    Khu vực chuyên môn
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUser.KhuVucChuyenMon.split(",")
                      .map((k) => k.trim())
                      .filter(Boolean)
                      .map((area, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          📍 {area}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Cột phải: Form chỉnh sửa / Chi tiết hồ sơ */}
          <div className="p-6 bg-white border shadow-xl rounded-3xl border-slate-100">
            {isEditing ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 animate-[fadeIn_0.3s_ease-out]"
              >
                {/* Tiêu đề section */}
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {isBroker ? "Cập nhật hồ sơ môi giới" : "Cập nhật thông tin cá nhân"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBroker
                      ? "Cập nhật đầy đủ số điện thoại, chứng chỉ hành nghề và khu vực để khách hàng dễ dàng tìm kiếm"
                      : "Điền thông tin chính xác để thuận tiện liên hệ và giao dịch"}
                  </p>
                </div>

                {/* Họ tên + SĐT */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="HoTen"
                      className="flex items-center gap-2 mb-1 text-sm font-bold text-slate-700"
                    >
                      <FaUser className="text-blue-500" />
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      id="HoTen"
                      name="HoTen"
                      value={formData.HoTen}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                      className="w-full px-3 py-2.5 text-sm md:text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="SDT"
                      className="flex items-center gap-2 mb-1 text-sm font-semibold text-slate-700"
                    >
                      <FaPhone className="text-emerald-500" />
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="SDT"
                      name="SDT"
                      value={formData.SDT}
                      onChange={handleChange}
                      placeholder="Ví dụ: 0988 xxx xxx"
                      className="w-full px-3 py-2.5 text-sm md:text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Địa chỉ */}
                <div>
                  <label
                    htmlFor="DiaChi"
                    className="flex items-center gap-2 mb-1 text-sm font-semibold text-slate-700"
                  >
                    <FaMapMarkerAlt className="text-rose-500" />
                    Địa chỉ liên hệ
                  </label>
                  <input
                    type="text"
                    id="DiaChi"
                    name="DiaChi"
                    value={formData.DiaChi}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ của bạn"
                    className="w-full px-3 py-2.5 text-sm md:text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                {/* Giới thiệu bản thân */}
                <div>
                  <label
                    htmlFor="MoTaBanThan"
                    className="mb-1 text-sm font-semibold text-slate-700 block"
                  >
                    {isBroker ? "Giới thiệu kinh nghiệm môi giới" : "Giới thiệu bản thân"}
                  </label>
                  <textarea
                    id="MoTaBanThan"
                    name="MoTaBanThan"
                    value={formData.MoTaBanThan}
                    onChange={handleChange}
                    placeholder={
                      isBroker
                        ? "Mô tả số năm kinh nghiệm, các dự án thế mạnh (ví dụ: Chuyên căn hộ Vinhomes, Nhà phố Quận 7), cam kết hỗ trợ pháp lý và xem nhà nhanh chóng..."
                        : "Viết vài dòng giới thiệu về bản thân..."
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm md:text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  />
                </div>

                {/* PHẦN DÀNH RIÊNG CHO MÔI GIỚI: CHỨNG CHỈ HÀNH NGHỀ & KHU VỰC CHUYÊN MÔN */}
                {isBroker && (
                  <div className="pt-3 border-t-2 border-amber-100 space-y-4 bg-amber-50/40 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <FaAward className="text-amber-600 text-lg" />
                      <span>Thông tin nghề nghiệp & Chứng chỉ môi giới</span>
                    </div>

                    {/* Khu vực chuyên môn */}
                    <div>
                      <label
                        htmlFor="KhuVucChuyenMon"
                        className="flex items-center gap-2 mb-1 text-sm font-bold text-slate-800"
                      >
                        <FaMapMarkerAlt className="text-rose-500" />
                        Khu vực chuyên môn
                      </label>
                      <input
                        type="text"
                        id="KhuVucChuyenMon"
                        name="KhuVucChuyenMon"
                        value={formData.KhuVucChuyenMon}
                        onChange={handleChange}
                        placeholder="Ví dụ: TP. Thủ Đức, Quận 7, Bình Thạnh hoặc Chuyên Vinhomes Grand Park"
                        className="w-full px-3 py-2.5 text-sm font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all bg-white"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        💡 Phân cách các khu vực bằng dấu phẩy (Ví dụ: <em>Quận 1, Quận 7, TP. Thủ Đức</em>).
                      </p>
                    </div>

                    {/* Tên chứng chỉ + Số chứng chỉ */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="TenChungChi"
                          className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-700"
                        >
                          <FaCertificate className="text-amber-500" />
                          Tên chứng chỉ
                        </label>
                        <input
                          type="text"
                          id="TenChungChi"
                          name="TenChungChi"
                          value={formData.TenChungChi}
                          onChange={handleChange}
                          placeholder="Chứng chỉ hành nghề môi giới BĐS"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="SoChungChi"
                          className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-700"
                        >
                          <FaFileAlt className="text-blue-500" />
                          Số chứng chỉ
                        </label>
                        <input
                          type="text"
                          id="SoChungChi"
                          name="SoChungChi"
                          value={formData.SoChungChi}
                          onChange={handleChange}
                          placeholder="Số hiệu chứng chỉ (nếu có)"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Ngày cấp + File đính kèm */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="NgayCapChungChi"
                          className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-700"
                        >
                          <FaCalendarAlt className="text-indigo-500" />
                          Ngày cấp
                        </label>
                        <input
                          type="date"
                          id="NgayCapChungChi"
                          name="NgayCapChungChi"
                          value={formData.NgayCapChungChi}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-700">
                          <FaUpload className="text-emerald-500" />
                          Tệp đính kèm chứng chỉ
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition flex items-center gap-1.5">
                            <FaUpload size={11} />
                            <span>{formData.FileChungChi ? "Đổi tệp" : "Tải lên tệp"}</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleCertificateFileChange}
                              className="hidden"
                            />
                          </label>
                          {previewCertificate && (
                            <a
                              href={renderFileUrl(previewCertificate)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold truncate max-w-[140px]"
                            >
                              <FaExternalLinkAlt size={10} />
                              Xem tệp đã tải
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 hover:text-slate-800"
                  >
                    <FaTimes />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        <span>Lưu thay đổi hồ sơ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE */
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Họ tên + SĐT */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                      Họ và tên
                    </p>
                    <div className="px-4 py-3 text-sm font-semibold border md:text-base text-slate-900 bg-slate-50 rounded-xl border-slate-100">
                      {currentUser.HoTen || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                      Số điện thoại
                    </p>
                    <div className="px-4 py-3 text-sm font-semibold border md:text-base text-slate-900 bg-slate-50 rounded-xl border-slate-100 font-mono">
                      {currentUser.SDT || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                    Địa chỉ liên hệ
                  </p>
                  <div className="px-4 py-3 text-sm font-medium border md:text-base text-slate-900 bg-slate-50 rounded-xl border-slate-100">
                    {currentUser.DiaChi || "Chưa cập nhật"}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                    {isBroker ? "Kinh nghiệm & Giới thiệu dịch vụ" : "Giới thiệu bản thân"}
                  </p>
                  <div className="px-4 py-3 text-sm md:text-base font-medium text-slate-800 bg-slate-50 rounded-xl border border-slate-100 min-h-[84px] whitespace-pre-line">
                    {currentUser.MoTaBanThan || "Chưa có thông tin giới thiệu."}
                  </div>
                </div>

                {/* THÔNG TIN NGHỀ NGHIỆP DÀNH CHO MÔI GIỚI */}
                {isBroker && (
                  <div className="pt-4 mt-2 border-t border-slate-100 space-y-4 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5 rounded-2xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <FaAward className="text-amber-600 text-lg" />
                        <span>Hồ sơ năng lực & Khu vực chuyên môn</span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Chuyên viên môi giới
                      </span>
                    </div>

                    {/* Khu vực chuyên môn */}
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-rose-500" />
                        Khu vực hoạt động & thị trường chuyên sâu
                      </p>
                      {currentUser.KhuVucChuyenMon ? (
                        <div className="flex flex-wrap gap-2">
                          {currentUser.KhuVucChuyenMon.split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                            .map((area, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 text-xs font-bold text-blue-800 bg-blue-100/70 border border-blue-200 rounded-lg shadow-2xs"
                              >
                                📍 {area}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Chưa cập nhật khu vực chuyên môn. Nhấn "Chỉnh sửa hồ sơ" để thêm khu vực hoạt động của bạn.
                        </p>
                      )}
                    </div>

                    {/* Chứng chỉ hành nghề */}
                    <div className="pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Tên chứng chỉ:</span>
                        <strong className="text-slate-900 text-sm">
                          {currentUser.TenChungChi || "Chưa cập nhật"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Số chứng chỉ:</span>
                        <strong className="text-slate-900 text-sm font-mono">
                          {currentUser.SoChungChi || "Chưa cập nhật"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ngày cấp:</span>
                        <strong className="text-slate-800">
                          {formatDateDisplay(currentUser.NgayCapChungChi)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tệp đính kèm:</span>
                        {currentUser.FileChungChi ? (
                          <a
                            href={renderFileUrl(currentUser.FileChungChi)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline mt-0.5"
                          >
                            <FaExternalLinkAlt size={10} />
                            Xem tài liệu chứng chỉ
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Chưa tải lên</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        amount={500000}
        purpose="Nâng cấp tài khoản môi giới"
      />

      {/* Broker Verification Modal */}
      <BrokerVerificationModal
        isOpen={showBrokerVerifyModal}
        onClose={() => setShowBrokerVerifyModal(false)}
        onSuccess={() => {
          fetchVerificationStatus();
        }}
      />
    </div>
  );
};

export default Profile;
