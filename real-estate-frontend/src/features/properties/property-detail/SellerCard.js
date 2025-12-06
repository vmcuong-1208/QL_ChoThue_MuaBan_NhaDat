import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaPhone,
  FaCommentDots,
} from "react-icons/fa";

const SellerCard = ({
  seller,
  property,
  showFullPhone,
  onTogglePhone,
  onOpenChat,
  onContactClick,
  onSuggestedMessageClick,
  formatPrice,
  formatDate,
}) => {
  if (!property) return null;

  return (
    <div className="space-y-4 lg:col-span-1">
      <div className="sticky transition-all duration-300 top-24 animate-fadeInUp">
        <div className="overflow-hidden bg-white shadow-lg rounded-xl hover:shadow-xl">
          {/* Header Badge */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h3 className="text-xs font-bold tracking-wider text-center text-white uppercase">
              Thông tin môi giới
            </h3>
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="relative flex-shrink-0 transition-transform duration-300 group hover:scale-105">
              <img
                src={seller?.AnhDaiDien || "/placeholder.svg?height=80&width=80"}
                alt={seller?.HoTen || "Người bán"}
                className="object-cover w-16 h-16 transition-all duration-300 border-4 border-gray-100 rounded-full shadow-md"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=80&width=80";
                }}
              />
              {seller?.TrangThaiXacThuc === "đã xác thực" && (
                <div className="absolute bottom-0 right-0 flex items-center justify-center w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-lg">
                  <FaCheckCircle className="text-xs text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate transition-colors hover:text-blue-600">
                {seller?.HoTen || "Người bán"}
              </h2>
              <span className="inline-block px-2 py-0.5 mt-1 text-xs font-semibold text-blue-700 rounded-full bg-blue-50">
                {seller?.LoaiTaiKhoan || "Người dùng"}
              </span>
            </div>
          </div>

          <div className="px-4 pb-4">
            {seller?.MaNgDung && (
              <Link
                to={`/profile/${seller.MaNgDung}`}
                className="flex items-center justify-center gap-2 px-4 py-2 mb-3 text-sm font-medium text-blue-600 transition-all duration-300 border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:scale-105 group"
              >
                <span>Xem trang cá nhân</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            {seller?.SDT && (
              <button
                className="flex items-center justify-center w-full gap-2 py-3 mb-3 text-sm font-semibold text-white transition-colors rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                onClick={onTogglePhone}
              >
                
                <FaPhone className="relative" />
                <span className="relative">
                  {showFullPhone ? seller.SDT : seller.SDT.slice(0, -4) + "****"}
                </span>
                <span className="absolute text-[10px] font-semibold text-green-100 top-1 right-2">
                  {showFullPhone ? "Ẩn số" : "Hiện số"}
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                onClick={onOpenChat}
              >
                <FaCommentDots />
                <span>Chat</span>
              </button>

              <button
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 transition-colors shadow-sm rounded-lg"
                onClick={() => onContactClick("zalo")}
              >
                <img
                  src="/zalo.png"
                  alt="Zalo"
                  className="relative w-4 h-4"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0z'/%3E%3C/svg%3E";
                  }}
                />
                <span className="relative">Zalo</span>
              </button>
            </div>

            {/* Quick Messages */}
            <div className="pt-3 border-t border-gray-100">
              <p className="mb-2 text-xs font-semibold text-gray-600">
                Chat ngay với người đăng tin
              </p>
              <div className="space-y-2">
                <div
                  className="flex items-start gap-2 p-2 text-xs text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm group"
                  onClick={() =>
                    onSuggestedMessageClick("Cần hỏi còn không? Tôi muốn hỏi thêm thông tin")
                  }
                >
                  <svg
                    className="flex-shrink-0 w-4 h-4 mt-0.5 text-gray-600 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="flex-1 leading-tight">
                    Cần hỏi còn không? Tôi muốn hỏi thêm thông tin
                  </span>
                </div>

                <div
                  className="flex items-start gap-2 p-2 text-xs text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm group"
                  onClick={() =>
                    onSuggestedMessageClick("Gửi cho tôi thêm hình/video nhé!")
                  }
                >
                  <svg
                    className="flex-shrink-0 w-4 h-4 mt-0.5 text-gray-600 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="flex-1 leading-tight">
                    Gửi cho tôi thêm hình/video nhé!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 mt-4 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp animation-delay-200">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Thông tin tóm tắt</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-600">Mã tin:</span>
              <span className="font-medium">BDS{property.MaTTND}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Loại BĐS:</span>
              <span className="font-medium">{property.LoaiBDS || "Không xác định"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Diện tích:</span>
              <span className="font-medium">{property.DienTich} m²</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Giá:</span>
              <span className="font-medium text-red-600">{formatPrice(property.Gia)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Ngày đăng:</span>
              <span className="font-medium">{formatDate(property.NgayTao)}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SellerCard;
