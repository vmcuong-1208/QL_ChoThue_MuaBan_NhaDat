"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import "../styles/PaymentSuccess.css"

const PaymentSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState("processing")
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...")

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const resultCode = urlParams.get("resultCode")
    const orderId = urlParams.get("orderId")
    const transId = urlParams.get("transId")

    console.log("Payment callback params:", {
      resultCode,
      orderId,
      transId,
    })

    if (resultCode === "0") {
      // Thanh toán thành công
      setStatus("success")
      setMessage("Thanh toán thành công! Tài khoản của bạn đã được nâng cấp.")

      // Tự động chuyển về trang chủ sau 3 giây
      setTimeout(() => {
        navigate("/")
        window.location.reload() // Reload để cập nhật UI
      }, 3000)
    } else {
      // Thanh toán thất bại
      setStatus("failed")
      setMessage("Thanh toán thất bại. Vui lòng thử lại.")

      // Tự động chuyển về trang chủ sau 3 giây
      setTimeout(() => {
        navigate("/")
      }, 3000)
    }
  }, [location, navigate])

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <div className={`payment-icon ${status}`}>
          {status === "processing" && <div className="spinner"></div>}
          {status === "success" && <span>✅</span>}
          {status === "failed" && <span>❌</span>}
        </div>

        <h2 className="payment-title">
          {status === "processing" && "Đang xử lý..."}
          {status === "success" && "Thanh toán thành công!"}
          {status === "failed" && "Thanh toán thất bại!"}
        </h2>

        <p className="payment-message">{message}</p>

        {status !== "processing" && (
          <button className="return-button" onClick={() => navigate("/")}>
            Quay về trang chủ
          </button>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccess
