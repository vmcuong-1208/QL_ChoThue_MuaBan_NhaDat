import { FaReply, FaCopy, FaShare, FaEllipsisV } from "react-icons/fa";
import { SafeImage, SafeVideo, MessageStatus } from "./SafeMedia";
import { SERVER_URL } from "../../services/api";

const MessageItem = ({
  message,
  isMe,
  formatTime,
  isMenuOpen,
  onToggleMenu,
  onReply,
  onCopy,
  onForward,
}) => {
  const getMediaUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") || path.startsWith("blob:") ? path : `${SERVER_URL}${path}`;
  };

  const renderDropdown = (sideClass) => (
    <div
      className={`absolute top-0 z-20 bg-white border border-gray-200 shadow-2xl rounded-xl w-44 animate-fadeIn ${sideClass}`}
    >
      <button
        onClick={onReply}
        className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left text-gray-700 transition-colors hover:bg-blue-50 rounded-t-xl"
      >
        <FaReply className="text-blue-500" />
        <span>Trả lời</span>
      </button>
      <button
        onClick={onCopy}
        className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left text-gray-700 transition-colors border-t border-gray-100 hover:bg-blue-50"
      >
        <FaCopy className="text-blue-500" />
        <span>Sao chép</span>
      </button>
      <button
        onClick={onForward}
        className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left text-gray-700 transition-colors border-t border-gray-100 hover:bg-blue-50 rounded-b-xl"
      >
        <FaShare className="text-blue-500" />
        <span>Chuyển tiếp</span>
      </button>
    </div>
  );

  return (
    <div
      className={`flex mb-4 items-start gap-3 animate-fadeIn ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      {/* OTHER USER'S MESSAGE */}
      {!isMe && (
        <>
          <div className="relative group">
            <div className="max-w-md px-4 py-3 transition-all duration-300 bg-white border border-gray-200 shadow-md rounded-2xl hover:shadow-lg">
              {message.ReplyTo && (
                <div className="pb-2 mb-2 text-xs border-b border-gray-300">
                  <div className="flex items-center gap-1 mb-1">
                    <FaReply className="text-gray-500" />
                    <span className="font-semibold text-gray-600">Trả lời</span>
                  </div>
                  <div className="italic text-gray-500 truncate">{message.ReplyTo}</div>
                </div>
              )}

              {message.HinhAnh && (
                <SafeImage
                  src={message.HinhAnh}
                  alt="Hình ảnh"
                  onClick={() => window.open(getMediaUrl(message.HinhAnh), "_blank")}
                  className="mb-2"
                />
              )}

              {message.Video && (
                <div className="mb-2">
                  <SafeVideo src={message.Video} />
                </div>
              )}

              {message.NoiDung && (
                <p className="text-sm leading-relaxed text-gray-800">{message.NoiDung}</p>
              )}

              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-500">{formatTime(message.NgayGui)}</span>
                <MessageStatus status={message.TrangThaiGui} isMe={isMe} />
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="relative flex-shrink-0 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
              className="p-2.5 text-gray-600 transition-all duration-300 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-gray-800 hover:shadow-md hover:scale-110"
              title="Tùy chọn tin nhắn"
            >
              <FaEllipsisV size={14} />
            </button>
            {isMenuOpen && renderDropdown("ml-2 left-full")}
          </div>
        </>
      )}

      {/* MY MESSAGE */}
      {isMe && (
        <>
          {/* Action button on the left of bubble */}
          <div className="relative flex-shrink-0 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
              className="p-2.5 text-gray-600 transition-all duration-300 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-gray-800 hover:shadow-md hover:scale-110"
              title="Tùy chọn tin nhắn"
            >
              <FaEllipsisV size={14} />
            </button>
            {isMenuOpen && renderDropdown("mr-2 right-full")}
          </div>

          <div className="relative group">
            <div className="max-w-md px-4 py-3 text-white transition-all duration-300 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl hover:shadow-lg hover:from-blue-700 hover:to-indigo-700">
              {message.ReplyTo && (
                <div className="pb-2 mb-2 text-xs border-b border-blue-400">
                  <div className="flex items-center gap-1 mb-1">
                    <FaReply className="text-blue-200" />
                    <span className="font-semibold text-blue-100">Trả lời</span>
                  </div>
                  <div className="italic text-blue-100 truncate">{message.ReplyTo}</div>
                </div>
              )}

              {message.HinhAnh && (
                <SafeImage
                  src={message.HinhAnh}
                  alt="Hình ảnh"
                  onClick={() => window.open(getMediaUrl(message.HinhAnh), "_blank")}
                  className="mb-2"
                />
              )}

              {message.Video && (
                <div className="mb-2">
                  <SafeVideo src={message.Video} />
                </div>
              )}

              {message.NoiDung && (
                <p className="text-sm leading-relaxed text-white">{message.NoiDung}</p>
              )}

              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-blue-100">{formatTime(message.NgayGui)}</span>
                <MessageStatus status={message.TrangThaiGui} isMe={isMe} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageItem;
