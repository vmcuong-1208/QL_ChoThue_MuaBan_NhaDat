const socketIo = require("socket.io");

// Map để lưu trữ kết nối socket của người dùng
const userSockets = new Map();

const setupSocket = (server) => {
  console.log("Khởi tạo Socket.IO server");

  // Import db để cập nhật trạng thái
  const db = require("./config/db");

  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Có kết nối mới:", socket.id);

    // ✅ ĐĂNG KÝ NGƯỜI DÙNG VỚI SOCKET
    socket.on("register", async (data) => {
      if (!data || !data.userId) {
        console.error("Invalid register data:", data);
        return;
      }

      const userId = Number(data.userId);
      if (isNaN(userId)) {
        console.error("Invalid user ID for socket registration:", data.userId);
        return;
      }

      userSockets.set(userId, socket.id);
      console.log(`✅ Người dùng ${userId} đã đăng ký với socket ${socket.id}`);

      // ✅ LẤY lastSeen TỪ DATABASE (không update)
      try {
        const [users] = await db
          .promise()
          .query("SELECT LastSeen FROM NGUOIDUNG WHERE MaNgDung = ?", [userId]);

        const lastSeen =
          users && users[0]?.LastSeen ? users[0].LastSeen : new Date();

        // Broadcast online (không update DB)
        io.emit("user_status", {
          userId: userId,
          status: "online",
          lastSeen: lastSeen,
        });

        // ✅ GỬI DANH SÁCH USER ONLINE CHO USER MỚI
        const onlineUserIds = Array.from(userSockets.keys()).filter(
          (id) => id !== userId
        );

        if (onlineUserIds.length > 0) {
          const placeholders = onlineUserIds.map(() => "?").join(",");
          const [onlineUsersData] = await db
            .promise()
            .query(
              `SELECT MaNgDung, LastSeen FROM NGUOIDUNG WHERE MaNgDung IN (${placeholders})`,
              onlineUserIds
            );

          for (const user of onlineUsersData) {
            socket.emit("user_status", {
              userId: user.MaNgDung,
              status: "online",
              lastSeen: user.LastSeen,
            });
          }
        }
      } catch (error) {
        console.error("❌ Lỗi lấy lastSeen:", error);
        io.emit("user_status", {
          userId: userId,
          status: "online",
          lastSeen: new Date(),
        });
      }
    });

    // ✅ XỬ LÝ SỰ KIỆN GỬI TIN NHẮN
    socket.on("send_message", async (message) => {
      console.log("📨 Nhận tin nhắn từ client:", message);

      if (!message || !message.MaNgBan || !message.MaNgMua) {
        console.error("❌ Invalid message format:", message);
        return;
      }

      const senderID = Number(message.MaNgMua);
      const receiverID = Number(message.MaNgBan);

      if (isNaN(senderID) || isNaN(receiverID)) {
        console.error("❌ Invalid sender or receiver ID:", {
          senderID,
          receiverID,
        });
        return;
      }

      console.log(`👤 Người gửi: ${senderID}, Người nhận: ${receiverID}`);

      // TÌM SOCKET CỦA NGƯỜI NHẬN
      const receiverSocketId = userSockets.get(receiverID);
      console.log(
        `🔍 Socket ID của người nhận ${receiverID}: ${
          receiverSocketId || "không tìm thấy"
        }`
      );

      if (receiverSocketId) {
        // NGƯỜI NHẬN ĐANG ONLINE → CẬP NHẬT TRẠNG THÁI "delivered"
        try {
          await db
            .promise()
            .query(
              'UPDATE TINNHAN SET TrangThaiGui = "delivered" WHERE MaTN = ?',
              [message.MaTN]
            );

          message.TrangThaiGui = "delivered";
          console.log(
            `✅ Đã cập nhật trạng thái delivered cho tin nhắn ${message.MaTN}`
          );
        } catch (error) {
          console.error("❌ Lỗi cập nhật trạng thái delivered:", error);
        }

        // Gửi tin nhắn đến người nhận
        console.log(
          `📤 Gửi tin nhắn đến người nhận (socket: ${receiverSocketId})`
        );
        io.to(receiverSocketId).emit("new_message", message);

        // THÔNG BÁO CHO NGƯỜI GỬI: TIN NHẮN ĐÃ DELIVERED
        const senderSocketId = userSockets.get(senderID);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_delivered", {
            messageId: message.MaTN,
            status: "delivered",
          });
          console.log(`✅ Đã thông báo delivered cho người gửi`);
        }
      } else {
        console.log(
          `⚠️ Người nhận ${receiverID} không online (tin nhắn chỉ ở trạng thái 'sent')`
        );
      }

      // EMIT CONFIRM CHO NGƯỜI GỬI
      socket.emit("message_sent", {
        success: true,
        messageId: message.MaTN,
        status: receiverSocketId ? "delivered" : "sent",
      });
    });

    // ✅ XỬ LÝ KHI NGƯỜI DÙNG XEM TIN NHẮN (SEEN)
    socket.on("messages_seen", async (data) => {
      console.log("👁️ Tin nhắn được xem:", data);

      if (!data || !data.senderId || !data.messageIds) {
        console.error("❌ Invalid seen data:", data);
        return;
      }

      try {
        const currentUserId = data.receiverId;
        const senderId = Number(data.senderId);
        const messageIds = data.messageIds;

        // Cập nhật trạng thái seen trong DB
        const placeholders = messageIds.map(() => "?").join(",");
        await db.promise().query(
          `UPDATE TINNHAN 
           SET TrangThaiDoc = TRUE, TrangThaiGui = "seen" 
           WHERE MaTN IN (${placeholders}) 
           AND MaNgMua = ? 
           AND MaNgBan = ?`,
          [...messageIds, senderId, currentUserId]
        );

        console.log(
          `✅ Đã cập nhật ${messageIds.length} tin nhắn thành 'seen'`
        );

        // THÔNG BÁO CHO NGƯỜI GỬI: TIN NHẮN ĐÃ SEEN
        const senderSocketId = userSockets.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_seen", {
            messageIds: messageIds,
            status: "seen",
          });
          console.log(`✅ Đã thông báo seen cho người gửi ${senderId}`);
        }
      } catch (error) {
        console.error("❌ Lỗi cập nhật trạng thái seen:", error);
      }
    });

    // Xử lý sự kiện đang gõ
    socket.on("typing", (data) => {
      if (!data || !data.receiverId) {
        console.error("Invalid typing data:", data);
        return;
      }

      const receiverId = Number(data.receiverId);
      if (isNaN(receiverId)) {
        console.error("Invalid receiver ID for typing event:", data.receiverId);
        return;
      }

      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", data);
      }
    });

    // ✅ XỬ LÝ NGẮT KẾT NỐI - CẬP NHẬT lastSeen
    socket.on("disconnect", async () => {
      console.log("🔌 Ngắt kết nối:", socket.id);

      // Tìm và xóa người dùng khỏi map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`👋 Người dùng ${userId} đã ngắt kết nối`);

          // ✅ LƯU LAST SEEN VÀO DATABASE
          const lastSeenTime = new Date();
          try {
            await db
              .promise()
              .query("UPDATE NGUOIDUNG SET LastSeen = ? WHERE MaNgDung = ?", [
                lastSeenTime,
                userId,
              ]);
            console.log(`✅ Đã lưu lastSeen cho user ${userId}`);
          } catch (error) {
            console.error("❌ Lỗi lưu lastSeen:", error);
          }

          // Thông báo cho tất cả người dùng về trạng thái offline
          io.emit("user_status", {
            userId,
            status: "offline",
            lastSeen: lastSeenTime, // ✅ GỬI LAST SEEN
          });
          break;
        }
      }

      console.log(
        "📋 Danh sách người dùng còn lại:",
        Array.from(userSockets.keys())
      );
    });
  });

  return io;
};

module.exports = setupSocket;
