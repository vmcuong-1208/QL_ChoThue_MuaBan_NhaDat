const notificationService = require("../services/notificationService");

/**
 * Lấy danh sách thông báo của người dùng
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const { limit = 20, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      limit: Number(limit) || 20,
      unreadOnly: unreadOnly === "true",
    });

    res.json(result);
  } catch (err) {
    console.error("Lỗi lấy thông báo:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy danh sách thông báo" });
  }
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const notificationId = req.params.id;

    const result = await notificationService.markAsRead(notificationId, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || "Lỗi cập nhật thông báo" });
  }
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const result = await notificationService.markAllAsRead(userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || "Lỗi cập nhật thông báo" });
  }
};

/**
 * Xóa thông báo
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const notificationId = req.params.id;

    const result = await notificationService.deleteNotification(notificationId, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || "Lỗi xóa thông báo" });
  }
};
