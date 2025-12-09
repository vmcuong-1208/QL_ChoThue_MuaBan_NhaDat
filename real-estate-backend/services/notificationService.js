const db = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * Tạo một thông báo mới cho người dùng (môi giới)
 */
const createNotification = async (data, io = null) => {
  const {
    MaNgDung,
    TieuDe,
    NoiDung,
    LoaiTB = "LIEN_HE",
    LienKet = "/yeu-cau-lien-he",
    DuLieuThem = null,
  } = data;

  if (!MaNgDung) {
    throw new Error("Mã người nhận thông báo (MaNgDung) không được để trống!");
  }
  if (!TieuDe || !NoiDung) {
    throw new Error("Tiêu đề và nội dung thông báo không được để trống!");
  }

  const result = await queryAsync(
    `INSERT INTO THONGBAO (MaNgDung, TieuDe, NoiDung, LoaiTB, LienKet, TrangThaiDoc, DuLieuThem)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      MaNgDung,
      TieuDe.trim(),
      NoiDung.trim(),
      LoaiTB,
      LienKet,
      DuLieuThem ? JSON.stringify(DuLieuThem) : null,
    ]
  );

  const [notification] = await queryAsync(
    `SELECT * FROM THONGBAO WHERE MaTB = ?`,
    [result.insertId]
  );

  // Phát tín hiệu realtime qua Socket.IO
  if (io) {
    try {
      io.emit("new_notification", {
        ...notification,
        MaNgDung: Number(MaNgDung),
      });
    } catch (sockErr) {
      console.warn("[NotificationService] Socket emit error:", sockErr.message);
    }
  }

  return notification;
};

/**
 * Lấy danh sách thông báo của người dùng và đếm số lượng chưa đọc
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 20, unreadOnly = false } = options;

  let whereSql = "WHERE MaNgDung = ?";
  const params = [userId];

  if (unreadOnly) {
    whereSql += " AND TrangThaiDoc = 0";
  }

  // Đếm số lượng chưa đọc
  const [unreadCountResult] = await queryAsync(
    `SELECT COUNT(*) AS unreadCount FROM THONGBAO WHERE MaNgDung = ? AND TrangThaiDoc = 0`,
    [userId]
  );
  const unreadCount = unreadCountResult?.unreadCount || 0;

  // Lấy danh sách
  const items = await queryAsync(
    `SELECT * FROM THONGBAO ${whereSql} ORDER BY NgayTao DESC LIMIT ?`,
    [...params, Number(limit)]
  );

  // Parse JSON DuLieuThem nếu có
  const parsedItems = items.map((item) => {
    let extra = null;
    if (item.DuLieuThem) {
      try {
        extra = typeof item.DuLieuThem === "string" ? JSON.parse(item.DuLieuThem) : item.DuLieuThem;
      } catch (e) {}
    }
    return {
      ...item,
      DuLieuThem: extra,
    };
  });

  return {
    unreadCount,
    items: parsedItems,
  };
};

/**
 * Đánh dấu 1 thông báo đã đọc
 */
const markAsRead = async (notificationId, userId) => {
  await queryAsync(
    `UPDATE THONGBAO SET TrangThaiDoc = 1 WHERE MaTB = ? AND MaNgDung = ?`,
    [notificationId, userId]
  );
  return { message: "Đã đánh dấu thông báo là đã đọc" };
};

/**
 * Đánh dấu TẤT CẢ thông báo của user là đã đọc
 */
const markAllAsRead = async (userId) => {
  await queryAsync(
    `UPDATE THONGBAO SET TrangThaiDoc = 1 WHERE MaNgDung = ?`,
    [userId]
  );
  return { message: "Đã đánh dấu tất cả thông báo là đã đọc" };
};

/**
 * Xóa thông báo
 */
const deleteNotification = async (notificationId, userId) => {
  await queryAsync(
    `DELETE FROM THONGBAO WHERE MaTB = ? AND MaNgDung = ?`,
    [notificationId, userId]
  );
  return { message: "Đã xóa thông báo thành công" };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
