"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaGift, FaCheck } from "react-icons/fa";

const PromotionalPopup = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  // Ngăn scroll khi popup mở
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
    const scrollPosition = sessionStorage.getItem("homeScrollPosition");
    navigate("/", { state: { scrollPosition: scrollPosition } });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col p-6 sm:p-8 animate-scaleIn">
        {/* Nút đóng */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-lg"
          onClick={handleClose}
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30 text-white text-2xl">
            <FaGift />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Ưu đãi đặc biệt cho thành viên!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Đăng nhập ngay để nhận những ưu đãi tuyệt vời
          </p>
        </div>

        {/* Danh sách lợi ích */}
        <div className="space-y-3 mb-6">
          {[
            {
              title: "Giá ưu đãi",
              desc: "Nhận giá tốt nhất cho những bất động sản yêu thích",
            },
            {
              title: "Lưu yêu thích",
              desc: "Lưu và theo dõi các bất động sản quan tâm",
            },
            {
              title: "Liên hệ trực tiếp",
              desc: "Nhắn tin trực tiếp với người bán mà không cần xác thực",
            },
            {
              title: "Thông báo mới",
              desc: "Nhận thông báo khi có bất động sản phù hợp",
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                <FaCheck />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Khung Mã Khuyến Mại */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 text-center">
          <p className="text-xs font-medium text-amber-800 mb-1">Mã khuyến mại đặc biệt:</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono font-bold text-lg text-amber-900 tracking-wider bg-amber-100 px-3 py-1 rounded-md border border-amber-300">
              MEMBER2024
            </span>
            <button
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold shadow transition"
              onClick={() => {
                navigator.clipboard.writeText("MEMBER2024");
                alert("Đã sao chép mã khuyến mại!");
              }}
            >
              Sao chép
            </button>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-3">
          <button
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-semibold transition"
            onClick={handleClose}
          >
            Xem sau
          </button>
          <a
            href="/auth"
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-center text-sm font-semibold shadow-md shadow-blue-500/20 transition"
          >
            Đăng nhập ngay
          </a>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Không có tài khoản?{" "}
          <a href="/auth" className="text-blue-600 hover:underline font-medium">
            Đăng ký miễn phí
          </a>
        </p>
      </div>
    </div>
  );
};

export default PromotionalPopup;
