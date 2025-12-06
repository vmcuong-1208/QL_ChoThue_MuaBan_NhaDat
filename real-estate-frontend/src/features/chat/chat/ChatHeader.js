import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../../../services/api";

const ChatHeader = ({
  activeConversation,
  userStatusText,
  onlineUsers,
  isConnected,
  onBack,
}) => {
  const navigate = useNavigate();

  if (!activeConversation) return null;

  const isUserOnline =
    onlineUsers[activeConversation.user.MaNgDung]?.isOnline && isConnected;

  const property = activeConversation.property;

  const getPropertyThumbnail = () => {
    if (!property || !property.HinhAnh) return "";
    const hinhAnh = property.HinhAnh;
    if (Array.isArray(hinhAnh) && hinhAnh.length > 0) {
      return hinhAnh[0].startsWith("http") ? hinhAnh[0] : `${SERVER_URL}${hinhAnh[0]}`;
    }
    if (typeof hinhAnh === "string") {
      return hinhAnh.startsWith("http") ? hinhAnh : `${SERVER_URL}${hinhAnh}`;
    }
    return "";
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Row 1: Back Button (Mobile) + Avatar + Name + Status */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Back button on mobile */}
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 text-gray-700 transition-all duration-300 rounded-full md:hidden hover:bg-gray-100"
            title="Quay lại danh sách"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* User Avatar */}
          <div className="relative">
            <img
              src={activeConversation.user.AnhDaiDien || "/default-avatar.png"}
              alt={activeConversation.user.HoTen || "Avatar"}
              className="object-cover w-12 h-12 transition-transform duration-300 rounded-full shadow-md hover:scale-110"
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=48&width=48";
              }}
            />
            {isUserOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </div>

          {/* User Name + Online Status */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {activeConversation.user.HoTen || activeConversation.user.Email}
            </h3>
            <p className="text-xs font-medium text-gray-500">{userStatusText}</p>
          </div>
        </div>
      </div>

      {/* Row 2: Property Info (if chatting regarding a specific property) */}
      {property && (
        <div className="flex items-center gap-3 px-5 py-3 transition-colors border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50">
          {getPropertyThumbnail() && (
            <img
              src={getPropertyThumbnail()}
              alt={property.TieuDe}
              className="flex-shrink-0 object-cover w-12 h-12 transition-transform duration-300 shadow-md rounded-xl hover:scale-110"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          <div className="flex-1 min-w-0">
            <h4 className="mb-1 text-sm font-bold text-gray-900 truncate">
              {property.TieuDe}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {property.Gia && (
                <span className="font-semibold text-blue-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(property.Gia)}
                </span>
              )}
              {property.DienTich && (
                <>
                  <span>•</span>
                  <span>{property.DienTich} m²</span>
                </>
              )}
              {property.DiaChi && (
                <>
                  <span>•</span>
                  <span className="truncate">{property.DiaChi}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate(`/bat-dong-san/${property.MaTTND}`)}
            className="px-4 py-2 text-xs font-bold text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 whitespace-nowrap"
          >
            Xem chi tiết
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
