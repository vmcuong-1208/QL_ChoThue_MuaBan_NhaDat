"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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

    setTimeout(() => {
      setSubmitStatus("success");
      setIsSubmitting(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 border-b-2 border-blue-200 md:py-24 bg-gradient-to-r from-blue-400 to-indigo-300">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center animate-fadeIn">
            <h1 className="mb-4 text-4xl font-extrabold text-gray-900 md:text-5xl">
              Liên hệ với chúng tôi
            </h1>
            <p className="text-xl font-medium text-gray-700">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn tìm kiếm bất động sản phù hợp
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 md:py-20">
        <div className="container max-w-6xl px-4 mx-auto">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left - Contact Info */}
            <div className="space-y-8 animate-slideInLeft">
              {/* Intro */}
              <div>
                <h2 className="mb-4 text-3xl font-extrabold text-gray-900">
                  Thông tin liên hệ
                </h2>
                <p className="text-lg font-medium leading-relaxed text-gray-600">
                  Chúng tôi là đội ngũ chuyên nghiệp trong lĩnh vực bất động sản
                  với nhiều năm kinh nghiệm. Cam kết mang đến cho khách hàng
                  những dịch vụ tốt nhất và hỗ trợ tận tình.
                </p>
              </div>

              {/* Contact Items */}
              <div className="space-y-5">
                {/* Phone */}
                <div className="flex items-start gap-4 p-4 transition-all duration-300 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                    <FaPhone />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      Số điện thoại
                    </h3>
                    <div className="space-y-1">
                      <p>
                        <a
                          href="tel:0921365431"
                          className="font-semibold text-blue-600 transition-colors hover:text-blue-800"
                        >
                          0921 365 431
                        </a>
                      </p>
                      <p>
                        <a
                          href="tel:0932164356"
                          className="font-semibold text-blue-600 transition-colors hover:text-blue-800"
                        >
                          0932 164 356
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-4 transition-all duration-300 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                    <FaEnvelope />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      Email
                    </h3>
                    <div className="space-y-1">
                      <p>
                        <a
                          href="mailto:thuankapa989@gmail.com"
                          className="font-semibold text-blue-600 transition-colors hover:text-blue-800"
                        >
                          thuankapa989@gmail.com
                        </a>
                      </p>
                      <p>
                        <a
                          href="mailto:nnssaker1208@gmail.com"
                          className="font-semibold text-blue-600 transition-colors hover:text-blue-800"
                        >
                          nnssaker1208@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4 p-4 transition-all duration-300 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      Địa chỉ
                    </h3>
                    <div className="space-y-1 text-base font-medium text-gray-700">
                      <p>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                      <p>456 Đường XYZ, Quận 3, TP. Hồ Chí Minh</p>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-4 p-4 transition-all duration-300 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                    <FaClock />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      Giờ làm việc
                    </h3>
                    <div className="space-y-1 text-base font-medium text-gray-700">
                      <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                      <p>Thứ 7 - Chủ nhật: 9:00 - 17:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h3 className="mb-4 text-lg font-bold text-gray-900">
                  Theo dõi chúng tôi
                </h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="flex items-center justify-center w-12 h-12 text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:scale-110 hover:shadow-lg"
                    title="Facebook"
                  >
                    <FaFacebook className="text-lg" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center w-12 h-12 text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:scale-110 hover:shadow-lg"
                    title="Twitter"
                  >
                    <FaTwitter className="text-lg" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center w-12 h-12 text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 hover:scale-110 hover:shadow-lg"
                    title="Instagram"
                  >
                    <FaInstagram className="text-lg" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center w-12 h-12 text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-700 to-blue-800 hover:scale-110 hover:shadow-lg"
                    title="LinkedIn"
                  >
                    <FaLinkedin className="text-lg" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right - Contact Form */}
            <div className="animate-slideInRight">
              <div className="p-8 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                <h2 className="mb-2 text-3xl font-extrabold text-gray-900">
                  Gửi tin nhắn
                </h2>
                <p className="mb-8 text-lg font-medium text-gray-600">
                  Điền thông tin vào form và chúng tôi sẽ liên hệ sớm nhất
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="block mb-2 text-sm font-bold text-gray-700"
                      >
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập họ và tên"
                        className="w-full px-4 py-3 text-base font-medium transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block mb-2 text-sm font-bold text-gray-700"
                      >
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập số điện thoại"
                        className="w-full px-4 py-3 text-base font-medium transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập email"
                      className="w-full px-4 py-3 text-base font-medium transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      Chủ đề
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-base font-medium transition-all duration-300 bg-white border-2 border-gray-300 rounded-lg appearance-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                    >
                      <option value="">-- Chọn chủ đề --</option>
                      <option value="buy">Mua bất động sản</option>
                      <option value="sell">Bán bất động sản</option>
                      <option value="rent">Cho thuê</option>
                      <option value="consult">Tư vấn</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      Tin nhắn *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="5"
                      placeholder="Nhập nội dung tin nhắn..."
                      className="w-full px-4 py-3 text-base font-medium transition-all duration-300 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative flex items-center justify-center w-full gap-3 px-8 py-4 overflow-hidden text-lg font-bold text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    <span className="relative z-10">
                      {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn"}
                    </span>
                    {!isSubmitting && (
                      <FaArrowRight className="relative z-10 transition-transform group-hover:translate-x-1" />
                    )}
                    <span className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-blue-700 to-indigo-700 group-hover:opacity-100"></span>
                  </button>

                  {/* Success Message */}
                  {submitStatus === "success" && (
                    <div className="flex items-center gap-3 p-4 border-2 border-green-300 rounded-lg bg-green-50 animate-slideInBottom">
                      <FaCheckCircle className="flex-shrink-0 text-xl text-green-600" />
                      <p className="text-base font-semibold text-green-700">
                        Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất.
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-6xl px-4 mx-auto">
          <div className="mb-16 text-center animate-fadeIn">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 md:text-5xl">
              Dịch vụ của chúng tôi
            </h2>
            <p className="text-xl font-medium text-gray-600">
              Cung cấp giải pháp toàn diện cho nhu cầu bất động sản của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "🏠",
                title: "Mua bán nhà đất",
                desc: "Hỗ trợ tìm kiếm và giao dịch mua bán các loại BĐS",
              },
              {
                icon: "🏢",
                title: "Cho thuê",
                desc: "Dịch vụ cho thuê nhà, căn hộ, văn phòng",
              },
              {
                icon: "💼",
                title: "Tư vấn đầu tư",
                desc: "Tư vấn chuyên nghiệp về đầu tư BĐS hiệu quả",
              },
              {
                icon: "📋",
                title: "Thủ tục pháp lý",
                desc: "Hỗ trợ hoàn tất thủ tục pháp lý liên quan",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="p-6 transition-all duration-300 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-500 hover:-translate-y-2 animate-fadeInUp group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 text-5xl transition-transform group-hover:scale-110">
                  {service.icon}
                </div>
                <h3 className="mb-3 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                  {service.title}
                </h3>
                <p className="text-base font-medium text-gray-600">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-white md:py-20">
        <div className="container max-w-6xl px-4 mx-auto">
          <div className="mb-12 text-center animate-fadeIn">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 md:text-5xl">
              Vị trí của chúng tôi
            </h2>
            <p className="text-xl font-medium text-gray-600">
              Ghé thăm văn phòng của chúng tôi để tìm hiểu thêm
            </p>
          </div>

          <div className="overflow-hidden border-2 border-gray-200 shadow-xl rounded-2xl animate-scaleIn">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4326002567134!2d106.69975731533414!3d10.776889992309626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3332a4d9%3A0x6d1b4c0b0b0b0b0b!2zVHAuIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
              width="100%"
              height="500"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bản đồ vị trí"
            ></iframe>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container max-w-4xl px-4 mx-auto text-center animate-fadeIn">
          <h2 className="mb-6 text-4xl font-extrabold text-white md:text-5xl">
            Sẵn sàng tìm bất động sản mơ ước?
          </h2>
          <p className="mb-8 text-xl font-medium text-blue-100">
            Hãy khám phá hàng nghìn lựa chọn bất động sản với chúng tôi
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-blue-600 transition-all duration-300 bg-white rounded-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Về trang chủ
            <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Contact;
