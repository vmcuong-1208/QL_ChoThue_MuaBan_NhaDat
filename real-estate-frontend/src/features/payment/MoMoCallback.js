"use client"

import { useEffect, useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaSpinner, FaCheckCircle, FaTimes, FaSignOutAlt } from "react-icons/fa"

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center flex flex-col items-center">
        {/* Loading State */}
        {status === "loading" && (
          <>
            <FaSpinner className="animate-spin text-pink-600 mb-4" size={50} />
            <h2 className="text-xl font-bold text-gray-800">Đang xử lý thanh toán...</h2>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <FaCheckCircle className="text-green-500 mb-4" size={50} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-3">{message}</p>
            <p className="text-sm text-blue-600 animate-pulse font-medium">Đang tự động <strong>Đăng xuất</strong> để áp dụng ưu đãi...</p>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <FaTimes className="text-red-500 mb-4" size={50} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-3">{message}</p>
            <p className="text-sm text-gray-500">Đang chuyển hướng về trang cá nhân...</p>
          </>
        )}

        {/* Button */}
        <button 
            className="mt-6 w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
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
          <p className="text-xs text-gray-500 mt-4">Sau khi Đăng xuất, vui lòng <strong>Đăng nhập lại</strong> để kích hoạt gói mới.</p>
        )}

      </div>
    </div>
  )
}

export default MoMoCallback
