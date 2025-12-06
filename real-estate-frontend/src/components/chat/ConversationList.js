import { FaEnvelope } from "react-icons/fa";
import ConversationItem from "./ConversationItem";

const ConversationList = ({
  conversations,
  activeConversation,
  onSelectConversation,
  searchTerm,
  onSearchChange,
  showMobileChat,
  onlineUsers,
  isConnected,
  typingUsers,
  menuOpen,
  setMenuOpen,
  onMarkAsRead,
  onDeleteConversation,
  formatTime,
  getConversationKey,
}) => {
  return (
    <div
      className={`
        flex flex-col border-r border-gray-200 bg-white shadow-lg flex-shrink-0
        w-full md:w-[380px]
        ${showMobileChat ? "hidden md:flex" : "flex"}
      `}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
        <h1 className="text-xl font-bold text-white">💬 Trò chuyện</h1>
      </div>

      {/* Search Input */}
      <div className="flex-shrink-0 p-4 bg-gray-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full py-3 pl-4 pr-4 text-sm font-medium transition-all duration-300 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-blue-400"
          />
        </div>
      </div>

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center animate-fadeIn">
            <FaEnvelope className="mb-4 text-6xl text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">
              Chưa có cuộc trò chuyện
            </p>
          </div>
        ) : (
          <div>
            {conversations.map((conversation) => {
              const convKey = getConversationKey(conversation);
              const isActive =
                activeConversation?.user.MaNgDung === conversation.user.MaNgDung &&
                ((!activeConversation.property && !conversation.property) ||
                  activeConversation.property?.MaTTND === conversation.property?.MaTTND);

              return (
                <ConversationItem
                  key={convKey}
                  conversation={conversation}
                  isActive={isActive}
                  onSelect={() => onSelectConversation(conversation)}
                  onlineUsers={onlineUsers}
                  isConnected={isConnected}
                  isTyping={!!typingUsers[conversation.user.MaNgDung]}
                  isMenuOpen={menuOpen === convKey}
                  onToggleMenu={() => setMenuOpen(menuOpen === convKey ? null : convKey)}
                  onMarkAsRead={() => {
                    if (conversation.unreadCount > 0) {
                      onMarkAsRead(conversation.user.MaNgDung, conversation.property?.MaTTND);
                    }
                    setMenuOpen(null);
                  }}
                  onDelete={() => {
                    onDeleteConversation(conversation.user.MaNgDung, conversation.property?.MaTTND);
                    setMenuOpen(null);
                  }}
                  formatTime={formatTime}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
