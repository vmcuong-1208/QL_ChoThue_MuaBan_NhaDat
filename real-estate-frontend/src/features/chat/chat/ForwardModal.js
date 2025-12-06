const ForwardModal = ({
  isOpen,
  onClose,
  conversations,
  onSendForward,
  getConversationKey,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl animate-scaleIn">
        <h3 className="mb-6 text-xl font-bold text-gray-900">
          Chuyển tiếp tin nhắn
        </h3>
        <div className="mb-4 space-y-2 overflow-y-auto max-h-64">
          {conversations.map((conv) => (
            <button
              key={getConversationKey(conv)}
              onClick={() => onSendForward(conv)}
              className="flex items-center w-full gap-3 p-3 text-left transition-all duration-300 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-400"
            >
              <img
                src={conv.user.AnhDaiDien || "/placeholder.svg?height=40&width=40"}
                alt={conv.user.HoTen || "Avatar"}
                className="object-cover w-12 h-12 rounded-full shadow-md"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">
                  {conv.user.HoTen || conv.user.Email}
                </div>
                {conv.property && (
                  <div className="text-xs text-gray-600 truncate">
                    {conv.property.TieuDe}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400"
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

export default ForwardModal;
