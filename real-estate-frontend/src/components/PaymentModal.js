"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import "../styles/PaymentModal.css"

const PaymentModal = ({ isOpen, onClose, onSuccess, amount = 500000, description = "Nâng cấp tài khoản môi giới" }) => {
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState("")
  const [showQR, setShowQR] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(null)

  // Reset state khi modal đóng/mở
  useEffect(() => {
    if (!isOpen) {
      setPaymentData(null)
      setError("")
      setShowQR(false)
      setLoading(false)
      setIsPolling(false)
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [isOpen])

  const checkPaymentStatus = async (orderId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:5000/api/momo-payment/check-status/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Payment status:", data)

        if (data.success && data.transaction.status === "SUCCESS") {
          setIsPolling(false)
          if (pollingInterval) {
            clearInterval(pollingInterval)
          }
          alert("Thanh toán thành công! Tài khoản đã được nâng cấp.")
          onSuccess && onSuccess()
          onClose()
          window.location.reload() // Reload để cập nhật UI
        } else if (data.transaction.status === "FAILED") {
          setIsPolling(false)
          if (pollingInterval) {
            clearInterval(pollingInterval)
          }
          alert("Thanh toán thất bại!")
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
    }
  }

  const startPolling = (orderId) => {
    setIsPolling(true)
    const interval = setInterval(() => {
      checkPaymentStatus(orderId)
    }, 3000) // Check mỗi 3 giây

    setPollingInterval(interval)

    // Dừng polling sau 5 phút
    setTimeout(() => {
      setIsPolling(false)
      clearInterval(interval)
    }, 300000)
  }

  const handleMoMoPayment = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Vui lòng đăng nhập để thanh toán")
      }

      console.log("Creating MoMo payment...")

      const response = await fetch("http://localhost:5000/api/momo-payment/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          orderInfo: description,
          extraData: JSON.stringify({
            service: "upgrade_account",
            userId: JSON.parse(atob(token.split(".")[1])).userId,
          }),
        }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Payment data received:", data)

      if (data.success && data.payUrl) {
        setPaymentData(data)
        setShowQR(true)

        // Tự động mở trang thanh toán sau 2 giây
        setTimeout(() => {
          window.open(data.payUrl, "_blank")
        }, 2000)

        startPolling(data.orderId)
      } else {
        throw new Error(data.message || "Không thể tạo giao dịch MoMo")
      }
    } catch (error) {
      console.error("Error creating MoMo payment:", error)
      setError(error.message || "Có lỗi xảy ra khi tạo giao dịch")
    } finally {
      setLoading(false)
    }
  }

  const copyPaymentLink = () => {
    if (paymentData?.payUrl) {
      navigator.clipboard.writeText(paymentData.payUrl)
      alert("Đã copy link thanh toán!")
    }
  }

  const openMoMoPage = () => {
    if (paymentData?.payUrl) {
      window.open(paymentData.payUrl, "_blank")
    }
  }

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  if (!isOpen) return null

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Thanh toán nâng cấp tài khoản</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="payment-modal-content">
          <div className="payment-info">
            <div className="amount-display">
              <span className="amount-label">Số tiền:</span>
              <span className="amount-value">{amount.toLocaleString("vi-VN")} đ</span>
            </div>
            <div className="service-description">
              <p>Mục đích: {description}</p>
            </div>
          </div>

          {!showQR ? (
            <div className="payment-methods">
              <div className="momo-section">
                <div className="momo-image-placeholder">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                    alt="MoMo Payment"
                    className="placeholder-image"
                  />
                </div>

                <div className="momo-features">
                  <h3>Thanh toán qua MoMo</h3>
                  <div className="feature-list">
                    <div className="feature-item">
                      <span className="feature-icon">✅</span>
                      <span>Thanh toán an toàn, bảo mật</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✅</span>
                      <span>Hỗ trợ nhiều phương thức</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✅</span>
                      <span>Xử lý nhanh chóng</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button className="momo-payment-button" onClick={handleMoMoPayment} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Đang tạo giao dịch...
                    </>
                  ) : (
                    <>
                      <span className="momo-icon">💳</span>
                      Thanh toán với MoMo
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="qr-payment-section">
              <div className="qr-container">
                <h3>Quét mã QR để thanh toán</h3>
                <div className="qr-code-wrapper">
                  <QRCodeSVG value={paymentData.payUrl} size={200} level="M" includeMargin={true} className="qr-code" />
                </div>
                <p className="qr-instruction">Mở app MoMo và quét mã QR này để thanh toán</p>
              </div>

              <div className="payment-actions">
                <button className="copy-link-button" onClick={copyPaymentLink}>
                  📋 Copy link thanh toán
                </button>

                <button className="open-momo-button" onClick={openMoMoPage}>
                  🔗 Mở trang thanh toán MoMo
                </button>
              </div>

              <button className="back-button" onClick={() => setShowQR(false)}>
                ← Quay lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
