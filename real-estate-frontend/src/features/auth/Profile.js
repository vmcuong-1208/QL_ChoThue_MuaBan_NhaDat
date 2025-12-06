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
} from "react-icons/fa";
import PaymentModal from "../payment/PaymentModal";

const Profile = () => {
  const { currentUser, updateProfile, loading, loadUserInfo, token } =
    useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    HoTen: "",
    SDT: "",
    DiaChi: "",
    MoTaBanThan: "",
    AnhDaiDien: null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Tự suy ra màu / text cho loại tài khoản
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

  // Cập nhật form khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      setFormData({
        HoTen: currentUser.HoTen || "",
        SDT: currentUser.SDT || "",
        DiaChi: currentUser.DiaChi || "",
        MoTaBanThan: currentUser.MoTaBanThan || "",
        AnhDaiDien: null,
      });
      setPreviewImage(currentUser.AnhDaiDien || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("HoTen", formData.HoTen);
      formDataToSend.append("SDT", formData.SDT);
      formDataToSend.append("DiaChi", formData.DiaChi);
      formDataToSend.append("MoTaBanThan", formData.MoTaBanThan);

      if (formData.AnhDaiDien instanceof File) {
        formDataToSend.append("AnhDaiDien", formData.AnhDaiDien);
      }

      await updateProfile(formDataToSend);
      setIsEditing(false);
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin!");
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
      });
      setPreviewImage(currentUser.AnhDaiDien || "");
    }
    setIsEditing(false);
  };

  const handleUpgradeToBroker = () => {
    setShowPaymentModal(true);
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
          <p className="text-lg font-semibold text-slate-700">
            Đang tải thông tin cá nhân...
          </p>
        </div>
      </div>
    );
  }

  // Chưa có user (đã điều hướng về /auth ở useEffect phía trên)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 pt-20 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out]">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
              Thông tin cá nhân
            </h1>
            <p className="mt-2 font-semibold text-slate-600">
              Quản lý hồ sơ, thông tin liên hệ và trạng thái tài khoản của bạn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Badge loại tài khoản */}
            <div
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-full shadow-sm ${roleInfo.className}`}
            >
              {roleInfo.icon}
              <span>{roleInfo.label}</span>
            </div>

            {/* Nút nâng cấp */}
            {currentUser?.LoaiTaiKhoan?.toLowerCase() === "thường" && (
              <button
                onClick={handleUpgradeToBroker}
                className="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-full shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-300/60 transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0"
              >
                <FaCrown className="animate-pulse" />
                <span>Nâng cấp thành môi giới</span>
                <span className="absolute inset-0 rounded-full opacity-0 bg-gradient-to-r from-white/40 to-transparent animate-[ping_1.2s_ease-out_infinite]" />
              </button>
            )}

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 transition-all duration-200 bg-white border border-blue-200 rounded-full hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
              >
                <FaPen className="text-xs" />
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-[1.1fr,1.3fr]">
          {/* Card avatar + info cơ bản */}
          <div className="relative p-6 overflow-hidden bg-white border shadow-xl rounded-3xl border-slate-100">
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

              {/* Upload avatar */}
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
                    {previewImage ? "Thay đổi ảnh" : "Thêm ảnh đại diện"}
                  </span>
                </label>
              )}

              {/* Basic info */}
              <div className="w-full mt-2 text-center">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {currentUser.HoTen || currentUser.Email}
                </h2>
                <p className="flex items-center justify-center gap-2 mt-1 text-sm font-medium text-slate-500">
                  <FaEnvelope className="text-slate-400" />
                  <span>{currentUser.Email}</span>
                </p>

                {!currentUser.AnhDaiDien && !isEditing && (
                  <p className="inline-flex items-center gap-2 px-3 py-2 mt-3 text-xs border text-amber-600 bg-amber-50 border-amber-100 rounded-xl">
                    💡{" "}
                    <span>
                      Thêm ảnh đại diện để hồ sơ của bạn chuyên nghiệp hơn.
                    </span>
                  </p>
                )}
              </div>

              {/* Thông tin nhanh */}
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
                      <p className="text-sm font-medium text-slate-800">
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
            </div>
          </div>

          {/* Card chi tiết / form chỉnh sửa */}
          <div className="p-6 bg-white border shadow-xl rounded-3xl border-slate-100">
            {isEditing ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 animate-[fadeIn_0.3s_ease-out]"
              >
                {/* ✅ Họ tên + SĐT cùng hàng */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Họ tên */}
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

                  {/* SĐT */}
                  <div>
                    <label
                      htmlFor="SDT"
                      className="flex items-center gap-2 mb-1 text-sm font-semibold text-slate-700"
                    >
                      <FaPhone className="text-emerald-500" />
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="SDT"
                      name="SDT"
                      value={formData.SDT}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-3 py-2.5 text-sm md:text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
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
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    id="DiaChi"
                    name="DiaChi"
                    value={formData.DiaChi}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ"
                    className="w-full px-3 py-2.5 text-sm md:text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                {/* Mô tả bản thân */}
                <div>
                  <label
                    htmlFor="MoTaBanThan"
                    className="mb-1 text-sm font-semibold text-slate-700"
                  >
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    id="MoTaBanThan"
                    name="MoTaBanThan"
                    value={formData.MoTaBanThan}
                    onChange={handleChange}
                    placeholder="Viết vài dòng giới thiệu về kinh nghiệm, khu vực hoạt động, lĩnh vực bạn mạnh..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm md:text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 hover:text-slate-800 active:scale-95"
                  >
                    <FaTimes />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  >
                    <FaCheck />
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* ✅ Họ tên + SĐT cùng hàng */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                      Họ và tên
                    </p>
                    <div className="px-4 py-3 text-sm font-medium border md:text-base text-slate-900 bg-slate-50 rounded-xl border-slate-100">
                      {currentUser.HoTen || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                      Số điện thoại
                    </p>
                    <div className="px-4 py-3 text-sm font-medium border md:text-base text-slate-900 bg-slate-50 rounded-xl border-slate-100">
                      {currentUser.SDT || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                    Địa chỉ
                  </p>
                  <div className="px-4 py-3 text-sm font-medium border md:text-base text-slate-900 bg-slate-50 rounded-xl border-slate-100">
                    {currentUser.DiaChi || "Chưa cập nhật"}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-400">
                    Giới thiệu bản thân
                  </p>
                  <div className="px-4 py-3 text-sm md:text-base font-medium text-slate-800 bg-slate-50 rounded-xl border border-slate-100 min-h-[96px]">
                    {currentUser.MoTaBanThan || "Chưa cập nhật"}
                  </div>
                </div>

                {!currentUser.MoTaBanThan && (
                  <p className="mt-2 text-xs text-slate-500">
                    💡 Mẹo nhỏ: Hồ sơ có phần giới thiệu chi tiết sẽ giúp bạn
                    tạo được ấn tượng tốt hơn với khách hàng.
                  </p>
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
    </div>
  );
};

export default Profile;
