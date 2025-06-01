"use client"
import { FaInfoCircle, FaMapMarkedAlt, FaCopy, FaExternalLinkAlt } from "react-icons/fa"
import "../styles/GoogleMapGuide.css"

const GoogleMapGuide = ({ onClose }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Đã sao chép vào clipboard!")
  }

  return (
    <div className="map-guide-overlay">
      <div className="map-guide-container">
        <div className="map-guide-header">
          <h2>
            <FaMapMarkedAlt /> Hướng dẫn nhúng Google Maps
          </h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="map-guide-content">
          <div className="guide-step">
            <h3>
              <span className="step-number">1</span> Truy cập Google Maps
            </h3>
            <p>
              Mở{" "}
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">
                Google Maps <FaExternalLinkAlt size={12} />
              </a>{" "}
              và tìm kiếm địa điểm bất động sản của bạn.
            </p>
            <div className="guide-image">
              <img src="https://cdn.tgdd.vn/Files/2020/11/10/1305861/googlemap_1280x720-800-resize.jpg" alt="Tìm kiếm địa điểm trên Google Maps" />
            </div>
          </div>

          <div className="guide-step">
            <h3>
              <span className="step-number">2</span> Chia sẻ địa điểm
            </h3>
            <p>Nhấp vào nút "Chia sẻ" hoặc biểu tượng chia sẻ trên Google Maps.</p>
            <div className="guide-image">
              <img src="https://cellphones.com.vn/sforum/wp-content/uploads/2024/01/cach-chia-se-vi-tri-tren-google-maps-6-1.jpg" alt="Nhấp vào nút chia sẻ" />
            </div>
          </div>

          <div className="guide-step">
            <h3>
              <span className="step-number">3</span> Chọn "Nhúng bản đồ"
            </h3>
            <p>Trong cửa sổ chia sẻ, chọn tab "Nhúng bản đồ" hoặc "Embed a map".</p>
            <div className="guide-image">
              <img src="https://mona.media/wp-content/uploads/2017/09/map-4.png" alt="Chọn Nhúng bản đồ" />
            </div>
          </div>

          <div className="guide-step">
            <h3>
              <span className="step-number">4</span> Sao chép mã nhúng
            </h3>
            <p>Sao chép toàn bộ mã HTML (iframe) được cung cấp.</p>
            <div className="guide-image">
              <img src="https://light.com.vn/Files/26/thu-thuat-marketing-online/sao-chep-html-map.jpg" alt="Sao chép mã nhúng" />
            </div>
            <div className="code-example">
              <pre>
                <code>
                  &lt;iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4241674197956!2d106.69877!3d10.778486!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzQyLjYiTiAxMDbCsDQxJzU1LjYiRQ!5e0!3m2!1svi!2s!4v1620123456789!5m2!1svi!2s"
                  width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"&gt;&lt;/iframe&gt;
                </code>
              </pre>
              <button
                className="copy-button"
                onClick={() =>
                  copyToClipboard(
                    '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4241674197956!2d106.69877!3d10.778486!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzQyLjYiTiAxMDbCsDQxJzU1LjYiRQ!5e0!3m2!1svi!2s!4v1620123456789!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
                  )
                }
              >
                <FaCopy /> Sao chép ví dụ
              </button>
            </div>
          </div>

          <div className="guide-step">
            <h3>
              <span className="step-number">5</span> Dán mã vào trường "Nhúng Google Maps"
            </h3>
            <p>Dán mã iframe vào trường "Nhúng Google Maps" trong form đăng tin bất động sản.</p>
          </div>

          <div className="guide-note">
            <FaInfoCircle />
            <p>
              <strong>Lưu ý:</strong> Đảm bảo rằng bạn sao chép toàn bộ mã iframe, bắt đầu từ &lt;iframe và kết thúc
              bằng &lt;/iframe&gt;. Hệ thống sẽ tự động điều chỉnh kích thước để phù hợp với trang web.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleMapGuide
