"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaEnvelope,
  FaUser,
  FaPhone,
  FaArrowLeft,
} from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../services/api";

const LoginRegister = () => {
  const navigate = useNavigate();
  const { token, login } = useAuth();

  // State cho form
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);

  // ✅ State cho animation
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [formData, setFormData] = useState({
    account: "",
    email: "",
    phone: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    otp: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [apiMessage, setApiMessage] = useState({ type: "", text: "" });

  // Kiểm tra nếu đã đăng nhập
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [navigate, token]);

  // ✅ Xử lý chuyển đổi với animation mượt
  const toggleForm = () => {
    setIsTransitioning(true);

    // Đợi animation fade out hoàn thành
    setTimeout(() => {
      setIsLogin(!isLogin);
      setForgotPasswordStep(0);
      setFormData({
        account: "",
        email: "",
        phone: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        otp: "",
        newPassword: "",
      });
      setErrors({});
      setApiMessage({ type: "", text: "" });
      setShowPassword(false);
      setShowConfirmPassword(false);

      // Đợi một chút rồi fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 400); // Thời gian fade out
  };

  // ✅ Xử lý chuyển đổi forgot password steps
  const changeForgotPasswordStep = (step) => {
    setIsTransitioning(true);

    setTimeout(() => {
      setForgotPasswordStep(step);
      setApiMessage({ type: "", text: "" });

      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 400);
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Kiểm tra độ mạnh của mật khẩu
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 1;
      if (/[A-Z]/.test(formData.password)) strength += 1;
      if (/[0-9]/.test(formData.password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  // Xác thực form
  const validateForm = () => {
    const newErrors = {};

    if (isLogin && forgotPasswordStep === 0) {
      if (!formData.email) newErrors.email = "Vui lòng nhập email";
      if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (!isLogin) {
      if (!formData.fullName) newErrors.fullName = "Vui lòng nhập họ tên";

      if (!formData.email) {
        newErrors.email = "Vui lòng nhập email";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }

      if (!formData.phone) {
        newErrors.phone = "Vui lòng nhập số điện thoại";
      } else if (!/^[0-9]{10}$/.test(formData.phone)) {
        newErrors.phone = "Số điện thoại phải có 10 chữ số";
      }

      if (!formData.password) {
        newErrors.password = "Vui lòng nhập mật khẩu";
      } else if (formData.password.length < 8) {
        newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu không khớp";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý đăng nhập
  const handleLogin = async () => {
    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setApiMessage({
          type: "success",
          text: "Đăng nhập thành công!",
        });

        setFormData({
          account: "",
          email: "",
          phone: "",
          fullName: "",
          password: "",
          confirmPassword: "",
          otp: "",
          newPassword: "",
        });

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setApiMessage({
          type: "error",
          text: result.message || "Đăng nhập thất bại. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setApiMessage({
        type: "error",
        text: "Đăng nhập thất bại. Vui lòng thử lại.",
      });
    }
  };

  // Xử lý đăng ký
  const handleRegister = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        TenDangNhap: formData.fullName,
        Email: formData.email,
        MatKhau: formData.password,
        SDT: formData.phone,
      });

      setApiMessage({
        type: "success",
        text: "Đăng ký thành công! Vui lòng đăng nhập.",
      });

      setTimeout(() => {
        toggleForm();
      }, 2000);
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      setApiMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng thử lại.",
      });
    }
  };

  // Xử lý quên mật khẩu - Gửi OTP
  const handleForgotPassword = async () => {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, {
        email: formData.email,
      });
      setApiMessage({
        type: "success",
        text: "Mã OTP đã được gửi đến email của bạn!",
      });
      changeForgotPasswordStep(2);
    } catch (error) {
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Gửi OTP thất bại!",
      });
    }
  };

  // Xử lý xác thực OTP
  const handleVerifyOTP = async () => {
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email: formData.email,
        otp: formData.otp,
      });
      setApiMessage({
        type: "success",
        text: "Xác thực OTP thành công!",
      });
      changeForgotPasswordStep(3);
    } catch (error) {
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Xác minh OTP thất bại!",
      });
    }
  };

  // Xử lý đặt lại mật khẩu
  const handleResetPassword = async () => {
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email: formData.email,
        newPassword: formData.newPassword,
      });
      setApiMessage({
        type: "success",
        text: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.",
      });

      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setForgotPasswordStep(0);
          setIsLogin(true);
          setFormData({
            account: "",
            email: "",
            phone: "",
            fullName: "",
            password: "",
            confirmPassword: "",
            otp: "",
            newPassword: "",
          });
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 400);
      }, 1500);
    } catch (error) {
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Đặt lại mật khẩu thất bại!",
      });
    }
  };

  // Xử lý đăng nhập/đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (forgotPasswordStep === 1) {
      if (!formData.email) {
        setApiMessage({ type: "error", text: "Vui lòng nhập email!" });
        return;
      }
      setIsLoading(true);
      await handleForgotPassword();
      setIsLoading(false);
      return;
    }

    if (forgotPasswordStep === 2) {
      if (!formData.otp) {
        setApiMessage({ type: "error", text: "Vui lòng nhập mã OTP!" });
        return;
      }
      setIsLoading(true);
      await handleVerifyOTP();
      setIsLoading(false);
      return;
    }

    if (forgotPasswordStep === 3) {
      if (!formData.newPassword) {
        setApiMessage({ type: "error", text: "Vui lòng nhập mật khẩu mới!" });
        return;
      }
      if (formData.newPassword.length < 8) {
        setApiMessage({
          type: "error",
          text: "Mật khẩu phải có ít nhất 8 ký tự!",
        });
        return;
      }
      setIsLoading(true);
      await handleResetPassword();
      setIsLoading(false);
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setApiMessage({ type: "", text: "" });

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      console.error("Lỗi:", error);
      setApiMessage({
        type: "error",
        text: "Có lỗi xảy ra. Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng nhập Google
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const getFormTitle = () => {
    if (forgotPasswordStep === 1) return "Quên mật khẩu";
    if (forgotPasswordStep === 2) return "Xác thực OTP";
    if (forgotPasswordStep === 3) return "Đặt lại mật khẩu";
    return isLogin ? "Đăng nhập" : "Đăng ký tài khoản";
  };

  const getFormSubtitle = () => {
    if (forgotPasswordStep === 1) return "Nhập email để nhận mã OTP";
    if (forgotPasswordStep === 2) return "Nhập mã OTP đã gửi đến email";
    if (forgotPasswordStep === 3) return "Nhập mật khẩu mới của bạn";
    return isLogin
      ? "Chào mừng bạn quay trở lại!"
      : "Tạo tài khoản mới để bắt đầu";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-300";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "Rất yếu";
    if (passwordStrength === 1) return "Yếu";
    if (passwordStrength === 2) return "Trung bình";
    if (passwordStrength === 3) return "Mạnh";
    return "Rất mạnh";
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-64 h-64 rounded-full opacity-20 -top-10 -left-10 bg-gradient-to-br from-blue-400 to-indigo-600 animate-pulse"></div>
        <div
          className="absolute rounded-full w-96 h-96 opacity-20 -bottom-20 -right-20 bg-gradient-to-br from-indigo-400 to-blue-600 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full transition-all duration-500 transform max-w-7xl">
        {/* Card Container */}
        <div className="overflow-hidden bg-white shadow-2xl rounded-3xl">
          <div className="grid md:grid-cols-2">
            {/* ✅ Left Side - Form với animation fade */}
            <div
              className={`p-8 transition-all duration-500 ${
                isLogin ? "md:order-1" : "md:order-2"
              } ${
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {/* Header */}
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {getFormTitle()}
                </h2>
                <p className="text-sm font-medium text-gray-600">
                  {getFormSubtitle()}
                </p>
              </div>

              {/* API Message */}
              {apiMessage.text && (
                <div
                  className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-500 ${
                    apiMessage.type === "success"
                      ? "bg-green-100 text-green-800 border-2 border-green-300"
                      : "bg-red-100 text-red-800 border-2 border-red-300"
                  }`}
                >
                  {apiMessage.text}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form quên mật khẩu - Nhập email */}
                {forgotPasswordStep === 1 && (
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                        <FaEnvelope className="text-lg" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full py-3 pl-12 pr-4 text-base font-medium transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-400"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Form quên mật khẩu - Nhập OTP */}
                {forgotPasswordStep === 2 && (
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      Mã OTP
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                        <FaLock className="text-lg" />
                      </div>
                      <input
                        type="text"
                        name="otp"
                        placeholder="000000"
                        value={formData.otp}
                        onChange={handleChange}
                        maxLength="6"
                        className="w-full py-3 pl-12 pr-4 text-base font-medium tracking-widest text-center transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-400"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Form quên mật khẩu - Mật khẩu mới */}
                {forgotPasswordStep === 3 && (
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                        <FaLock className="text-lg" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="Nhập mật khẩu mới"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full py-3 pl-12 pr-12 text-base font-medium transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 flex items-center justify-center w-12 h-full text-gray-400 transition-colors duration-300 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <FaEyeSlash size={20} />
                        ) : (
                          <FaEye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Form đăng nhập/đăng ký bình thường */}
                {forgotPasswordStep === 0 && (
                  <div className="space-y-4">
                    {/* Layout 2 cột cho form đăng ký */}
                    <div
                      className={`${
                        !isLogin ? "grid md:grid-cols-2 gap-4" : "space-y-4"
                      }`}
                    >
                      {/* Họ tên (chỉ hiện khi đăng ký) */}
                      {!isLogin && (
                        <div>
                          <label className="block mb-2 text-sm font-bold text-gray-700">
                            Họ và tên
                          </label>
                          <div className="relative">
                            <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                              <FaUser className="text-lg" />
                            </div>
                            <input
                              type="text"
                              name="fullName"
                              placeholder="Nguyễn Văn A"
                              value={formData.fullName}
                              onChange={handleChange}
                              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-blue-400 ${
                                errors.fullName
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-gray-300 focus:border-blue-500"
                              }`}
                            />
                          </div>
                          {errors.fullName && (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              {errors.fullName}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Số điện thoại (chỉ hiện khi đăng ký) */}
                      {!isLogin && (
                        <div>
                          <label className="block mb-2 text-sm font-bold text-gray-700">
                            Số điện thoại
                          </label>
                          <div className="relative">
                            <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                              <FaPhone className="text-lg" />
                            </div>
                            <input
                              type="tel"
                              name="phone"
                              placeholder="0123456789"
                              value={formData.phone}
                              onChange={handleChange}
                              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-blue-400 ${
                                errors.phone
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-gray-300 focus:border-blue-500"
                              }`}
                            />
                          </div>
                          {errors.phone && (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Email - Full width */}
                    <div>
                      <label className="block mb-2 text-sm font-bold text-gray-700">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                          <FaEnvelope className="text-lg" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-blue-400 ${
                            errors.email
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 focus:border-blue-500"
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Password fields - 2 columns for register */}
                    <div
                      className={`${
                        !isLogin ? "grid md:grid-cols-2 gap-4" : "space-y-4"
                      }`}
                    >
                      {/* Mật khẩu */}
                      <div>
                        <label className="block mb-2 text-sm font-bold text-gray-700">
                          Mật khẩu
                        </label>
                        <div className="relative">
                          <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                            <FaLock className="text-lg" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-blue-400 ${
                              errors.password
                                ? "border-red-500 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 flex items-center justify-center w-12 h-full text-gray-400 transition-colors duration-300 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <FaEyeSlash size={20} />
                            ) : (
                              <FaEye size={20} />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* Xác nhận mật khẩu (chỉ hiện khi đăng ký) */}
                      {!isLogin && (
                        <div>
                          <label className="block mb-2 text-sm font-bold text-gray-700">
                            Xác nhận mật khẩu
                          </label>
                          <div className="relative">
                            <div className="absolute left-0 flex items-center justify-center w-12 h-full text-gray-400">
                              <FaLock className="text-lg" />
                            </div>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              placeholder="••••••••"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-blue-400 ${
                                errors.confirmPassword
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-gray-300 focus:border-blue-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-0 flex items-center justify-center w-12 h-full text-gray-400 transition-colors duration-300 hover:text-gray-600"
                            >
                              {showConfirmPassword ? (
                                <FaEyeSlash size={20} />
                              ) : (
                                <FaEye size={20} />
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              {errors.confirmPassword}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Password Strength Indicator - Full width below password fields */}
                    {!isLogin && formData.password && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-600">
                            Độ mạnh mật khẩu:
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              passwordStrength <= 1
                                ? "text-red-600"
                                : passwordStrength === 2
                                ? "text-yellow-600"
                                : passwordStrength === 3
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          >
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden bg-gray-200 rounded-full">
                          <div
                            className={`h-full transition-all duration-500 ${getPasswordStrengthColor()}`}
                            style={{
                              width: `${(passwordStrength / 4) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full mt-2 py-3.5 rounded-xl font-bold text-base text-white transition-all duration-300 shadow-lg relative overflow-hidden ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm text-white font-semibold"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </div>
                  ) : forgotPasswordStep === 1 ? (
                    "Gửi mã OTP"
                  ) : forgotPasswordStep === 2 ? (
                    "Xác thực OTP"
                  ) : forgotPasswordStep === 3 ? (
                    "Đặt lại mật khẩu"
                  ) : isLogin ? (
                    "Đăng nhập"
                  ) : (
                    "Đăng ký ngay"
                  )}
                </button>

                {/* Nút quay lại cho form quên mật khẩu */}
                {forgotPasswordStep > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (forgotPasswordStep === 1) {
                        changeForgotPasswordStep(0);
                      } else {
                        changeForgotPasswordStep(forgotPasswordStep - 1);
                      }
                    }}
                    className="flex items-center justify-center w-full gap-2 py-3 text-base font-bold text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 active:scale-95"
                  >
                    <FaArrowLeft />
                    <span>Quay lại</span>
                  </button>
                )}

                {/* Quên mật khẩu và Google Login */}
                {isLogin && forgotPasswordStep === 0 && (
                  <>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => changeForgotPasswordStep(1)}
                        className="text-sm font-bold text-blue-600 transition-colors duration-300 hover:text-blue-800 hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 font-semibold text-gray-600 bg-white">
                          Hoặc đăng nhập với
                        </span>
                      </div>
                    </div>

                    {/* Google Sign In Button - Official Style */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex items-center justify-center w-full gap-3 px-4 py-3 text-base font-semibold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 shadow-sm rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:shadow-md active:scale-95"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Tiếp tục với Google</span>
                    </button>
                  </>
                )}
              </form>

              {/* Toggle form */}
              {forgotPasswordStep === 0 && (
                <div className="mt-6 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                    <button
                      type="button"
                      onClick={toggleForm}
                      className="font-bold text-blue-600 transition-colors duration-300 hover:text-blue-800 hover:underline"
                    >
                      {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* ✅ Right Side - Image/Branding với animation smooth */}
            <div
              className={`hidden md:flex items-center justify-center p-12 bg-gradient-to-br from-blue-600 to-indigo-600 transition-all duration-700 ease-in-out ${
                isLogin ? "md:order-2" : "md:order-1"
              } ${
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              <div className="text-center text-white">
                <div className="mb-6 animate-bounce">
                  <svg
                    className="w-24 h-24 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-3xl font-bold">
                  {isLogin ? "Chào mừng trở lại!" : "Tham gia cùng chúng tôi!"}
                </h3>
                <p className="mb-6 text-lg font-medium text-blue-100">
                  {isLogin
                    ? "Đăng nhập để khám phá hàng nghìn bất động sản chất lượng"
                    : "Tạo tài khoản để trải nghiệm những tiện ích tuyệt vời"}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <div className="mb-2 text-3xl font-bold">10K+</div>
                    <div className="text-sm font-medium text-blue-100">
                      Bất động sản
                    </div>
                  </div>
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <div className="mb-2 text-3xl font-bold">5K+</div>
                    <div className="text-sm font-medium text-blue-100">
                      Người dùng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
