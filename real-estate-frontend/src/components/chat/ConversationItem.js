import { FaHome, FaEllipsisV, FaEnvelopeOpen, FaTrash } from "react-icons/fa";

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onlineUsers,
  isConnected,
  isTyping,
  isMenuOpen,
  onToggleMenu,
  onMarkAsRead,
  onDelete,
  formatTime,
}) => {
  const isUserOnline = onlineUsers[conversation.user.MaNgDung]?.isOnline && isConnected;
  const lastTime = conversation.lastMessage ? formatTime(conversation.lastMessage.NgayGui) : "";
  const displayName = conversation.user.HoTen || conversation.user.Email || "Người dùng";

  return (
    <div
      onClick={onSelect}
      className={`
        relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-300 border-l-4
        ${
          isActive
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-600 shadow-sm"
            : "border-transparent hover:bg-gray-50"
        }
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={conversation.user.AnhDaiDien || "/placeholder.svg?height=48&width=48"}
          alt={displayName}
          className="object-cover w-12 h-12 transition-transform duration-300 rounded-full shadow-md hover:scale-110"
          onError={(e) => {
            e.target.src = "/placeholder.svg?height=48&width=48";
          }}
        />
        {isUserOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900 truncate">{displayName}</h3>
          <span className="ml-2 text-xs font-medium text-gray-500 whitespace-nowrap">
            {lastTime}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-1">
          {isTyping ? (
            <span className="text-xs italic font-semibold text-blue-600 animate-pulse">
              đang nhập...
            </span>
          ) : (
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage?.NoiDung || "Chưa có tin nhắn"}
            </p>
          )}
        </div>

        {conversation.property && (
          <div className="flex items-center gap-1 mb-1">
            <FaHome className="text-xs text-gray-500" />
            <span className="text-xs font-semibold text-gray-700 truncate">
              {conversation.property.TieuDe}
            </span>
          </div>
        )}

        {conversation.unreadCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        )}
      </div>

      {/* Menu dropdown */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-200 hover:text-gray-700"
          title="Tùy chọn"
        >
          <FaEllipsisV size={14} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 z-20 w-48 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl top-full animate-slideInTop">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left text-gray-700 transition-colors hover:bg-blue-50 rounded-t-xl"
            >
              <FaEnvelopeOpen className="text-blue-500" />
              {conversation.unreadCount > 0 ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) {
                  onDelete();
                }
              }}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left text-red-600 transition-colors hover:bg-red-50 rounded-b-xl"
            >
              <FaTrash className="text-red-500" />
              Xóa cuộc trò chuyện
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
