"use client"
import { FaInfoCircle, FaMapMarkedAlt, FaCopy, FaExternalLinkAlt } from "react-icons/fa"

const GoogleMapGuide = ({ onClose }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Đã sao chép vào clipboard!")
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaMapMarkedAlt /> Hướng dẫn nhúng Google Maps
          </h2>
          <button
            className="text-white/80 hover:text-white text-2xl font-semibold leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-700">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">1</span>
              Truy cập Google Maps
            </h3>
            <p className="text-gray-600 ml-9">
              Mở{" "}
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
                Google Maps <FaExternalLinkAlt size={12} />
              </a>{" "}
              và tìm kiếm địa điểm bất động sản của bạn.
            </p>
            <div className="ml-9 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img src="/images/design-mode/googlemap_1280x720-800-resize.jpg" alt="Tìm kiếm địa điểm trên Google Maps" className="w-full h-auto object-cover" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">2</span>
              Chia sẻ địa điểm
            </h3>
            <p className="text-gray-600 ml-9">Nhấp vào nút "Chia sẻ" hoặc biểu tượng chia sẻ trên Google Maps.</p>
            <div className="ml-9 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img src="/images/design-mode/cach-chia-se-vi-tri-tren-google-maps-6-1.jpg" alt="Nhấp vào nút chia sẻ" className="w-full h-auto object-cover" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">3</span>
              Chọn "Nhúng bản đồ"
            </h3>
            <p className="text-gray-600 ml-9">Trong cửa sổ chia sẻ, chọn tab "Nhúng bản đồ" hoặc "Embed a map".</p>
            <div className="ml-9 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img src="/images/design-mode/map-4.png" alt="Chọn Nhúng bản đồ" className="w-full h-auto object-cover" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">4</span>
              Sao chép mã nhúng
            </h3>
            <p className="text-gray-600 ml-9">Sao chép toàn bộ mã HTML (iframe) được cung cấp.</p>
            <div className="ml-9 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img src="/images/design-mode/sao-chep-html-map.jpg" alt="Sao chép mã nhúng" className="w-full h-auto object-cover" />
            </div>  
            <div className="ml-9 mt-3 bg-gray-900 text-gray-100 p-4 rounded-lg relative font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
                <code>
                  &lt;iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4241674197956!2d106.69877!3d10.778486!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzQyLjYiTiAxMDbCsDQxJzU1LjYiRQ!5e0!3m2!1svi!2s!4v1620123456789!5m2!1svi!2s"
                  width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"&gt;&lt;/iframe&gt;
                </code>
              </pre>
              <button
                className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-sans text-xs flex items-center gap-1.5 transition"
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

          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">5</span>
              Dán mã vào trường "Nhúng Google Maps"
            </h3>
            <p className="text-gray-600 ml-9">Dán mã iframe vào trường "Nhúng Google Maps" trong form đăng tin bất động sản.</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm">
            <FaInfoCircle className="text-blue-600 mt-0.5 shrink-0" size={18} />
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
