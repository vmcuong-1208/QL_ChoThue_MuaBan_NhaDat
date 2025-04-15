"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa"
import axios from "axios" // Thêm axios để gọi API
import "../styles/LoginRegister.css"

// URL API backend
const API_URL = "http://localhost:5000/api" // Thay đổi URL này theo cấu hình của bạn

const LoginRegister = () => {
  const navigate = useNavigate()

  // State cho form
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    account: "",
    email: "",
    phone: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [apiMessage, setApiMessage] = useState({ type: "", text: "" })

  // Hiệu ứng chuyển đổi
  const [animate, setAnimate] = useState(false)

  // Kiểm tra nếu đã đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      navigate("/")
    }
  }, [navigate])

  // Xử lý chuyển đổi giữa đăng nhập và đăng ký
  const toggleForm = () => {
    setAnimate(true)
    setTimeout(() => {
      setIsLogin(!isLogin)
      setFormData({
        account: "",
        email: "",
        phone: "",
        fullName: "",
        password: "",
        confirmPassword: "",
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

    if (isLogin) {
      if (!formData.email) newErrors.email = "Vui lòng nhập email"
      if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu"
    } else {
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

      const response = await axios.post(`${API_URL}/auth/login`, {
        Email: formData.email,
        MatKhau: formData.password,
      })

      console.log("Response từ server:", response.data)

      setApiMessage({
        type: "success",
        text: "Đăng nhập thành công!",
      })

      // Lưu token vào localStorage
      localStorage.setItem("token", response.data.token)

      // Lưu thông tin người dùng cơ bản
      const userInfo = {
        Email: formData.email,
        isLoggedIn: true,
      }
      localStorage.setItem("userInfo", JSON.stringify(userInfo))

      // Chuyển hướng hoặc cập nhật UI sau khi đăng nhập thành công
      console.log("Đăng nhập thành công:", response.data)

      // Đặt lại form
      setFormData({
        account: "",
        email: "",
        phone: "",
        fullName: "",
        password: "",
        confirmPassword: "",
      })

      // Chuyển hướng về trang chủ
      setTimeout(() => {
        navigate("/")
      }, 1000)
    } catch (error) {
      console.error("Lỗi đăng nhập:", error)
      setApiMessage({
        type: "error",
        text: error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
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

      // Chuyển sang form đăng nhập sau khi đăng ký thành công
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

  // Xử lý đăng nhập/đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault()

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
    // Tích hợp OAuth với Google
    alert("Đăng nhập bằng Google (cần tích hợp OAuth)")
  }

  return (
    <div className="auth-container">
      <div className={`auth-box ${animate ? "fade-out" : "fade-in"}`}>
        <div className="auth-header">
          <h2>{isLogin ? "Đăng nhập" : "Đăng ký"}</h2>
          <p className="auth-subtitle">{isLogin ? "Chào mừng bạn quay trở lại!" : "Tạo tài khoản để bắt đầu"}</p>
        </div>

        {apiMessage.text && <div className={`api-message ${apiMessage.type}`}>{apiMessage.text}</div>}

        <form onSubmit={handleSubmit}>
          {isLogin ? (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          ) : (
            <>
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

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
              </div>
            </>
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

          {isLogin && (
            <div className="forgot-password">
              <a href="#">Quên mật khẩu?</a>
            </div>
          )}

          <button type="submit" className={`submit-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
            {isLoading ? <span className="spinner"></span> : isLogin ? "Đăng nhập" : "Đăng ký"}
          </button>

          {isLogin && (
            <>
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

        <div className="auth-footer">
          <p>
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
            <button type="button" className="toggle-form" onClick={toggleForm}>
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginRegister
