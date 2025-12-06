import { createContext, useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { SERVER_URL } from "../services/api";

const SocketContext = createContext();

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || SERVER_URL;

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const socketRef = useRef(null);

  // ✅ 1. KHỞI TẠO TỪ localStorage
  const [onlineUsers, setOnlineUsers] = useState(() => {
    try {
      const cached = localStorage.getItem("onlineUsers");
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error("❌ Error loading onlineUsers from localStorage:", error);
      return {};
    }
  });

  const [isConnected, setIsConnected] = useState(false);

  // ✅ 2. LƯU VÀO localStorage MỖI KHI onlineUsers THAY ĐỔI
  useEffect(() => {
    try {
      localStorage.setItem("onlineUsers", JSON.stringify(onlineUsers));
    } catch (error) {
      console.error("❌ Error saving onlineUsers to localStorage:", error);
    }
  }, [onlineUsers]);

  // ✅ Khởi tạo socket khi có user
  useEffect(() => {
    if (!currentUser) {
      // Không có user → Disconnect socket
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket (no user)");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        // ✅ 3. KHÔNG RESET onlineUsers KHI LOGOUT
        // setOnlineUsers({}); ← XÓA DÒNG NÀY
      }
      return;
    }

    // Có user VÀ chưa có socket → Connect
    if (!socketRef.current) {
      console.log("🔌 Connecting socket for user:", currentUser.MaNgDung);

      const newSocket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
        setIsConnected(true);

        // Register user
        newSocket.emit("register", { userId: currentUser.MaNgDung });
      });

      newSocket.on("disconnect", () => {
        console.log("🔌 Socket disconnected");
        setIsConnected(false);

        // ✅ 4. KHI DISCONNECT → SET TẤT CẢ USER THÀNH OFFLINE (GIỮ lastSeen)
        setOnlineUsers((prev) => {
          const updated = {};
          for (const userId in prev) {
            updated[userId] = {
              ...prev[userId],
              isOnline: false, // ← Chỉ set offline, giữ lastSeen
            };
          }
          console.log("🔴 Set all users offline on disconnect");
          return updated;
        });
      });

      // ✅ LISTEN user_status - CẬP NHẬT onlineUsers
      newSocket.on("user_status", (data) => {
        console.log("👤 User status:", data);

        setOnlineUsers((prev) => ({
          ...prev,
          [data.userId]: {
            isOnline: data.status === "online",
            lastSeen: data.lastSeen || new Date().toISOString(),
          },
        }));
      });

      socketRef.current = newSocket;
    }

    // Cleanup khi component unmount
    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        // ✅ 5. KHÔNG RESET onlineUsers KHI CLEANUP
        // setOnlineUsers({}); ← XÓA DÒNG NÀY
      }
    };
  }, [currentUser]);

  const value = {
    socket: socketRef.current,
    onlineUsers,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
