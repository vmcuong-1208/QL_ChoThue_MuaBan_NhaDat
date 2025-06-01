"use client"

import { useState } from "react"
import { FaTimes, FaQrcode, FaCopy, FaCheckCircle } from "react-icons/fa"
import "../styles/PaymentModal.css"

const PaymentModal = ({ isOpen, onClose, onSuccess, amount = 500000, purpose = "Nâng cấp tài khoản môi giới" }) => {
  const [selectedMethod, setSelectedMethod] = useState("momo")
  const [paymentToken, setPaymentToken] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Mock payment info - trong thực tế sẽ lấy từ API
  const paymentInfo = {
    momo: {
      name: "MoMo",
      qrCode: "/placeholder.svg?height=200&width=200&text=MoMo+QR",
      phoneNumber: "0123456789",
      accountName: "CONG TY BDS THUAN CUONG",
      amount: amount,
      content: `${purpose} - ${Date.now()}`,
    },
    vnpay: {
      name: "VNPay",
      qrCode: "/placeholder.svg?height=200&width=200&text=VNPay+QR",
      bankAccount: "1234567890",
      bankName: "Ngân hàng Vietcombank",
      accountName: "CONG TY BDS THUAN CUONG",
      amount: amount,
      content: `${purpose} - ${Date.now()}`,
    },
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitToken = async () => {
    if (!paymentToken.trim()) {
      alert("Vui lòng nhập mã giao dịch")
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call to verify payment
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In thực tế, gọi API để verify payment token
      // const response = await axios.post('/api/payments/verify', {
      //   token: paymentToken,
      //   method: selectedMethod,
      //   amount: amount
      // })

      onSuccess(paymentToken, selectedMethod)
      onClose()
    } catch (error) {
      alert("Có lỗi xảy ra khi xác thực thanh toán. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const currentPayment = paymentInfo[selectedMethod]

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Thanh toán nâng cấp tài khoản</h2>
          <button className="payment-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="payment-modal-content">
          {/* Payment Method Selection */}
          <div className="payment-methods">
            <h3>Chọn phương thức thanh toán</h3>
            <div className="payment-method-options">
              <button
                className={`payment-method-btn ${selectedMethod === "momo" ? "active" : ""}`}
                onClick={() => setSelectedMethod("momo")}
              >
                <img src="/placeholder.svg?height=40&width=40&text=MoMo" alt="MoMo" />
                <span>MoMo</span>
              </button>
              <button
                className={`payment-method-btn ${selectedMethod === "vnpay" ? "active" : ""}`}
                onClick={() => setSelectedMethod("vnpay")}
              >
                <img src="/placeholder.svg?height=40&width=40&text=VNPay" alt="VNPay" />
                <span>VNPay</span>
              </button>
            </div>
          </div>

          {/* Payment Information */}
          <div className="payment-info">
            <div className="payment-amount">
              <h3>Số tiền: {formatCurrency(currentPayment.amount)}</h3>
              <p>Mục đích: {purpose}</p>
            </div>

            <div className="payment-details">
              <div className="qr-section">
                <h4>Quét mã QR để thanh toán</h4>
                <div className="qr-code">
                  <FaQrcode size={200} />
                  <p>Mã QR {currentPayment.name}</p>
                </div>
              </div>

              <div className="payment-instructions">
                <h4>Hoặc chuyển khoản thủ công</h4>

                {selectedMethod === "momo" ? (
                  <div className="payment-details-list">
                    <div className="detail-item">
                      <span className="label">Số điện thoại:</span>
                      <span className="value">
                        {currentPayment.phoneNumber}
                        <button className="copy-btn" onClick={() => copyToClipboard(currentPayment.phoneNumber)}>
                          <FaCopy />
                        </button>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Tên tài khoản:</span>
                      <span className="value">{currentPayment.accountName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Số tiền:</span>
                      <span className="value">
                        {formatCurrency(currentPayment.amount)}
                        <button className="copy-btn" onClick={() => copyToClipboard(currentPayment.amount.toString())}>
                          <FaCopy />
                        </button>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Nội dung:</span>
                      <span className="value">
                        {currentPayment.content}
                        <button className="copy-btn" onClick={() => copyToClipboard(currentPayment.content)}>
                          <FaCopy />
                        </button>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="payment-details-list">
                    <div className="detail-item">
                      <span className="label">Ngân hàng:</span>
                      <span className="value">{currentPayment.bankName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Số tài khoản:</span>
                      <span className="value">
                        {currentPayment.bankAccount}
                        <button className="copy-btn" onClick={() => copyToClipboard(currentPayment.bankAccount)}>
                          <FaCopy />
                        </button>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Tên tài khoản:</span>
                      <span className="value">{currentPayment.accountName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Số tiền:</span>
                      <span className="value">
                        {formatCurrency(currentPayment.amount)}
                        <button className="copy-btn" onClick={() => copyToClipboard(currentPayment.amount.toString())}>
                          <FaCopy />
                        </button>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Nội dung:</span>
                      <span className="value">
                        {currentPayment.content}
                        <button className="copy-btn" onClick={() => copyToClipboard(currentPayment.content)}>
                          <FaCopy />
                        </button>
                      </span>
                    </div>
                  </div>
                )}

                {copied && (
                  <div className="copy-success">
                    <FaCheckCircle /> Đã sao chép!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Token Input */}
          <div className="payment-token-section">
            <h4>Sau khi thanh toán, nhập mã giao dịch</h4>
            <div className="token-input-group">
              <input
                type="text"
                placeholder="Nhập mã giao dịch (Transaction ID)"
                value={paymentToken}
                onChange={(e) => setPaymentToken(e.target.value)}
                className="token-input"
              />
              <button
                className="submit-token-btn"
                onClick={handleSubmitToken}
                disabled={isSubmitting || !paymentToken.trim()}
              >
                {isSubmitting ? "Đang xác thực..." : "Xác nhận thanh toán"}
              </button>
            </div>
            <p className="token-note">
              Mã giao dịch có thể tìm thấy trong lịch sử giao dịch của ví điện tử hoặc tin nhắn xác nhận từ ngân hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
