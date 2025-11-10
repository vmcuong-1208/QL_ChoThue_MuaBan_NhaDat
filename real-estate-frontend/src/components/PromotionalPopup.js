"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaTimes, FaGift } from "react-icons/fa"
import "../styles/PromotionalPopup.css"

const PromotionalPopup = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true)
  const navigate = useNavigate()

  // Ngăn scroll khi popup mở
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isVisible])

  const handleClose = () => {
    setIsVisible(false)
    onClose()
    const scrollPosition = sessionStorage.getItem("homeScrollPosition")
    navigate("/", { state: { scrollPosition: scrollPosition } })
  }

  if (!isVisible) return null

  return (
    <div className="promotional-overlay">
      <div className="promotional-popup">
        <button className="close-button" onClick={handleClose}>
          <FaTimes />
        </button>

        <div className="promotional-header">
          <FaGift className="gift-icon" />
          <h2>Ưu đãi đặc biệt cho thành viên!</h2>
        </div>

        <div className="promotional-content">
          <p className="promo-subtitle">Đăng nhập ngay để nhận những ưu đãi tuyệt vời</p>

          <div className="promotion-benefits">
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <div className="benefit-text">
                <h3>Giá ưu đãi</h3>
                <p>Nhận giá tốt nhất cho những bất động sản yêu thích</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <div className="benefit-text">
                <h3>Lưu yêu thích</h3>
                <p>Lưu và theo dõi các bất động sản quan tâm</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <div className="benefit-text">
                <h3>Liên hệ trực tiếp</h3>
                <p>Nhắn tin trực tiếp với người bán mà không cần xác thực</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <div className="benefit-text">
                <h3>Thông báo mới</h3>
                <p>Nhận thông báo khi có bất động sản phù hợp</p>
              </div>
            </div>
          </div>

          <div className="promo-code-section">
            <p className="promo-code-label">Mã khuyến mại đặc biệt:</p>
            <div className="promo-code-box">
              <span className="promo-code">MEMBER2024</span>
              <button
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText("MEMBER2024")
                  alert("Đã sao chép mã khuyến mại!")
                }}
              >
                Sao chép
              </button>
            </div>
          </div>
        </div>

        <div className="promotional-actions">
          <button className="btn-dismiss" onClick={handleClose}>
            Xem chi tiết sau
          </button>
          <a href="/auth" className="btn-login">
            Đăng nhập ngay
          </a>
        </div>

        <p className="promotional-footer">
          Không có tài khoản? <a href="/auth">Đăng ký miễn phí</a>
        </p>
      </div>
    </div>
  )
}

export default PromotionalPopup
