"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa"
import axios from "axios"
import "../styles/LoginRegister.css"
import { useAuth } from "../context/AuthContext"

const API_URL = "http://localhost:5000/api"

const LoginRegister = () => {
  const navigate = useNavigate()
  const { token, login } = useAuth()

  // State cho form
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0) // 0: normal, 1: email, 2: otp, 3: new password

  const [formData, setFormData] = useState({
    account: "",
    email: "",
    phone: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    otp: "",
    newPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [apiMessage, setApiMessage] = useState({ type: "", text: "" })

  // Hiệu ứng chuyển đổi
  const [animate, setAnimate] = useState(false)

  // Kiểm tra nếu đã đăng nhập
  useEffect(() => {
    if (token) {
      navigate("/")
    }
  }, [navigate, token])

  // Xử lý chuyển đổi giữa đăng nhập và đăng ký
  const toggleForm = () => {
    setAnimate(true)
    setTimeout(() => {
      setIsLogin(!isLogin)
      setForgotPasswordStep(0)
      setFormData({
        account: "",
        email: "",
        phone: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        otp: "",
        newPassword: "",
      })
      setErrors({})
      setApiMessage({ type: "", text: "" })
      setAnimate(false)
    }, 300)
  }

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  // Kiểm tra độ mạnh của mật khẩu
  useEffect(() => {
    if (formData.password) {
      let strength = 0
      if (formData.password.length >= 8) strength += 1
      if (/[A-Z]/.test(formData.password)) strength += 1
      if (/[0-9]/.test(formData.password)) strength += 1
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [formData.password])

  // Xác thực form
  const validateForm = () => {
    const newErrors = {}

    if (isLogin && forgotPasswordStep === 0) {
      if (!formData.email) newErrors.email = "Vui lòng nhập email"
      if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu"
    } else if (!isLogin) {
      if (!formData.fullName) newErrors.fullName = "Vui lòng nhập họ tên"

      if (!formData.email) {
        newErrors.email = "Vui lòng nhập email"
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email không hợp lệ"
      }

      if (!formData.phone) {
        newErrors.phone = "Vui lòng nhập số điện thoại"
      } else if (!/^[0-9]{10}$/.test(formData.phone)) {
        newErrors.phone = "Số điện thoại phải có 10 chữ số"
      }

      if (!formData.password) {
        newErrors.password = "Vui lòng nhập mật khẩu"
      } else if (formData.password.length < 8) {
        newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự"
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu không khớp"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Xử lý đăng nhập
  const handleLogin = async () => {
    try {
      console.log("Đang gửi request đăng nhập với:", { Email: formData.email, MatKhau: formData.password })

      const result = await login(formData.email, formData.password)

      if (result.success) {
        setApiMessage({
          type: "success",
          text: "Đăng nhập thành công!",
        })

        setFormData({
          account: "",
          email: "",
          phone: "",
          fullName: "",
          password: "",
          confirmPassword: "",
          otp: "",
          newPassword: "",
        })

        setTimeout(() => {
          navigate("/")
        }, 1000)
      } else {
        setApiMessage({
          type: "error",
          text: result.message || "Đăng nhập thất bại. Vui lòng thử lại.",
        })
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error)
      setApiMessage({
        type: "error",
        text: "Đăng nhập thất bại. Vui lòng thử lại.",
      })
    }
  }

  // Xử lý đăng ký
  const handleRegister = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        TenDangNhap: formData.fullName,
        Email: formData.email,
        MatKhau: formData.password,
        SDT: formData.phone,
      })

      setApiMessage({
        type: "success",
        text: "Đăng ký thành công! Vui lòng đăng nhập.",
      })

      console.log("Đăng ký thành công:", response.data)

      setTimeout(() => {
        toggleForm()
      }, 2000)
    } catch (error) {
      console.error("Lỗi đăng ký:", error)
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.",
      })
    }
  }

  // Xử lý quên mật khẩu - Gửi OTP
  const handleForgotPassword = async () => {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, {
        email: formData.email,
      })
      setApiMessage({
        type: "success",
        text: "Mã OTP đã được gửi đến email của bạn!",
      })
      setForgotPasswordStep(2)
    } catch (error) {
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Gửi OTP thất bại!",
      })
    }
  }

  // Xử lý xác thực OTP
  const handleVerifyOTP = async () => {
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email: formData.email,
        otp: formData.otp,
      })
      setApiMessage({
        type: "success",
        text: "Xác thực OTP thành công!",
      })
      setForgotPasswordStep(3)
    } catch (error) {
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Xác minh OTP thất bại!",
      })
    }
  }

  // Xử lý đặt lại mật khẩu
  const handleResetPassword = async () => {
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email: formData.email,
        newPassword: formData.newPassword,
      })
      setApiMessage({
        type: "success",
        text: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.",
      })
      setForgotPasswordStep(0)
      setIsLogin(true)
      setFormData({
        account: "",
        email: "",
        phone: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        otp: "",
        newPassword: "",
      })
    } catch (error) {
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Đặt lại mật khẩu thất bại!",
      })
    }
  }

  // Xử lý đăng nhập/đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (forgotPasswordStep === 1) {
      if (!formData.email) {
        setApiMessage({ type: "error", text: "Vui lòng nhập email!" })
        return
      }
      setIsLoading(true)
      await handleForgotPassword()
      setIsLoading(false)
      return
    }

    if (forgotPasswordStep === 2) {
      if (!formData.otp) {
        setApiMessage({ type: "error", text: "Vui lòng nhập mã OTP!" })
        return
      }
      setIsLoading(true)
      await handleVerifyOTP()
      setIsLoading(false)
      return
    }

    if (forgotPasswordStep === 3) {
      if (!formData.newPassword) {
        setApiMessage({ type: "error", text: "Vui lòng nhập mật khẩu mới!" })
        return
      }
      if (formData.newPassword.length < 8) {
        setApiMessage({ type: "error", text: "Mật khẩu phải có ít nhất 8 ký tự!" })
        return
      }
      setIsLoading(true)
      await handleResetPassword()
      setIsLoading(false)
      return
    }

    if (!validateForm()) return

    setIsLoading(true)
    setApiMessage({ type: "", text: "" })

    try {
      if (isLogin) {
        await handleLogin()
      } else {
        await handleRegister()
      }
    } catch (error) {
      console.error("Lỗi:", error)
      setApiMessage({
        type: "error",
        text: "Có lỗi xảy ra. Vui lòng thử lại sau.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý đăng nhập Google
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`
  }

  const getFormTitle = () => {
    if (forgotPasswordStep === 1) return "Quên mật khẩu"
    if (forgotPasswordStep === 2) return "Xác thực OTP"
    if (forgotPasswordStep === 3) return "Đặt lại mật khẩu"
    return isLogin ? "Đăng nhập" : "Đăng ký"
  }

  const getFormSubtitle = () => {
    if (forgotPasswordStep === 1) return "Nhập email để nhận mã OTP"
    if (forgotPasswordStep === 2) return "Nhập mã OTP đã gửi đến email"
    if (forgotPasswordStep === 3) return "Nhập mật khẩu mới"
    return isLogin ? "Chào mừng bạn quay trở lại!" : "Tạo tài khoản để bắt đầu"
  }

  return (
    <div className="auth-container">
      <div className={`auth-box ${animate ? "fade-out" : "fade-in"}`}>
        <div className="auth-header">
          <h2>{getFormTitle()}</h2>
          <p className="auth-subtitle">{getFormSubtitle()}</p>
        </div>

        {apiMessage.text && <div className={`api-message ${apiMessage.type}`}>{apiMessage.text}</div>}

        <form onSubmit={handleSubmit}>
          {/* Form quên mật khẩu - Nhập email */}
          {forgotPasswordStep === 1 && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Form quên mật khẩu - Nhập OTP */}
          {forgotPasswordStep === 2 && (
            <div className="form-group">
              <label htmlFor="otp">Mã OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                placeholder="Nhập mã OTP 6 số"
                value={formData.otp}
                onChange={handleChange}
                maxLength="6"
                required
              />
            </div>
          )}

          {/* Form quên mật khẩu - Mật khẩu mới */}
          {forgotPasswordStep === 3 && (
            <div className="form-group">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  placeholder="Nhập mật khẩu mới"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}

          {/* Form đăng nhập/đăng ký bình thường */}
          {forgotPasswordStep === 0 && (
            <>
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="fullName">Họ và tên</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? "error" : ""}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={isLogin ? "Nhập email của bạn" : "example@email.com"}
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="0123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "error" : ""}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "error" : ""}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}

                {!isLogin && formData.password && (
                  <div className="password-strength">
                    <div className="strength-meter">
                      <div className={`strength-meter-fill strength-${passwordStrength}`}></div>
                    </div>
                    <span className="strength-text">
                      {passwordStrength === 0 && "Rất yếu"}
                      {passwordStrength === 1 && "Yếu"}
                      {passwordStrength === 2 && "Trung bình"}
                      {passwordStrength === 3 && "Mạnh"}
                      {passwordStrength === 4 && "Rất mạnh"}
                    </span>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Nhập lại mật khẩu"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? "error" : ""}
                    />
                  </div>
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              )}
            </>
          )}

          <button type="submit" className={`submit-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
            {isLoading ? (
              <span className="spinner"></span>
            ) : forgotPasswordStep === 1 ? (
              "Gửi OTP"
            ) : forgotPasswordStep === 2 ? (
              "Xác thực OTP"
            ) : forgotPasswordStep === 3 ? (
              "Đặt lại mật khẩu"
            ) : isLogin ? (
              "Đăng nhập"
            ) : (
              "Đăng ký"
            )}
          </button>

          {/* Nút quay lại cho form quên mật khẩu */}
          {forgotPasswordStep > 0 && (
            <button
              type="button"
              className="back-button"
              onClick={() => {
                if (forgotPasswordStep === 1) {
                  setForgotPasswordStep(0)
                } else {
                  setForgotPasswordStep(forgotPasswordStep - 1)
                }
                setApiMessage({ type: "", text: "" })
              }}
            >
              Quay lại
            </button>
          )}

          {/* Đăng nhập Google và quên mật khẩu */}
          {isLogin && forgotPasswordStep === 0 && (
            <>
              <div className="forgot-password">
                <button type="button" onClick={() => setForgotPasswordStep(1)}>
                  Quên mật khẩu?
                </button>
              </div>

              <div className="divider">
                <span>Hoặc</span>
              </div>

              <button type="button" className="google-button" onClick={handleGoogleLogin}>
                <FaGoogle />
                <span>Đăng nhập với Google</span>
              </button>
            </>
          )}
        </form>

        {/* Toggle form */}
        {forgotPasswordStep === 0 && (
          <div className="auth-footer">
            <p>
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              <button type="button" className="toggle-form" onClick={toggleForm}>
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginRegister
