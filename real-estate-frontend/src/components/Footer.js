import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa"
import "../styles/global.css"

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Về Chúng Tôi</h3>
          <p>
            Chúng tôi là nền tảng bất động sản hàng đầu, kết nối người mua và người bán một cách hiệu quả và tin cậy.
            Với hàng nghìn bất động sản chất lượng và dịch vụ tư vấn chuyên nghiệp.
          </p>
          <p>
            <strong>Sứ mệnh:</strong> Giúp mọi người tìm được ngôi nhà mơ ước với giá cả hợp lý và dịch vụ tốt nhất.
          </p>
        </div>

        <div className="footer-section">
          <h3>Liên Hệ Hỗ Trợ</h3>
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <div>
              <p>
                <strong>Email hỗ trợ:</strong>
              </p>
              <p>
                <a href="mailto:thuankapa989@gmail.com">thuankapa989@gmail.com</a>
              </p>
              <p>
                <a href="mailto:nnssaker1208@gmail.com">nnssaker1208@gmail.com</a>
              </p>
            </div>
          </div>

          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <div>
              <p>
                <strong>Hotline:</strong>
              </p>
              <p>
                <a href="tel:0921365431">0921 365 431</a> (Hỗ trợ 24/7)
              </p>
              <p>
                <a href="tel:0932164356">0932 164 356</a> (Tư vấn chuyên nghiệp)
              </p>
            </div>
          </div>

          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <div>
              <p>
                <strong>Địa chỉ:</strong>
              </p>
              <p>Văn phòng chính: 123 Đường ABC, Quận 1, TP.HCM</p>
              <p>Chi nhánh: 456 Đường XYZ, Quận Ba Đình, Hà Nội</p>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h3>Dịch Vụ</h3>
          <ul>
            <li>🏠 Mua bán bất động sản</li>
            <li>🏢 Cho thuê văn phòng</li>
            <li>🏡 Tư vấn đầu tư</li>
            <li>📋 Thẩm định giá</li>
            <li>⚖️ Hỗ trợ pháp lý</li>
            <li>💰 Hỗ trợ vay vốn</li>
            <li>📸 Chụp ảnh bất động sản</li>
            <li>📱 Quảng cáo trực tuyến</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Thông Tin Hữu Ích</h3>
          <ul>
            <li>
              <a href="/huong-dan">📖 Hướng dẫn sử dụng</a>
            </li>
            <li>
              <a href="/quy-dinh">📜 Quy định đăng tin</a>
            </li>
            <li>
              <a href="/bao-mat">🔒 Chính sách bảo mật</a>
            </li>
            <li>
              <a href="/dieu-khoan">📋 Điều khoản sử dụng</a>
            </li>
            <li>
              <a href="/faq">❓ Câu hỏi thường gặp</a>
            </li>
            <li>
              <a href="/tin-tuc">📰 Tin tức thị trường</a>
            </li>
          </ul>

          <div style={{ marginTop: "20px" }}>
            <h4>Theo dõi chúng tôi</h4>
            <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
              <a href="#" style={{ fontSize: "1.5rem" }}>
                <FaFacebook />
              </a>
              <a href="#" style={{ fontSize: "1.5rem" }}>
                <FaTwitter />
              </a>
              <a href="#" style={{ fontSize: "1.5rem" }}>
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Bất Động Sản Thuận Cường. All Rights Reserved.</p>
        <p>Thiết kế và phát triển bởi đội ngũ chuyên nghiệp</p>
      </div>
    </footer>
  )
}

export default Footer
