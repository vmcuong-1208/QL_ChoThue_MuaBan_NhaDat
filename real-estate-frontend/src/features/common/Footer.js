import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="pt-12 pb-6 text-gray-300 bg-gray-900">
      <div className="max-w-screen-xl px-5 mx-auto">
        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Section 1: Về Chúng Tôi */}
          <div>
            <h3 className="mb-4 text-2xl font-bold text-white">Về Chúng Tôi</h3>
            <p className="mb-3 text-base leading-relaxed">
              Chúng tôi là nền tảng bất động sản hàng đầu, kết nối người mua và
              người bán một cách hiệu quả và tin cậy. Với hàng nghìn bất động
              sản chất lượng và dịch vụ tư vấn chuyên nghiệp.
            </p>
            <p className="text-base leading-relaxed">
              <strong className="text-white">Sứ mệnh:</strong> Giúp mọi người
              tìm được ngôi nhà mơ ước với giá cả hợp lý và dịch vụ tốt nhất.
            </p>
          </div>

          {/* Section 2: Liên Hệ Hỗ Trợ */}
          <div>
            <h3 className="mb-4 text-2xl font-bold text-white">
              Liên Hệ Hỗ Trợ
            </h3>

            {/* Email */}
            <div className="flex items-start gap-3 mb-4">
              <FaEnvelope className="flex-shrink-0 mt-1 text-xl text-blue-400" />
              <div>
                <p className="mb-1 text-base font-semibold text-white">
                  Email hỗ trợ:
                </p>
                <p className="text-base">
                  <a
                    href="mailto:thuankapa989@gmail.com"
                    className="transition-colors hover:text-blue-400"
                  >
                    thuankapa989@gmail.com
                  </a>
                </p>
                <p className="text-base">
                  <a
                    href="mailto:nnssaker1208@gmail.com"
                    className="transition-colors hover:text-blue-400"
                  >
                    nnssaker1208@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 mb-4">
              <FaPhone className="flex-shrink-0 mt-1 text-xl text-green-400" />
              <div>
                <p className="mb-1 text-base font-semibold text-white">
                  Hotline:
                </p>
                <p className="text-base">
                  <a
                    href="tel:0921365431"
                    className="transition-colors hover:text-green-400"
                  >
                    0921 365 431
                  </a>{" "}
                  (Hỗ trợ 24/7)
                </p>
                <p className="text-base">
                  <a
                    href="tel:0932164356"
                    className="transition-colors hover:text-green-400"
                  >
                    0932 164 356
                  </a>{" "}
                  (Tư vấn chuyên nghiệp)
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="flex-shrink-0 mt-1 text-xl text-red-400" />
              <div>
                <p className="mb-1 text-base font-semibold text-white">
                  Địa chỉ:
                </p>
                <p className="text-base">
                  Văn phòng chính: 123 Đường ABC, Quận 1, TP.HCM
                </p>
                <p className="text-base">
                  Chi nhánh: 456 Đường XYZ, Quận Ba Đình, Hà Nội
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Dịch Vụ */}
          <div>
            <h3 className="mb-4 text-2xl font-bold text-white">Dịch Vụ</h3>
            <ul className="space-y-2 text-base">
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                🏠 Mua bán bất động sản
              </li>
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                🏢 Cho thuê văn phòng
              </li>
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                🏡 Tư vấn đầu tư
              </li>
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                📋 Thẩm định giá
              </li>
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                ⚖️ Hỗ trợ pháp lý
              </li>
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                💰 Hỗ trợ vay vốn
              </li>
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                📸 Chụp ảnh bất động sản
              </li>
              <li className="transition-colors cursor-pointer hover:text-blue-400">
                📱 Quảng cáo trực tuyến
              </li>
            </ul>
          </div>

          {/* Section 4: Thông Tin Hữu Ích */}
          <div>
            <h3 className="mb-4 text-2xl font-bold text-white">
              Thông Tin Hữu Ích
            </h3>
            <ul className="mb-6 space-y-2 text-base">
              <li>
                <a
                  href="/huong-dan"
                  className="transition-colors hover:text-blue-400"
                >
                  📖 Hướng dẫn sử dụng
                </a>
              </li>
              <li>
                <a
                  href="/quy-dinh"
                  className="transition-colors hover:text-blue-400"
                >
                  📜 Quy định đăng tin
                </a>
              </li>
              <li>
                <a
                  href="/bao-mat"
                  className="transition-colors hover:text-blue-400"
                >
                  🔒 Chính sách bảo mật
                </a>
              </li>
              <li>
                <a
                  href="/dieu-khoan"
                  className="transition-colors hover:text-blue-400"
                >
                  📋 Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="transition-colors hover:text-blue-400"
                >
                  ❓ Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a
                  href="/tin-tuc"
                  className="transition-colors hover:text-blue-400"
                >
                  📰 Tin tức thị trường
                </a>
              </li>
            </ul>

            {/* Social Media */}
            <div>
              <h4 className="mb-3 text-xl font-semibold text-white">
                Theo dõi chúng tôi
              </h4>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/cuong.saker1208/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xl text-blue-500 transition-colors hover:text-blue-400"
                  aria-label="Facebook"
                >
                  <FaFacebook />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xl transition-colors text-sky-400 hover:text-sky-300"
                  aria-label="Twitter"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xl text-pink-500 transition-colors hover:text-pink-400"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 text-center border-t border-gray-700">
          <p className="mb-1 text-base text-gray-400">
            © 2025 Bất Động Sản{" "}
            <span className="font-bold text-green-400">3MAN</span>. All Rights
            Reserved.
          </p>
          <p className="text-base text-gray-500">
            Thiết kế và phát triển bởi đội ngũ chuyên nghiệp
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
