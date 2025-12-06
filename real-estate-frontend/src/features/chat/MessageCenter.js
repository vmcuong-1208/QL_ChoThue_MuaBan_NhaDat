"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { FaEnvelope } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { API_URL, SERVER_URL } from "../../services/api";

import { TypingIndicator } from "./chat/SafeMedia";
import ConversationList from "./chat/ConversationList";
import ChatHeader from "./chat/ChatHeader";
import MessageItem from "./chat/MessageItem";
import MessageInput from "./chat/MessageInput";
import ForwardModal from "./chat/ForwardModal";
import useChatSocket from "../../hooks/useChatSocket";

const MessageCenter = () => {
  const { currentUser } = useAuth();
  const { socket, onlineUsers, isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const messagesEndRef = useRef(null);

  const [messageMenuOpen, setMessageMenuOpen] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showMobileChat, setShowMobileChat] = useState(false);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Socket custom hook
  const { typingUsers, emitTyping, emitStopTyping } = useChatSocket({
    socket,
    currentUser,
    activeConversationRef,
    setMessages,
    setConversations,
  });

  // Auto-refresh last seen time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser) navigate("/auth");
  }, [currentUser, navigate]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data || !Array.isArray(response.data)) {
        setError("Định dạng phản hồi không hợp lệ");
        setLoading(false);
        return;
      }

      if (response.data.length > 0 && !response.data[0].user) {
        const conversationsWithDetails = [];
        const currentActive = activeConversationRef.current;

        for (const conv of response.data) {
          try {
            const userResponse = await axios.get(
              `${API_URL}/users/${conv.OtherUserId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const user = userResponse.data;
            if (user.AnhDaiDien) {
              user.AnhDaiDien = user.AnhDaiDien.startsWith("http")
                ? user.AnhDaiDien
                : `${SERVER_URL}${user.AnhDaiDien}`;
            }

            let propertyDetails = null;
            if (conv.MaTTND) {
              const propertyResponse = await axios.get(
                `${API_URL}/properties/${conv.MaTTND}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              propertyDetails = propertyResponse.data;

              if (propertyDetails && propertyDetails.HinhAnh) {
                if (
                  typeof propertyDetails.HinhAnh === "string" &&
                  !propertyDetails.HinhAnh.startsWith("http")
                ) {
                  propertyDetails.HinhAnh = `${SERVER_URL}${propertyDetails.HinhAnh}`;
                }
              }
            }

            const messagesResponse = await axios.get(
              `${API_URL}/messages/${conv.OtherUserId}${
                conv.MaTTND ? `?propertyId=${conv.MaTTND}` : ""
              }`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const lastMessage =
              messagesResponse.data.length > 0
                ? messagesResponse.data[messagesResponse.data.length - 1]
                : null;

            const isActiveConversation =
              currentActive &&
              currentActive.user.MaNgDung === conv.OtherUserId &&
              ((!currentActive.property && !conv.MaTTND) ||
                currentActive.property?.MaTTND === conv.MaTTND);

            let unreadCount = 0;
            if (isActiveConversation) {
              unreadCount = 0;
            } else {
              unreadCount = messagesResponse.data.filter(
                (msg) =>
                  msg.MaNgBan === currentUser.MaNgDung &&
                  msg.MaNgMua === conv.OtherUserId &&
                  !msg.TrangThaiDoc
              ).length;
            }

            conversationsWithDetails.push({
              user,
              property: propertyDetails,
              lastMessage,
              unreadCount,
            });
          } catch (error) {
            console.error(`Error fetching details:`, error);
          }
        }
        setConversations(conversationsWithDetails);
      } else {
        setConversations(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Lỗi:", error);
      setError("Không thể tải danh sách");
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchConversations();
  }, [currentUser, fetchConversations]);

  // Filter messages for active conversation
  const displayedMessages = useMemo(() => {
    if (!activeConversation) return [];

    const otherUserId = activeConversation.user.MaNgDung;
    const propertyId = activeConversation.property?.MaTTND || null;

    return messages.filter((msg) => {
      const isRelevantUser =
        (msg.MaNgMua === currentUser.MaNgDung && msg.MaNgBan === otherUserId) ||
        (msg.MaNgMua === otherUserId && msg.MaNgBan === currentUser.MaNgDung);

      const isRelevantProperty = (msg.MaTTND || null) === propertyId;
      return isRelevantUser && isRelevantProperty;
    });
  }, [messages, activeConversation, currentUser]);

  // Fetch messages for a specific conversation
  const fetchMessages = async (userId, propertyId = null) => {
    try {
      const token = localStorage.getItem("token");
      const url = propertyId
        ? `${API_URL}/messages/${userId}?propertyId=${propertyId}`
        : `${API_URL}/messages/${userId}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(response.data);

      const unseenMessageIds = response.data
        .filter(
          (m) =>
            m.MaNgMua !== currentUser.MaNgDung &&
            m.MaNgMua === userId &&
            m.TrangThaiGui !== "seen"
        )
        .map((m) => m.MaTN);

      if (unseenMessageIds.length > 0 && socket && socket.connected) {
        socket.emit("messages_seen", {
          receiverId: currentUser.MaNgDung,
          senderId: userId,
          messageIds: unseenMessageIds,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn:", error);
    }
  };

  // URL conversationId parsing
  useEffect(() => {
    if (!conversationId || conversations.length === 0) return;

    const match = conversationId.match(/^u(\d+)(?:-p(\d+))?$/);
    if (!match) return;

    const userId = parseInt(match[1]);
    const propertyId = match[2] ? parseInt(match[2]) : null;

    const isSameConversation =
      activeConversation &&
      activeConversation.user.MaNgDung === userId &&
      (activeConversation.property?.MaTTND || null) === propertyId;

    if (isSameConversation) return;

    const conv = conversations.find(
      (c) =>
        c.user.MaNgDung === userId &&
        (c.property?.MaTTND || null) === propertyId
    );

    if (conv) {
      setActiveConversation(conv);
      fetchMessages(conv.user.MaNgDung, conv.property?.MaTTND);
    } else {
      navigate("/tin-nhan", { replace: true });
    }
  }, [conversationId, conversations]);

  // Location state handle
  useEffect(() => {
    if (location.state?.conversation) {
      const conversationData = location.state.conversation;
      const conversation = {
        user: conversationData.user,
        property: conversationData.property,
        lastMessage: conversationData.lastMessage || null,
        unreadCount: conversationData.unreadCount || 0,
      };

      setActiveConversation(conversation);
      setMessages([]);

      if (conversationData.hasMessages) {
        fetchMessages(
          conversationData.user.MaNgDung,
          conversationData.property?.MaTTND
        );
      }

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const markAsRead = async (userId, propertyId = null) => {
    try {
      const token = localStorage.getItem("token");
      const url = propertyId
        ? `${API_URL}/messages/read/${userId}?propertyId=${propertyId}`
        : `${API_URL}/messages/read/${userId}`;
      await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      setConversations((prev) =>
        prev.map((conv) => {
          if (
            conv.user.MaNgDung === userId &&
            ((!propertyId && !conv.property) ||
              (conv.property && conv.property.MaTTND === propertyId))
          ) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      );
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const handleDeleteConversation = async (userId, propertyId = null) => {
    try {
      const token = localStorage.getItem("token");
      const url = propertyId
        ? `${API_URL}/messages/conversation/${userId}?propertyId=${propertyId}`
        : `${API_URL}/messages/conversation/${userId}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) =>
        prev.filter(
          (conv) =>
            !(
              conv.user.MaNgDung === userId &&
              ((!propertyId && !conv.property) ||
                (conv.property && conv.property.MaTTND === propertyId))
            )
        )
      );
      if (activeConversation?.user.MaNgDung === userId) {
        setActiveConversation(null);
        setMessages([]);
      }
      setMenuOpen(null);
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể xóa");
    }
  };

  const handleSelectConversation = (conversation) => {
    const convId = conversation.property
      ? `u${conversation.user.MaNgDung}-p${conversation.property.MaTTND}`
      : `u${conversation.user.MaNgDung}`;

    if (conversationId === convId) {
      if (
        !activeConversation ||
        activeConversation.user.MaNgDung !== conversation.user.MaNgDung ||
        (activeConversation.property?.MaTTND || null) !==
          (conversation.property?.MaTTND || null)
      ) {
        setActiveConversation(conversation);
        fetchMessages(conversation.user.MaNgDung, conversation.property?.MaTTND);
        markAsRead(conversation.user.MaNgDung, conversation.property?.MaTTND);
      }
    } else {
      setActiveConversation(conversation);
      navigate(`/tin-nhan/${convId}`, { replace: true });
      fetchMessages(conversation.user.MaNgDung, conversation.property?.MaTTND);
      markAsRead(conversation.user.MaNgDung, conversation.property?.MaTTND);
    }
    setMenuOpen(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage && !selectedVideo) return;

    const tempMessage = {
      MaTN: `temp-${Date.now()}`,
      MaNgMua: currentUser.MaNgDung,
      MaNgBan: activeConversation.user.MaNgDung,
      MaTTND: activeConversation.property?.MaTTND || null,
      NoiDung: newMessage,
      ReplyTo: replyingTo ? replyingTo.NoiDung : null,
      NgayGui: new Date().toISOString(),
      TrangThaiGui: "pending",
      TrangThaiDoc: false,
      HinhAnh: selectedImage ? URL.createObjectURL(selectedImage) : null,
      Video: selectedVideo ? URL.createObjectURL(selectedVideo) : null,
    };

    setMessages((prev) => [...prev, tempMessage]);

    const messageContent = newMessage;
    const imageFile = selectedImage;
    const videoFile = selectedVideo;
    const replyContent = replyingTo;

    setNewMessage("");
    setSelectedImage(null);
    setSelectedVideo(null);
    setReplyingTo(null);

    try {
      const token = localStorage.getItem("token");
      const receiverId = activeConversation.user.MaNgDung;

      let response;
      if (!imageFile && !videoFile) {
        response = await axios.post(
          `${API_URL}/messages`,
          {
            MaNgBan: receiverId,
            MaTTND: activeConversation.property?.MaTTND || null,
            NoiDung: messageContent,
            ReplyTo: replyContent ? replyContent.NoiDung : null,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        const formData = new FormData();
        formData.append("MaNgBan", receiverId);
        if (activeConversation.property) {
          formData.append("MaTTND", activeConversation.property.MaTTND);
        }
        formData.append("NoiDung", messageContent);
        if (replyContent) {
          formData.append("ReplyTo", replyContent.NoiDung);
        }
        if (imageFile) {
          formData.append("image", imageFile);
        }
        if (videoFile) {
          formData.append("video", videoFile);
        }

        response = await axios.post(`${API_URL}/messages`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.MaTN === tempMessage.MaTN ? response.data : msg))
      );

      if (socket) {
        socket.emit("send_message", response.data);
      }
    } catch (error) {
      console.error("LỖI TRONG handleSendMessage:", error);
      setMessages((prev) => prev.filter((msg) => msg.MaTN !== tempMessage.MaTN));
      setNewMessage(messageContent);
      setSelectedImage(imageFile);
      setSelectedVideo(videoFile);
      setReplyingTo(replyContent);
      alert(`Lỗi gửi tin nhắn: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (activeConversation) {
      emitTyping(activeConversation.user.MaNgDung, activeConversation.property?.MaTTND);
      if (!value) {
        emitStopTyping(activeConversation.user.MaNgDung, activeConversation.property?.MaTTND);
      }
    }
  };

  const handleCopyMessage = (message) => {
    navigator.clipboard.writeText(message.NoiDung);
    alert("Đã sao chép tin nhắn");
    setMessageMenuOpen(null);
  };

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
    setMessageMenuOpen(null);
  };

  const handleForwardMessage = (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
    setMessageMenuOpen(null);
  };

  const handleSendForward = async (conversationToForward) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/messages`,
        {
          MaNgBan: conversationToForward.user.MaNgDung,
          MaTTND: conversationToForward.property?.MaTTND || null,
          NoiDung: `[Forwarded] ${forwardingMessage.NoiDung}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert("Đã chuyển tiếp tin nhắn");
      setShowForwardModal(false);
      setForwardingMessage(null);
    } catch (error) {
      console.error("Lỗi chuyển tiếp:", error);
      alert("Không thể chuyển tiếp tin nhắn");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return days[date.getDay()];
    }

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatLastSeen = (lastSeenTime) => {
    if (!lastSeenTime) return "Không rõ";
    try {
      const now = new Date();
      const lastSeen = new Date(lastSeenTime);
      if (isNaN(lastSeen.getTime())) return "Không rõ";

      const diffMs = now - lastSeen;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "Vừa xong";
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return lastSeen.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Không rõ";
    }
  };

  const userStatusText = useMemo(() => {
    if (!activeConversation) return "";
    const userStatus = onlineUsers[activeConversation.user.MaNgDung];
    if (!userStatus) {
      return isConnected ? "Không hoạt động" : "Đang kết nối...";
    }
    if (userStatus.isOnline && isConnected) {
      return "Đang hoạt động";
    }
    return `Hoạt động ${formatLastSeen(userStatus.lastSeen)}`;
  }, [activeConversation, onlineUsers, isConnected, currentTime]);

  const getConversationKey = (conversation) => {
    return `${conversation.user.MaNgDung}-${conversation.property?.MaTTND || "general"}`;
  };

  const filteredConversations = conversations.filter((conv) => {
    const userName = conv.user.HoTen || conv.user.Email || "";
    const propertyTitle = conv.property?.TieuDe || "";
    return (
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
        <div className="text-center animate-fadeIn">
          <p className="mb-4 text-lg font-semibold text-red-600">{error}</p>
          <button
            onClick={fetchConversations}
            className="px-6 py-3 text-sm font-bold text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen pt-20 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Sidebar List */}
      <ConversationList
        conversations={filteredConversations}
        activeConversation={activeConversation}
        onSelectConversation={(conv) => {
          handleSelectConversation(conv);
          setShowMobileChat(true);
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showMobileChat={showMobileChat}
        onlineUsers={onlineUsers}
        isConnected={isConnected}
        typingUsers={typingUsers}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onMarkAsRead={markAsRead}
        onDeleteConversation={handleDeleteConversation}
        formatTime={formatTime}
        getConversationKey={getConversationKey}
      />

      {/* Main Chat Area */}
      <div
        className={`flex flex-col flex-1 bg-white ${
          showMobileChat ? "flex" : "hidden md:flex"
        }`}
      >
        {activeConversation ? (
          <>
            <ChatHeader
              activeConversation={activeConversation}
              userStatusText={userStatusText}
              onlineUsers={onlineUsers}
              isConnected={isConnected}
              onBack={() => setShowMobileChat(false)}
            />

            {/* Messages Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
              {displayedMessages.map((msg, index) => {
                const isMe = msg.MaNgMua === currentUser.MaNgDung;
                return (
                  <MessageItem
                    key={msg.MaTN || index}
                    message={msg}
                    isMe={isMe}
                    formatTime={formatTime}
                    isMenuOpen={messageMenuOpen === msg.MaTN}
                    onToggleMenu={() =>
                      setMessageMenuOpen(messageMenuOpen === msg.MaTN ? null : msg.MaTN)
                    }
                    onReply={() => handleReplyMessage(msg)}
                    onCopy={() => handleCopyMessage(msg)}
                    onForward={() => handleForwardMessage(msg)}
                  />
                );
              })}

              {activeConversation &&
                typingUsers[activeConversation.user.MaNgDung] && (
                  <TypingIndicator />
                )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <MessageInput
              newMessage={newMessage}
              onMessageChange={handleMessageChange}
              onSendMessage={handleSendMessage}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
              onRemoveImage={() => setSelectedImage(null)}
              selectedVideo={selectedVideo}
              onSelectVideo={setSelectedVideo}
              onRemoveVideo={() => setSelectedVideo(null)}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-gray-50 via-white to-blue-50 animate-fadeIn">
            <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 animate-bounce">
              <FaEnvelope className="text-5xl text-blue-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Chọn một cuộc trò chuyện
            </h3>
            <p className="text-sm font-medium text-gray-600">
              Chọn từ danh sách bên trái để bắt đầu nhắn tin
            </p>
          </div>
        )}
      </div>

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setForwardingMessage(null);
        }}
        conversations={conversations}
        onSendForward={handleSendForward}
        getConversationKey={getConversationKey}
      />
    </div>
  );
};

export default MessageCenter;
