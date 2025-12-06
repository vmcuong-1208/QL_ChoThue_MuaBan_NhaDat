import { useState, useEffect, useRef, useCallback } from "react";

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const useChatSocket = ({
  socket,
  currentUser,
  activeConversationRef,
  setMessages,
  setConversations,
}) => {
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(socket);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Debounced typing
  const emitTyping = useCallback(
    debounce((receiverId, propertyId) => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit("typing", {
          senderId: currentUser.MaNgDung,
          receiverId,
          propertyId,
          isTyping: true,
        });
      }
    }, 300),
    [currentUser]
  );

  const emitStopTyping = useCallback(
    debounce((receiverId, propertyId) => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit("typing", {
          senderId: currentUser.MaNgDung,
          receiverId,
          propertyId,
          isTyping: false,
        });
      }
    }, 1000),
    [currentUser]
  );

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleDelivered = (data) => {
      if (!data || !data.messageId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.MaTN === data.messageId ? { ...msg, TrangThaiGui: "delivered" } : msg
        )
      );
    };

    const handleSeen = (data) => {
      if (!data || !data.messageIds) return;
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.MaTN) ? { ...msg, TrangThaiGui: "seen" } : msg
        )
      );
    };

    const handleNewMessage = (message) => {
      if (!message || !message.MaTN) return;

      const currentUserId = currentUser.MaNgDung;
      const isFromOther = message.MaNgMua !== currentUserId;

      if (isFromOther) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.MaTN === message.MaTN);
          if (exists) return prev;
          return [...prev, message];
        });

        const activeConv = activeConversationRef.current;
        const isActive =
          activeConv &&
          activeConv.user.MaNgDung === message.MaNgMua &&
          (activeConv.property?.MaTTND || null) === (message.MaTTND || null);

        if (isActive) {
          socket.emit("messages_seen", {
            receiverId: currentUserId,
            senderId: message.MaNgMua,
            messageIds: [message.MaTN],
          });

          setConversations((prev) =>
            prev.map((conv) =>
              conv.user.MaNgDung === message.MaNgMua &&
              (conv.property?.MaTTND || null) === (message.MaTTND || null)
                ? { ...conv, lastMessage: message, unreadCount: 0 }
                : conv
            )
          );
        } else {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.user.MaNgDung === message.MaNgMua &&
              (conv.property?.MaTTND || null) === (message.MaTTND || null)
                ? {
                    ...conv,
                    lastMessage: message,
                    unreadCount: (conv.unreadCount || 0) + 1,
                  }
                : conv
            )
          );
        }
      } else {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.user.MaNgDung === message.MaNgBan &&
            (conv.property?.MaTTND || null) === (message.MaTTND || null)
              ? { ...conv, lastMessage: message }
              : conv
          )
        );
      }
    };

    const handleTyping = (data) => {
      if (!data || !data.senderId) return;

      const activeConv = activeConversationRef.current;
      if (
        data.receiverId === currentUser.MaNgDung &&
        activeConv &&
        activeConv.user.MaNgDung === data.senderId
      ) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.senderId]: data.isTyping,
        }));

        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => ({ ...prev, [data.senderId]: false }));
          }, 3000);
        }
      }
    };

    socket.on("message_delivered", handleDelivered);
    socket.on("messages_seen", handleSeen);
    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("message_delivered", handleDelivered);
      socket.off("messages_seen", handleSeen);
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [socket, currentUser, activeConversationRef, setMessages, setConversations]);

  return {
    typingUsers,
    emitTyping,
    emitStopTyping,
  };
};

export default useChatSocket;
