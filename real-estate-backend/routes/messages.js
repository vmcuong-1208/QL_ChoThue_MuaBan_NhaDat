const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authenticateToken = require("../middleware/authenticateToken");
const upload = require("../middleware/uploadMessage");

// Tạo hoặc lấy conversation metadata
router.post("/conversations", authenticateToken, messageController.createOrGetConversation);

// Lấy danh sách cuộc trò chuyện
router.get("/conversations", authenticateToken, messageController.getConversations);

// Lấy tin nhắn giữa hai người dùng
router.get("/:userId", authenticateToken, messageController.getMessages);

// Đánh dấu đã đọc
router.put("/read/:userId", authenticateToken, messageController.markAsRead);

// Gửi tin nhắn mới
router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  messageController.sendMessage
);

// Xóa cuộc trò chuyện
router.delete("/conversation/:userId", authenticateToken, messageController.deleteConversation);

module.exports = router;
