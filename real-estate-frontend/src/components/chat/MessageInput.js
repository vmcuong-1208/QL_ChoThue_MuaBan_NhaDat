import { FaPaperPlane, FaImage, FaVideo, FaTimes, FaReply } from "react-icons/fa";

const MessageInput = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  selectedImage,
  onSelectImage,
  onRemoveImage,
  selectedVideo,
  onSelectVideo,
  onRemoveVideo,
  replyingTo,
  onCancelReply,
}) => {
  return (
    <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200 shadow-lg">
      {/* File Previews */}
      {(selectedImage || selectedVideo) && (
        <div className="flex gap-2 mb-3">
          {selectedImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Preview"
                className="object-cover w-20 h-20 rounded-lg shadow-md"
              />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute p-1 text-white transition-all duration-300 bg-red-500 rounded-full shadow-md -top-2 -right-2 hover:bg-red-600 hover:scale-110"
                title="Xóa ảnh"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}
          {selectedVideo && (
            <div className="relative">
              <video
                src={URL.createObjectURL(selectedVideo)}
                className="object-cover w-20 h-20 rounded-lg shadow-md"
              />
              <button
                type="button"
                onClick={onRemoveVideo}
                className="absolute p-1 text-white transition-all duration-300 bg-red-500 rounded-full shadow-md -top-2 -right-2 hover:bg-red-600 hover:scale-110"
                title="Xóa video"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSendMessage} className="space-y-3">
        {/* Reply Context Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between p-3 transition-colors bg-blue-50 rounded-xl hover:bg-blue-100">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FaReply className="text-blue-500" />
              <div>
                <div className="font-semibold text-blue-700">Đang trả lời</div>
                <div className="max-w-xs text-gray-600 truncate">
                  {replyingTo.NoiDung}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 text-gray-500 transition-colors rounded-full hover:text-gray-700 hover:bg-gray-200"
              title="Hủy trả lời"
            >
              <FaTimes size={14} />
            </button>
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={onMessageChange}
            className="flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
          />

          <label
            className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 border-2 border-gray-200 cursor-pointer rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600"
            title="Đính kèm hình ảnh"
          >
            <FaImage size={18} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onSelectImage(e.target.files[0]);
                }
              }}
            />
          </label>

          <label
            className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 border-2 border-gray-200 cursor-pointer rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600"
            title="Đính kèm video"
          >
            <FaVideo size={18} />
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onSelectVideo(e.target.files[0]);
                }
              }}
            />
          </label>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-300 shadow-md rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <FaPaperPlane size={16} />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
