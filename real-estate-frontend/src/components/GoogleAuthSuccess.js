"use client"

import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const GoogleAuthSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setToken, setCurrentUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get("token")
    const userStr = searchParams.get("user")

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))

        // Lưu token và user info
        localStorage.setItem("token", token)
        localStorage.setItem("userInfo", JSON.stringify(user))

        // Cập nhật context
        setToken(token)
        setCurrentUser(user)

        // Redirect về trang chủ
        navigate("/", { replace: true })
      } catch (error) {
        console.error("Error parsing user data:", error)
        navigate("/auth?error=invalid_data", { replace: true })
      }
    } else {
      navigate("/auth?error=missing_data", { replace: true })
    }
  }, [searchParams, navigate, setToken, setCurrentUser])

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div
        className="spinner"
        style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 2s linear infinite",
        }}
      ></div>
      <p style={{ marginTop: "20px" }}>Đang xử lý đăng nhập Google...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default GoogleAuthSuccess
