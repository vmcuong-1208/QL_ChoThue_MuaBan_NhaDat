const messageService = require("../services/messageService");

const createOrGetConversation = async (req, res) => {
  try {
    const { user2, propertyId } = req.body;
    const currentUserId = req.user.MaNgDung;

    if (!user2) {
      return res.status(400).json({ error: "Thiếu thông tin người nhận" });
    }

    const data = await messageService.getConversationMetadata(currentUserId, user2, propertyId);
    res.json(data);
  } catch (error) {
    console.error("Lỗi tạo conversation:", error);
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Lỗi server" });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const conversations = await messageService.getConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách cuộc trò chuyện" });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung;
    const otherUserId = req.params.userId;
    const propertyId = req.query.propertyId;

    const messages = await messageService.getMessagesBetweenUsers(currentUserId, otherUserId, propertyId);
    res.json(messages);
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server khi lấy tin nhắn" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung;
    const otherUserId = req.params.userId;
    const propertyId = req.query.propertyId;

    const affectedRows = await messageService.markAsRead(currentUserId, otherUserId, propertyId);
    res.json({
      success: true,
      affectedRows,
    });
  } catch (error) {
    console.error("❌ Lỗi đánh dấu đã đọc:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung;
    const { MaNgBan, MaTTND, NoiDung, ReplyTo } = req.body;

    if (!MaNgBan || !NoiDung) {
      return res.status(400).json({
        message: "Thiếu thông tin người nhận hoặc nội dung tin nhắn",
      });
    }

    let imagePath = null;
    let videoPath = null;

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        imagePath = `/uploads/messages/images/${req.files.image[0].filename}`;
      }
      if (req.files.video && req.files.video[0]) {
        videoPath = `/uploads/messages/videos/${req.files.video[0].filename}`;
      }
    }

    const newMessage = await messageService.sendMessage({
      currentUserId,
      MaNgBan,
      MaTTND,
      NoiDung,
      ReplyTo,
      imagePath,
      videoPath,
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn:", error);
    return res.status(500).json({
      message: "Lỗi server khi gửi tin nhắn",
      error: error.message,
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung;
    const otherUserId = parseInt(req.params.userId);
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId) : null;

    const deletedFiles = await messageService.deleteConversation(currentUserId, otherUserId, propertyId);

    res.json({
      success: true,
      message: "Đã xóa cuộc trò chuyện và tất cả file media",
      deletedFiles,
    });
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa cuộc trò chuyện",
      error: error.message,
    });
  }
};

module.exports = {
  createOrGetConversation,
  getConversations,
  getMessages,
  markAsRead,
  sendMessage,
  deleteConversation,
};
