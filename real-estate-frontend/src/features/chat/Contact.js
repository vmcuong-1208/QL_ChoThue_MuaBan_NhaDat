import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowRight,
  FaAngleRight,
  FaHeadset,
  FaShieldAlt,
  FaBuilding,
  FaHandshake,
  FaPaperPlane,
  FaQuestionCircle,
  FaChevronDown,
} from "react-icons/fa";

const FAQ_LIST = [
  {
    q: "Bất Động Sản 3MAN hỗ trợ những dịch vụ gì?",
    a: "Chúng tôi cung cấp hệ sinh thái toàn diện bao gồm: Đăng tin và tìm kiếm bất động sản mua bán, cho thuê; Thẩm định giá thị trường; Bản đồ quy hoạch GIS; Xác minh môi giới chính chủ và hỗ trợ pháp lý, hợp đồng giao dịch.",
  },
  {
    q: "Làm thế nào để đăng tin bài trên hệ thống?",
    a: "Bạn chỉ cần đăng ký tài khoản (người dùng hoặc nâng cấp môi giới), sau đó vào mục 'Đăng tin' trên thanh menu, nhập thông tin chi tiết bất động sản và hình ảnh để tin đăng được tiếp cận hàng triệu khách hàng tiềm năng.",
  },
  {
    q: "Thời gian phản hồi yêu cầu tư vấn là bao lâu?",
    a: "Đội ngũ chuyên viên tư vấn của Bất Động Sản 3MAN hoạt động 24/7 và cam kết liên hệ lại với quý khách trong vòng 15 - 30 phút sau khi tiếp nhận thông tin yêu cầu.",
  },
  {
    q: "Chi phí đăng ký môi giới và đăng tin nổi bật như thế nào?",
    a: "Hệ thống có các gói phí minh bạch được niêm yết rõ ràng tại trang quản lý tài khoản và quản lý tin đăng, hỗ trợ thanh toán tự động tiện lợi qua VietQR SePay và MoMo.",
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "consult",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  // SEO: Cập nhật thẻ title & meta description động
  useEffect(() => {
    document.title = "Liên hệ Bất Động Sản 3MAN | Hỗ trợ tư vấn mua bán & cho thuê nhà đất 24/7";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Liên hệ Bất Động Sản 3MAN - Tổng đài tư vấn mua bán, thuê căn hộ, nhà phố, đất nền uy tín hàng đầu. Hỗ trợ pháp lý, định giá và giải đáp 24/7."
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      const subjectMap = {
        consult: "Tư vấn tìm mua nhà đất",
        rent: "Tìm thuê căn hộ / mặt bằng",
        sell: "Ký gửi mua bán / cho thuê BĐS",
        legal: "Tư vấn thủ tục & pháp lý nhà đất",
        broker: "Đăng ký trở thành môi giới đối tác",
      };

      await api.post("/contact-requests", {
        HoTen: formData.name,
        Email: formData.email,
        SoDienThoai: formData.phone,
        ChuDe: subjectMap[formData.subject] || formData.subject,
        NoiDung: formData.message,
      });

      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "consult",
        message: "",
      });

      setTimeout(() => {
        setSubmitStatus(null);
      }, 7000);
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu tư vấn:", err);
      setSubmitStatus("error");
      setErrorMessage(
        err.response?.data?.message || "Đã có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau!"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // SEO: Cấu trúc dữ liệu JSON-LD Schema (ContactPage & RealEstateAgent / Organization)
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "http://localhost:3000/lien-he#webpage",
        url: "http://localhost:3000/lien-he",
        name: "Liên hệ Bất Động Sản 3MAN",
        description:
          "Thông tin liên hệ chính thức của Sàn giao dịch Bất Động Sản 3MAN. Hỗ trợ khách hàng và nhà môi giới 24/7.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Trang chủ",
              item: "http://localhost:3000/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Liên hệ",
              item: "http://localhost:3000/lien-he",
            },
          ],
        },
      },
      {
        "@type": "RealEstateAgent",
        "@id": "http://localhost:3000/#organization",
        name: "Bất Động Sản 3MAN",
        url: "http://localhost:3000/",
        logo: "http://localhost:3000/logo192.png",
        telephone: "0921 365 431",
        email: "thuankapa989@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "123 Đường ABC, Quận 1",
          addressLocality: "Hồ Chí Minh",
          addressRegion: "Hồ Chí Minh",
          postalCode: "700000",
          addressCountry: "VN",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "08:00",
            closes: "18:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Saturday", "Sunday"],
            opens: "09:00",
            closes: "17:00",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_LIST.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Schema JSON-LD Injection for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* 1. BREADCRUMB CHUẨN SEO */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-slate-200 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <li>
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Trang chủ
              </Link>
            </li>
            <li>
              <FaAngleRight className="text-slate-400 text-[10px]" />
            </li>
            <li className="text-slate-800 font-bold" aria-current="page">
              Liên hệ
            </li>
          </ol>
        </div>
      </nav>

      {/* 2. HERO HEADER SECTION */}
      <header className="relative py-14 md:py-20 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-400/30 rounded-full mb-4">
            <FaHeadset className="text-blue-400" />
            Trung tâm hỗ trợ & Dịch vụ khách hàng
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm">
            Liên hệ với Sàn Bất Động Sản 3MAN
          </h1>
          <p className="mt-3 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe, tư vấn tận tâm và giải đáp mọi thắc mắc của quý khách về mua bán, cho thuê và pháp lý nhà đất 24/7.
          </p>
        </div>
      </header>

      {/* 3. THẺ THÔNG TIN LIÊN HỆ NHANH (HIGHLIGHT CARDS) */}
      <section className="relative z-20 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hotline */}
          <article className="p-5 bg-white rounded-2xl shadow-md border border-slate-200/80 hover:shadow-xl hover:border-blue-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FaPhoneAlt />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Hotline Tư vấn 24/7
            </h2>
            <div className="space-y-0.5">
              <a href="tel:0921365431" className="block text-base font-black text-slate-900 hover:text-blue-600 transition-colors">
                0921 365 431
              </a>
              <a href="tel:0932164356" className="block text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                0932 164 356
              </a>
            </div>
          </article>

          {/* Card 2: Email */}
          <article className="p-5 bg-white rounded-2xl shadow-md border border-slate-200/80 hover:shadow-xl hover:border-blue-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <FaEnvelope />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Hòm thư điện tử
            </h2>
            <div className="space-y-0.5">
              <a href="mailto:thuankapa989@gmail.com" className="block text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors truncate">
                thuankapa989@gmail.com
              </a>
              <a href="mailto:nnssaker1208@gmail.com" className="block text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors truncate">
                nnssaker1208@gmail.com
              </a>
            </div>
          </article>

          {/* Card 3: Trụ sở */}
          <article className="p-5 bg-white rounded-2xl shadow-md border border-slate-200/80 hover:shadow-xl hover:border-blue-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <FaMapMarkerAlt />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Địa chỉ văn phòng
            </h2>
            <address className="not-italic text-xs font-semibold text-slate-700 leading-relaxed">
              123 Đường ABC, Quận 1, TP. Hồ Chí Minh
            </address>
          </article>

          {/* Card 4: Giờ mở cửa */}
          <article className="p-5 bg-white rounded-2xl shadow-md border border-slate-200/80 hover:shadow-xl hover:border-blue-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <FaClock />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Thời gian làm việc
            </h2>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              Thứ 2 - Thứ 6: 08:00 - 18:00<br />Thứ 7 - CN: 09:00 - 17:00
            </p>
          </article>
        </div>
      </section>

      {/* 4. MAIN FORM & CONTENT SECTION */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Giới thiệu & Cam kết dịch vụ (5 cột) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Vì sao khách hàng tin chọn Bất Động Sản 3MAN?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Với hơn 10.000+ sản phẩm bất động sản được xác thực thực tế, chúng tôi tự hào là cầu nối tin cậy giữa hàng nghìn nhà đầu tư, người mua nhà và môi giới chuyên nghiệp trên cả nước.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    <FaShieldAlt />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">100% Pháp lý minh bạch</h3>
                    <p className="text-xs text-slate-500 font-medium">Mọi tin đăng và sổ đỏ đều được kiểm duyệt xác minh trước khi lên hệ thống.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    <FaHandshake />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Môi giới chuẩn chuyên nghiệp</h3>
                    <p className="text-xs text-slate-500 font-medium">Đội ngũ môi giới được cấp chứng chỉ hành nghề và chứng nhận uy tín.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    <FaBuilding />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Bản đồ quy hoạch trực quan</h3>
                    <p className="text-xs text-slate-500 font-medium">Tra cứu tọa độ VN2000, đo khoảng cách và tiện ích trường học, bệnh viện chỉ với 1 click.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Khối mạng xã hội */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Kết nối cùng chúng tôi</h3>
                <p className="text-[11px] text-slate-500">Cập nhật tin tức thị trường BĐS mới nhất mỗi ngày</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white flex items-center justify-center text-xs font-bold transition-all text-slate-600"
                  aria-label="Facebook Bất Động Sản 3MAN"
                >
                  FB
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white flex items-center justify-center text-xs font-bold transition-all text-slate-600"
                  aria-label="YouTube Bất Động Sản 3MAN"
                >
                  YT
                </a>
                <a
                  href="https://zalo.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-500 hover:text-white flex items-center justify-center text-xs font-bold transition-all text-slate-600"
                  aria-label="Zalo Bất Động Sản 3MAN"
                >
                  Zalo
                </a>
              </div>
            </div>
          </div>

          {/* Cột phải: Form Gửi yêu cầu tư vấn (7 cột) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-md relative">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Gửi yêu cầu tư vấn trực tuyến
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Vui lòng điền thông tin bên dưới, chuyên viên khu vực của chúng tôi sẽ liên hệ lại hỗ trợ bạn trong vòng 15 phút.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: 0912 345 678"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Địa chỉ Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  {/* Nhu cầu tư vấn */}
                  <div>
                    <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Nhu cầu cần hỗ trợ
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                    >
                      <option value="consult">Tư vấn tìm mua nhà đất</option>
                      <option value="rent">Tìm thuê căn hộ / mặt bằng</option>
                      <option value="sell">Ký gửi mua bán / cho thuê BĐS</option>
                      <option value="legal">Tư vấn thủ tục & pháp lý nhà đất</option>
                      <option value="broker">Đăng ký trở thành môi giới đối tác</option>
                    </select>
                  </div>
                </div>

                {/* Nội dung tin nhắn */}
                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nội dung yêu cầu chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Mô tả khu vực mong muốn, tầm tài chính hoặc câu hỏi của bạn..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                  />
                </div>

                {/* Nút gửi */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Đang gửi thông tin...</span>
                  ) : (
                    <>
                      <FaPaperPlane className="text-xs" />
                      <span>GỬI YÊU CẦU TƯ VẤN NGAY</span>
                    </>
                  )}
                </button>

                {/* Thông báo thành công */}
                {submitStatus === "success" && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-fadeIn">
                    <FaCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
                    <div className="text-xs font-bold">
                      Gửi yêu cầu thành công! Chuyên viên tư vấn của Bất Động Sản 3MAN đã tiếp nhận và sẽ liên hệ lại với bạn trong thời gian sớm nhất.
                    </div>
                  </div>
                )}

                {/* Thông báo lỗi */}
                {submitStatus === "error" && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 animate-fadeIn">
                    <FaExclamationCircle className="text-rose-500 text-lg flex-shrink-0" />
                    <div className="text-xs font-bold">
                      {errorMessage || "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại!"}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CÂU HỎI THƯỜNG GẶP (FAQ SECTION CHUẨN SEO) */}
      <section className="py-14 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-full mb-2">
              <FaQuestionCircle />
              Giải đáp thắc mắc
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Câu hỏi thường gặp về dịch vụ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Những thông tin quan trọng khách hàng và đối tác thường quan tâm
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_LIST.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <FaChevronDown
                      className={`text-slate-400 text-xs transition-transform duration-300 flex-shrink-0 ml-2 ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-100 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. BẢN ĐỒ VỊ TRÍ GOOGLE MAPS */}
      <section className="py-12 bg-slate-50 border-t border-slate-200" aria-label="Bản đồ chỉ đường">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Vị trí văn phòng trên bản đồ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thuận tiện di chuyển, bãi đỗ xe rộng rãi đón tiếp quý khách
              </p>
            </div>
            <Link
              to="/ban-do"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline self-start sm:self-auto"
            >
              <span>Xem Bản đồ quy hoạch GIS</span>
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div className="h-96 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4326002567134!2d106.69975731533414!3d10.776889992309626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3332a4d9%3A0x6d1b4c0b0b0b0b0b!2zVHAuIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bản đồ văn phòng Bất Động Sản 3MAN"
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
