"use client"

import { useState } from "react"
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa"
import "../styles/Contact.css"

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Giả lập gửi form
    setTimeout(() => {
      setSubmitStatus("success")
      setIsSubmitting(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })

      setTimeout(() => {
        setSubmitStatus(null)
      }, 3000)
    }, 1000)
  }

  return (
    <div className="contact-container">
      <div className="contact-hero">
        <div className="container">
          <h1>Liên hệ với chúng tôi</h1>
          <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn tìm kiếm bất động sản phù hợp</p>
        </div>
      </div>

      <div className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Thông tin liên hệ */}
            <div className="contact-info">
              <div className="contact-intro">
                <h2>Thông tin liên hệ</h2>
                <p>
                  Chúng tôi là đội ngũ chuyên nghiệp trong lĩnh vực bất động sản với nhiều năm kinh nghiệm. Cam kết mang
                  đến cho khách hàng những dịch vụ tốt nhất và hỗ trợ tận tình trong việc tìm kiếm, mua bán, cho thuê
                  bất động sản.
                </p>
              </div>

              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaPhone />
                  </div>
                  <div className="contact-text">
                    <h3>Số điện thoại</h3>
                    <p>
                      <a href="tel:0921365431">0921 365 431</a>
                    </p>
                    <p>
                      <a href="tel:0932164356">0932 164 356</a>
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaEnvelope />
                  </div>
                  <div className="contact-text">
                    <h3>Email</h3>
                    <p>
                      <a href="mailto:thuankapa989@gmail.com">thuankapa989@gmail.com</a>
                    </p>
                    <p>
                      <a href="mailto:nnssaker1208@gmail.com">nnssaker1208@gmail.com</a>
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="contact-text">
                    <h3>Địa chỉ</h3>
                    <p>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                    <p>456 Đường XYZ, Quận 3, TP. Hồ Chí Minh</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaClock />
                  </div>
                  <div className="contact-text">
                    <h3>Giờ làm việc</h3>
                    <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                    <p>Thứ 7 - Chủ nhật: 9:00 - 17:00</p>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <h3>Theo dõi chúng tôi</h3>
                <div className="social-icons">
                  <a href="#" className="social-icon facebook">
                    <FaFacebook />
                  </a>
                  <a href="#" className="social-icon twitter">
                    <FaTwitter />
                  </a>
                  <a href="#" className="social-icon instagram">
                    <FaInstagram />
                  </a>
                  <a href="#" className="social-icon linkedin">
                    <FaLinkedin />
                  </a>
                </div>
              </div>
            </div>

            {/* Form liên hệ */}
            <div className="contact-form-section">
              <div className="contact-form-container">
                <h2>Gửi tin nhắn cho chúng tôi</h2>
                <p>Điền thông tin vào form bên dưới và chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.</p>

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Họ và tên *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập họ và tên của bạn"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Số điện thoại *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập địa chỉ email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Chủ đề</label>
                    <select id="subject" name="subject" value={formData.subject} onChange={handleInputChange}>
                      <option value="">Chọn chủ đề</option>
                      <option value="buy">Mua bất động sản</option>
                      <option value="sell">Bán bất động sản</option>
                      <option value="rent">Cho thuê</option>
                      <option value="consult">Tư vấn</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Tin nhắn *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="5"
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-button" disabled={isSubmitting}>
                    {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn"}
                  </button>

                  {submitStatus === "success" && (
                    <div className="success-message">
                      Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dịch vụ của chúng tôi */}
      <div className="services-section">
        <div className="container">
          <h2>Dịch vụ của chúng tôi</h2>
          <div className="services-grid">
            <div className="service-item">
              <div className="service-icon">🏠</div>
              <h3>Mua bán nhà đất</h3>
              <p>Hỗ trợ tìm kiếm và giao dịch mua bán các loại bất động sản</p>
            </div>
            <div className="service-item">
              <div className="service-icon">🏢</div>
              <h3>Cho thuê</h3>
              <p>Dịch vụ cho thuê nhà, căn hộ, văn phòng với giá cạnh tranh</p>
            </div>
            <div className="service-item">
              <div className="service-icon">💼</div>
              <h3>Tư vấn đầu tư</h3>
              <p>Tư vấn chuyên nghiệp về đầu tư bất động sản hiệu quả</p>
            </div>
            <div className="service-item">
              <div className="service-icon">📋</div>
              <h3>Thủ tục pháp lý</h3>
              <p>Hỗ trợ hoàn tất các thủ tục pháp lý liên quan đến bất động sản</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bản đồ */}
      <div className="map-section">
        <div className="container">
          <h2>Vị trí của chúng tôi</h2>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4326002567134!2d106.69975731533414!3d10.776889992309626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3332a4d9%3A0x6d1b4c0b0b0b0b0b!2zVHAuIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bản đồ vị trí"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
