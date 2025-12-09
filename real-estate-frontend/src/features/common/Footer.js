import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaShieldAlt,
  FaFileContract,
} from "react-icons/fa";
import { API_URL } from "../../services/api";

const Footer = () => {
  const [aboutInfo, setAboutInfo] = useState({
    TenDoanhNghiep: "CÔNG TY CỔ PHẦN CÔNG NGHỆ & ĐẦU TƯ BẤT ĐỘNG SẢN 3MAN",
    DiaChi: "Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh",
    Email: "contact@bds3man.vn",
    Hotline: "1900 8888",
    SoDienThoai: "0901 234 567",
    GioiThieu:
      "Chúng tôi là nền tảng bất động sản hàng đầu, kết nối người mua và người bán một cách hiệu quả và tin cậy. Với hàng nghìn bất động sản chất lượng và dịch vụ tư vấn chuyên nghiệp.",
    SuMenh: "Giúp mọi người tìm được ngôi nhà mơ ước với giá cả hợp lý và dịch vụ tốt nhất.",
  });

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await axios.get(`${API_URL}/content/about`);
        if (res.data && res.data.Id) {
          setAboutInfo(res.data);
        }
      } catch (err) {
        // Dùng dữ liệu fallback mặc định
      }
    };
    fetchAbout();
  }, []);

  return (
    <footer className="pt-14 pb-8 text-slate-300 bg-slate-950 border-t border-slate-800">
      <div className="max-w-screen-xl px-5 mx-auto">
        <div className="grid grid-cols-1 gap-10 mb-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Section 1: Về Chúng Tôi */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Bất Động Sản</span>
              <span className="text-emerald-400">3MAN</span>
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {aboutInfo.GioiThieu
                ? aboutInfo.GioiThieu.slice(0, 190) + "..."
                : "Chúng tôi là nền tảng bất động sản hàng đầu, kết nối người mua và người bán một cách hiệu quả và tin cậy."}
            </p>
            <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
              <strong className="text-amber-300 block mb-1">🎯 Sứ mệnh:</strong>
              {aboutInfo.SuMenh ||
                "Giúp mọi người tìm được ngôi nhà mơ ước với giá cả hợp lý và dịch vụ tốt nhất."}
            </p>
          </div>

          {/* Section 2: Liên Hệ Hỗ Trợ */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white tracking-tight">Liên Hệ Hỗ Trợ</h3>

            {/* Email */}
            <div className="flex items-start gap-3">
              <FaEnvelope className="flex-shrink-0 mt-1 text-base text-blue-400" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Email liên hệ:</p>
                <p className="text-sm font-medium">
                  <a
                    href={`mailto:${aboutInfo.Email || "contact@bds3man.vn"}`}
                    className="transition-colors hover:text-blue-400"
                  >
                    {aboutInfo.Email || "contact@bds3man.vn"}
                  </a>
                </p>
              </div>
            </div>

            {/* Hotline */}
            <div className="flex items-start gap-3">
              <FaPhone className="flex-shrink-0 mt-1 text-base text-emerald-400" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Hotline 24/7:</p>
                <p className="text-sm font-extrabold text-emerald-400">
                  <a
                    href={`tel:${aboutInfo.Hotline || "19008888"}`}
                    className="hover:underline"
                  >
                    {aboutInfo.Hotline || "1900 8888"}
                  </a>{" "}
                  <span className="text-xs text-slate-400 font-normal">
                    ({aboutInfo.SoDienThoai || "0901 234 567"})
                  </span>
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="flex-shrink-0 mt-1 text-base text-rose-400" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Địa chỉ văn phòng:</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aboutInfo.DiaChi ||
                    "Tòa nhà Landmark 81, 720A Điện Biên Phủ, Quận Bình Thạnh, TP.HCM"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Dịch Vụ Nổi Bật */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white tracking-tight">Dịch Vụ & Tiện Ích</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link
                  to="/tim-kiem?trangThai=đang+bán"
                  className="transition-colors hover:text-white flex items-center gap-2"
                >
                  <span>🏠</span> Mua bán bất động sản
                </Link>
              </li>
              <li>
                <Link
                  to="/tim-kiem?trangThai=cho+thuê"
                  className="transition-colors hover:text-white flex items-center gap-2"
                >
                  <span>🔑</span> Cho thuê nhà đất & căn hộ
                </Link>
              </li>
              <li>
                <Link
                  to="/ban-do"
                  className="transition-colors hover:text-white flex items-center gap-2"
                >
                  <span>🗺️</span> Bản đồ số quy hoạch GIS
                </Link>
              </li>
              <li>
                <Link
                  to="/tham-khao-gia"
                  className="transition-colors hover:text-white flex items-center gap-2"
                >
                  <span>📈</span> Thao khảo giá thị trường
                </Link>
              </li>
              <li>
                <Link
                  to="/dang-bai"
                  className="transition-colors hover:text-white flex items-center gap-2"
                >
                  <span>📝</span> Ký gửi & đăng tin BĐS
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 4: Pháp Lý & Điều Khoản */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white tracking-tight">
              Chính Sách & Điều Khoản
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link
                  to="/lien-he"
                  className="transition-colors hover:text-blue-400 flex items-center gap-2"
                >
                  <FaFileContract className="text-slate-500" />
                  <span>Điều khoản sử dụng</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/lien-he"
                  className="transition-colors hover:text-blue-400 flex items-center gap-2"
                >
                  <FaShieldAlt className="text-slate-500" />
                  <span>Chính sách bảo mật</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dang-ky-moi-gioi"
                  className="transition-colors hover:text-emerald-400 flex items-center gap-2"
                >
                  <span>💼</span> Đăng ký làm môi giới
                </Link>
              </li>
              <li>
                <Link
                  to="/auth"
                  className="transition-colors hover:text-blue-400 flex items-center gap-2"
                >
                  <span>👤</span> Đăng ký tài khoản mới
                </Link>
              </li>
            </ul>

            {/* Social Media */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Kết nối với chúng tôi
              </h4>
              <div className="flex gap-3 text-slate-400">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                >
                  <FaFacebook size={16} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/5 hover:bg-sky-500 hover:text-white rounded-lg transition-all"
                >
                  <FaTwitter size={16} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/5 hover:bg-pink-600 hover:text-white rounded-lg transition-all"
                >
                  <FaInstagram size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Bất Động Sản 3MAN. Tất cả các quyền được bảo lưu.</p>
          <p className="text-slate-400 font-semibold">
            Nền tảng công nghệ bản đồ số & kết nối bất động sản uy tín
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
