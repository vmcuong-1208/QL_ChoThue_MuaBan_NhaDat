"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center flex flex-col items-center">
        <div className="text-5xl mb-4">
          {status === "processing" && (
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          )}
          {status === "success" && <span>✅</span>}
          {status === "failed" && <span>❌</span>}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {status === "processing" && "Đang xử lý..."}
          {status === "success" && "Thanh toán thành công!"}
          {status === "failed" && "Thanh toán thất bại!"}
        </h2>

        <p className="text-gray-600 mb-6">{message}</p>

        {status !== "processing" && (
          <button
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition"
            onClick={() => navigate("/")}
          >
            Quay về trang chủ
          </button>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccess
