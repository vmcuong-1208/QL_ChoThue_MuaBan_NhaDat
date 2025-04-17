"use client"

import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"

// Thay đổi API_URL để đảm bảo đúng với backend
// const API_URL = "http://localhost:5000/api"
// Nếu bạn đang sử dụng URL khác trong Postman, hãy thay đổi thành URL đó
const API_URL = "http://localhost:5000/api" // Thay đổi URL này nếu cần

// Tạo context
const AuthContext = createContext()

// Hook để sử dụng context
export const useAuth = () => useContext(AuthContext)

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Kiểm tra token và lấy thông tin người dùng khi component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          setLoading(false)
          return
        }

        // Gọi API để lấy thông tin người dùng từ token
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setCurrentUser(response.data)
      } catch (error) {
        console.error("Lỗi xác thực:", error)
        localStorage.removeItem("token") // Xóa token nếu không hợp lệ
      } finally {
        setLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  // Hàm đăng nhập
  const login = async (email, password) => {
    try {
      setError(null)

      // Log để debug
      console.log("Đang gửi request đăng nhập với:", { Email: email, MatKhau: password })

      const response = await axios.post(`${API_URL}/auth/login`, {
        Email: email,
        MatKhau: password,
      })

      // Log response để debug
      console.log("Response từ server:", response.data)

      // Kiểm tra cấu trúc response
      if (!response.data.token) {
        console.error("Token không tồn tại trong response:", response.data)
        return { success: false, message: "Định dạng response không hợp lệ" }
      }

      const { token } = response.data
      localStorage.setItem("token", token)

      try {
        // Lấy thông tin người dùng sau khi đăng nhập
        const userResponse = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("Thông tin người dùng:", userResponse.data)
        setCurrentUser(userResponse.data)
        localStorage.setItem("userInfo", JSON.stringify(userResponse.data));
        const loginEvent = new Event("login-success");
        window.dispatchEvent(loginEvent);
        return { success: true }
      } catch (userError) {
        console.error("Lỗi khi lấy thông tin người dùng:", userError)
        // Vẫn trả về success vì đăng nhập thành công, chỉ lỗi khi lấy thông tin
        return { success: true, message: "Đăng nhập thành công nhưng không lấy được thông tin người dùng" }
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error)
      console.error("Response error:", error.response?.data)
      setError(error.response?.data?.message || "Đăng nhập thất bại")
      return { success: false, message: error.response?.data?.message || "Đăng nhập thất bại" }
    }
  }

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem("token")
    setCurrentUser(null)
  }

  // Hàm đăng ký
  const register = async (userData) => {
    try {
      setError(null)
      const response = await axios.post(`${API_URL}/auth/register`, userData)
      return { success: true, message: response.data.message }
    } catch (error) {
      setError(error.response?.data?.message || "Đăng ký thất bại")
      return { success: false, message: error.response?.data?.message || "Đăng ký thất bại" }
    }
  }

  // Hàm cập nhật thông tin người dùng
  const updateProfile = async (userData) => {
    try {
      setError(null)
      const token = localStorage.getItem("token")

      const response = await axios.put(`${API_URL}/auth/update`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Cập nhật thông tin người dùng trong state
      setCurrentUser((prev) => ({ ...prev, ...userData }))

      return { success: true, message: response.data.message }
    } catch (error) {
      setError(error.response?.data?.message || "Cập nhật thất bại")
      return { success: false, message: error.response?.data?.message || "Cập nhật thất bại" }
    }
  }

  // Kiểm tra quyền truy cập
  const hasPermission = (requiredRoles) => {
    if (!currentUser) return false

    if (!requiredRoles || requiredRoles.length === 0) return true

    return requiredRoles.includes(currentUser.LoaiTaiKhoan)
  }

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
