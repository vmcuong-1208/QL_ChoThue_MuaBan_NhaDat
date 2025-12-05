"use client"

import { useEffect, useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaSpinner, FaCheckCircle, FaTimes, FaSignOutAlt } from "react-icons/fa"
import "../styles/MoMoCallback.css" // Giả định file CSS

// Hook tùy chỉnh để xử lý đăng xuất, tham khảo từ component AdminPanel
const useAuthActions = () => {
  const navigate = useNavigate()
  
  // Hàm đăng xuất, xóa token và chuyển hướng đến trang đăng nhập/xác thực
  const handleLogout = useCallback(() => {
    // Giả định bạn sử dụng localStorage để lưu token và thông tin user
    localStorage.removeItem("token")
    localStorage.removeItem("userInfo")
    // Hoặc gọi context/reducer để cập nhật state auth thành null
    
    // Chuyển hướng đến trang đăng nhập/xác thực
    navigate("/auth") 
  }, [navigate])

  return { handleLogout }
}

const MoMoCallback = () => {
  const [status, setStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { handleLogout } = useAuthActions() // Sử dụng hook đăng xuất

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const resultCode = queryParams.get("resultCode")
    const orderId = queryParams.get("orderId")

    if (resultCode === "0") {
      setStatus("success")
      setMessage("Thanh toán thành công! Để áp dụng ưu đãi nâng cấp, vui lòng Đăng xuất và Đăng nhập lại.")

      // Thực hiện đăng xuất sau 3 giây
      setTimeout(() => {
        handleLogout() 
      }, 3000)

    } else {
      setStatus("error")
      setMessage("Thanh toán thất bại hoặc bị hủy. Vui lòng thử lại sau.")

      // Chuyển hướng về trang hồ sơ sau 3 giây
      setTimeout(() => {
        navigate("/ho-so")
      }, 3000)
    }
  }, [location, navigate, handleLogout]) // Thêm handleLogout vào dependencies

  return (
    <div className="momo-callback-container">
      <div className="momo-callback-card">
        {/* Loading State */}
        {status === "loading" && (
          <>
            <FaSpinner className="spinning" size={50} />
            <h2>Đang xử lý thanh toán...</h2>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <FaCheckCircle size={50} color="#28a745" />
            <h2>Thanh toán thành công!</h2>
            <p>{message}</p>
            <p className="redirect-message">Đang tự động **Đăng xuất** để áp dụng ưu đãi...</p>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <FaTimes size={50} color="#dc3545" />
            <h2>Thanh toán thất bại</h2>
            <p>{message}</p>
            <p className="redirect-message">Đang chuyển hướng về trang cá nhân...</p>
          </>
        )}

        {/* Button */}
        <button 
            className="momo-callback-button" 
            onClick={status === "success" ? handleLogout : () => navigate("/ho-so")}
        >
          {status === "success" ? (
            <>
              <FaSignOutAlt /> Đăng xuất ngay
            </>
          ) : (
            <>
              Quay lại trang cá nhân
            </>
          )}
        </button>
        
        {status === "success" && (
          <p className="login-hint">Sau khi Đăng xuất, vui lòng **Đăng nhập lại** để kích hoạt gói mới.</p>
        )}

      </div>
    </div>
  )
}

export default MoMoCallback