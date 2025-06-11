"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const userInfo = localStorage.getItem("userInfo")
    return userInfo ? JSON.parse(userInfo) : null
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token")
  })

  const [loading, setLoading] = useState(true)

  // Load user info from server
  const loadUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setCurrentUser(data.user)
          localStorage.setItem("userInfo", JSON.stringify(data.user))
          return data.user
        }
      }
      return null
    } catch (error) {
      console.error("Failed to load user info:", error)
      return null
    }
  }

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("token")

      if (savedToken) {
        try {
          // Verify token với server
          const response = await fetch(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.valid) {
              setToken(savedToken)
              // Load fresh user info from server
              await loadUserInfo(savedToken)
            } else {
              // Token không hợp lệ, xóa khỏi localStorage
              localStorage.removeItem("token")
              localStorage.removeItem("userInfo")
              setToken(null)
              setCurrentUser(null)
            }
          } else {
            // Token không hợp lệ, xóa khỏi localStorage
            localStorage.removeItem("token")
            localStorage.removeItem("userInfo")
            setToken(null)
            setCurrentUser(null)
          }
        } catch (error) {
          console.error("Token verification failed:", error)
          localStorage.removeItem("token")
          localStorage.removeItem("userInfo")
          setToken(null)
          setCurrentUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      console.log("Đang gửi request đăng nhập với:", { Email: email, MatKhau: password })

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email,
          MatKhau: password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const { token: authToken, user } = data

        // Lưu vào localStorage
        localStorage.setItem("token", authToken)
        localStorage.setItem("userInfo", JSON.stringify(user))

        // Cập nhật state
        setToken(authToken)
        setCurrentUser(user)

        return { success: true, message: "Đăng nhập thành công!" }
      } else {
        return { success: false, message: data.message || "Đăng nhập thất bại" }
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error)
      return {
        success: false,
        message: "Đăng nhập thất bại. Vui lòng thử lại.",
      }
    }
  }

  const logout = async () => {
    try {
      // Xóa khỏi localStorage
      localStorage.removeItem("token")
      localStorage.removeItem("userInfo")

      // Reset state
      setToken(null)
      setCurrentUser(null)

      return { success: true }
    } catch (error) {
      console.error("Lỗi đăng xuất:", error)
      return { success: false, message: "Đăng xuất thất bại" }
    }
  }

  const updateProfile = async (formData) => {
    try {
      setLoading(true)
      const authToken = localStorage.getItem("token")

      let response
      if (formData.get && formData.get("paymentToken")) {
        // Handle account upgrade
        response = await fetch(`${API_URL}/auth/upgrade`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentToken: formData.get("paymentToken"),
            paymentMethod: formData.get("paymentMethod"),
            upgradeType: formData.get("upgradeType"),
          }),
        })
      } else {
        // Handle regular profile update
        response = await fetch(`${API_URL}/auth/update`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        })
      }

      const data = await response.json()

      if (data.success) {
        const updatedUser = data.user
        setCurrentUser(updatedUser)
        localStorage.setItem("userInfo", JSON.stringify(updatedUser))
        return { success: true, user: updatedUser }
      } else {
        throw new Error(data.message || "Update failed")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (requiredRoles) => {
    if (!currentUser || !currentUser.LoaiTaiKhoan) return false

    const userRole = currentUser.LoaiTaiKhoan.toLowerCase()
    return requiredRoles.some((role) => role.toLowerCase() === userRole)
  }

  const contextData = {
    currentUser,
    token,
    loading,
    login,
    logout,
    updateProfile,
    hasPermission,
    setCurrentUser,
    setToken,
    loadUserInfo,
  }

  return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
}

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
