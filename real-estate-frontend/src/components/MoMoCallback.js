"use client"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaSpinner, FaCheckCircle, FaTimes } from "react-icons/fa"
import "../styles/MoMoCallback.css"

const MoMoCallback = () => {
  const [status, setStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const resultCode = queryParams.get("resultCode")
    const orderId = queryParams.get("orderId")

    if (resultCode === "0") {
      setStatus("success")
      setMessage("Thanh toán thành công! Tài khoản của bạn đã được nâng cấp.")

      // Redirect sau 3 giây
      setTimeout(() => {
        navigate("/ho-so")
      }, 3000)
    } else {
      setStatus("error")
      setMessage("Thanh toán thất bại hoặc bị hủy. Vui lòng thử lại sau.")

      // Redirect sau 3 giây
      setTimeout(() => {
        navigate("/ho-so")
      }, 3000)
    }
  }, [location, navigate])

  return (
    <div className="momo-callback-container">
      <div className="momo-callback-card">
        {status === "loading" && (
          <>
            <FaSpinner className="spinning" size={50} />
            <h2>Đang xử lý thanh toán...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <FaCheckCircle size={50} color="#28a745" />
            <h2>Thanh toán thành công!</h2>
            <p>{message}</p>
            <p>Đang chuyển hướng về trang cá nhân...</p>
          </>
        )}

        {status === "error" && (
          <>
            <FaTimes size={50} color="#dc3545" />
            <h2>Thanh toán thất bại</h2>
            <p>{message}</p>
            <p>Đang chuyển hướng về trang cá nhân...</p>
          </>
        )}

        <button className="momo-callback-button" onClick={() => navigate("/ho-so")}>
          Quay lại trang cá nhân
        </button>
      </div>
    </div>
  )
}

export default MoMoCallback
