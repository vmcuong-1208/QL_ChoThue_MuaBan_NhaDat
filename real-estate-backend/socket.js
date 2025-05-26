const socketIo = require("socket.io")

// Map để lưu trữ kết nối socket của người dùng
const userSockets = new Map()

const setupSocket = (server) => {
  console.log("Khởi tạo Socket.IO server")
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Có kết nối mới:", socket.id)

    // Đăng ký người dùng với socket
    socket.on("register", (data) => {
      if (!data || !data.userId) {
        console.error("Invalid register data:", data)
        return
      }

      const userId = Number(data.userId)
      if (isNaN(userId)) {
        console.error("Invalid user ID for socket registration:", data.userId)
        return
      }

      userSockets.set(userId, socket.id)
      console.log(`Người dùng ${userId} đã đăng ký với socket ${socket.id}`)
      console.log("Danh sách người dùng đang kết nối:", Array.from(userSockets.keys()))

      // Thông báo cho tất cả người dùng về trạng thái online
      io.emit("user_status", { userId: userId, status: "online" })
    })

    // Xử lý sự kiện gửi tin nhắn
    socket.on("send_message", (message) => {
      console.log("Nhận tin nhắn mới:", message)

      if (!message || !message.MaNgBan) {
        console.error("Invalid message format:", message)
        return
      }

      // Ensure IDs are numbers
      const senderID = Number(message.MaNgMua)
      const receiverID = Number(message.MaNgBan)

      if (isNaN(senderID) || isNaN(receiverID)) {
        console.error("Invalid sender or receiver ID:", { senderID, receiverID })
        return
      }

      // Tìm socket của người nhận
      const receiverSocketId = userSockets.get(message.MaNgMua === receiverID ? message.MaNgMua : message.MaNgBan)

      console.log(`Socket ID của người nhận ${message.MaNgBan}: ${receiverSocketId || "không tìm thấy"}`)

      if (receiverSocketId) {
        // Gửi tin nhắn đến người nhận
        console.log(`Gửi tin nhắn đến socket người nhận: ${receiverSocketId}`)
        io.to(receiverSocketId).emit("new_message", message)
      } else {
        console.log(`Không tìm thấy socket của người nhận ${message.MaNgBan}`)
      }

      // Gửi lại tin nhắn cho người gửi (để đồng bộ trên nhiều thiết bị)
      console.log(`Gửi tin nhắn lại cho người gửi socket: ${socket.id}`)
      socket.emit("new_message", message)
    })

    // Xử lý sự kiện đang gõ
    socket.on("typing", (data) => {
      if (!data || !data.receiverId) {
        console.error("Invalid typing data:", data)
        return
      }

      const receiverId = Number(data.receiverId)
      if (isNaN(receiverId)) {
        console.error("Invalid receiver ID for typing event:", data.receiverId)
        return
      }

      const receiverSocketId = userSockets.get(receiverId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", data)
      }
    })

    // Xử lý ngắt kết nối
    socket.on("disconnect", () => {
      console.log("Ngắt kết nối:", socket.id)

      // Tìm và xóa người dùng khỏi map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId)
          console.log(`Người dùng ${userId} đã ngắt kết nối`)

          // Thông báo cho tất cả người dùng về trạng thái offline
          io.emit("user_status", { userId, status: "offline" })
          break
        }
      }
    })
  })

  return io
}

module.exports = setupSocket
