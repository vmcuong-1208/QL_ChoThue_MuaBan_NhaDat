const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");

const deleteFile = async (filePath) => {
  try {
    if (!filePath) return;
    const cleanPath = filePath.replace(/^https?:\/\/[^\/]+/, "");
    const fullPath = path.join(__dirname, "..", cleanPath);
    await fs.access(fullPath);
    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("❌ Error deleting file:", filePath, error.message);
    }
  }
};

const getConversationMetadata = async (currentUserId, user2, propertyId) => {
  const [users] = await db
    .promise()
    .query("SELECT MaNgDung, HoTen, Email, AnhDaiDien FROM NGUOIDUNG WHERE MaNgDung = ?", [user2]);

  if (users.length === 0) {
    const err = new Error("Không tìm thấy người dùng");
    err.status = 404;
    throw err;
  }

  const user = users[0];
  if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
    user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
  }

  let property = null;
  if (propertyId) {
    const [properties] = await db
      .promise()
      .query("SELECT MaTTND, TieuDe, Gia, DienTich FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId]);
    property = properties[0] || null;
  }

  let checkQuery, checkParams;
  if (propertyId) {
    checkQuery = `
      SELECT * FROM TINNHAN 
      WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
      AND MaTTND = ?
      ORDER BY NgayGui DESC LIMIT 1
    `;
    checkParams = [currentUserId, user2, user2, currentUserId, propertyId];
  } else {
    checkQuery = `
      SELECT * FROM TINNHAN 
      WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
      AND MaTTND IS NULL
      ORDER BY NgayGui DESC LIMIT 1
    `;
    checkParams = [currentUserId, user2, user2, currentUserId];
  }

  const [existingMessages] = await db.promise().query(checkQuery, checkParams);

  const conversationKey = propertyId
    ? `${Math.min(currentUserId, user2)}_${Math.max(currentUserId, user2)}_${propertyId}`
    : `${Math.min(currentUserId, user2)}_${Math.max(currentUserId, user2)}`;

  return {
    conversationKey,
    user,
    property,
    hasMessages: existingMessages.length > 0,
    lastMessage: existingMessages[0] || null,
    unreadCount: 0,
  };
};

const getConversations = async (userId) => {
  const sql = `
    SELECT 
      CASE 
        WHEN MaNgMua = ? THEN MaNgBan 
        ELSE MaNgMua 
      END AS OtherUserId,
      MaTTND,
      MAX(NgayGui) AS LastMessageTime,
      COUNT(*) as MessageCount
    FROM TINNHAN 
    WHERE MaNgMua = ? OR MaNgBan = ?
    GROUP BY 
      CASE 
        WHEN MaNgMua = ? THEN MaNgBan 
        ELSE MaNgMua 
      END, 
      MaTTND
    ORDER BY LastMessageTime DESC
  `;

  const [conversations] = await db.promise().query(sql, [userId, userId, userId, userId]);
  if (conversations.length === 0) {
    return [];
  }

  const conversationsWithDetails = [];

  for (const conv of conversations) {
    try {
      const [userRows] = await db
        .promise()
        .query("SELECT MaNgDung, HoTen, Email, AnhDaiDien FROM NGUOIDUNG WHERE MaNgDung = ?", [conv.OtherUserId]);

      if (userRows.length === 0) continue;

      const user = userRows[0];
      if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
        user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
      }

      let property = null;
      if (conv.MaTTND) {
        const [propertyRows] = await db.promise().query(
          `SELECT MaTTND, TieuDe, Gia, DienTich, DiaChi, MoTa 
           FROM THONGTINNHADAT 
           WHERE MaTTND = ?`,
          [conv.MaTTND]
        );

        if (propertyRows.length > 0) {
          property = propertyRows[0];
          const [images] = await db
            .promise()
            .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [conv.MaTTND]);
          property.HinhAnh = images.map((img) => img.DuongDanAnh);
        }
      }

      const [lastMessageRows] = await db.promise().query(
        `SELECT * FROM TINNHAN 
         WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
         ${conv.MaTTND ? "AND MaTTND = ?" : "AND MaTTND IS NULL"}
         ORDER BY NgayGui DESC 
         LIMIT 1`,
        conv.MaTTND
          ? [userId, conv.OtherUserId, conv.OtherUserId, userId, conv.MaTTND]
          : [userId, conv.OtherUserId, conv.OtherUserId, userId]
      );

      const lastMessage = lastMessageRows.length > 0 ? lastMessageRows[0] : null;

      const [unreadRows] = await db.promise().query(
        `SELECT COUNT(*) as unreadCount FROM TINNHAN 
        WHERE MaNgBan = ? AND MaNgMua = ? AND TrangThaiDoc = FALSE
        ${conv.MaTTND ? "AND MaTTND = ?" : "AND MaTTND IS NULL"}`,
        conv.MaTTND
          ? [userId, conv.OtherUserId, conv.MaTTND]
          : [userId, conv.OtherUserId]
      );

      const unreadCount = unreadRows[0].unreadCount;

      conversationsWithDetails.push({
        user,
        property,
        lastMessage,
        unreadCount,
      });
    } catch (error) {
      console.error(`Lỗi khi xử lý cuộc trò chuyện với user ${conv.OtherUserId}:`, error);
    }
  }

  return conversationsWithDetails;
};

const getMessagesBetweenUsers = async (currentUserId, otherUserId, propertyId) => {
  let sql = `
    SELECT * FROM TINNHAN
    WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
  `;
  const params = [currentUserId, otherUserId, otherUserId, currentUserId];

  if (propertyId) {
    sql += ` AND MaTTND = ?`;
    params.push(propertyId);
  } else {
    sql += ` AND MaTTND IS NULL`;
  }

  sql += ` ORDER BY NgayGui ASC`;

  const [messages] = await db.promise().query(sql, params);

  if (messages.length > 0) {
    let updateSql = `
      UPDATE TINNHAN 
      SET TrangThaiDoc = TRUE, TrangThaiGui = 'seen'
      WHERE MaNgBan = ? AND MaNgMua = ? AND (TrangThaiDoc = FALSE OR TrangThaiGui != 'seen')
    `;
    const updateParams = [currentUserId, otherUserId];

    if (propertyId) {
      updateSql += ` AND MaTTND = ?`;
      updateParams.push(propertyId);
    } else {
      updateSql += ` AND MaTTND IS NULL`;
    }

    await db.promise().query(updateSql, updateParams);
  }

  return messages;
};

const markAsRead = async (currentUserId, otherUserId, propertyId) => {
  let sql = `
    UPDATE TINNHAN 
    SET TrangThaiDoc = TRUE, TrangThaiGui = 'seen'
    WHERE MaNgBan = ? AND MaNgMua = ?
  `;
  const params = [currentUserId, otherUserId];

  if (propertyId) {
    sql += ` AND MaTTND = ?`;
    params.push(propertyId);
  } else {
    sql += ` AND MaTTND IS NULL`;
  }

  const [result] = await db.promise().query(sql, params);
  return result.affectedRows;
};

const sendMessage = async ({ currentUserId, MaNgBan, MaTTND, NoiDung, ReplyTo, imagePath, videoPath }) => {
  const sql = `
    INSERT INTO TINNHAN (
      MaNgMua, 
      MaNgBan, 
      MaTTND, 
      NoiDung, 
      ReplyTo, 
      HinhAnh, 
      Video, 
      TrangThaiDoc, 
      TrangThaiGui, 
      NgayGui
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, 'sent', NOW())
  `;

  const [result] = await db.promise().query(sql, [
    currentUserId,
    MaNgBan,
    MaTTND || null,
    NoiDung,
    ReplyTo || null,
    imagePath,
    videoPath,
  ]);

  const [newMessage] = await db.promise().query("SELECT * FROM TINNHAN WHERE MaTN = ?", [result.insertId]);
  return newMessage[0];
};

const deleteConversation = async (currentUserId, otherUserId, propertyId) => {
  let query = `
    SELECT MaTN, HinhAnh, Video 
    FROM TINNHAN 
    WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
  `;
  const params = [currentUserId, otherUserId, otherUserId, currentUserId];

  if (propertyId) {
    query += " AND MaTTND = ?";
    params.push(propertyId);
  } else {
    query += " AND MaTTND IS NULL";
  }

  const [messages] = await db.promise().query(query, params);

  const deletePromises = [];
  for (const msg of messages) {
    if (msg.HinhAnh) {
      deletePromises.push(deleteFile(msg.HinhAnh));
    }
    if (msg.Video) {
      deletePromises.push(deleteFile(msg.Video));
    }
  }

  if (deletePromises.length > 0) {
    await Promise.all(deletePromises);
  }

  let deleteSql = `
    DELETE FROM TINNHAN 
    WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
  `;
  const deleteParams = [currentUserId, otherUserId, otherUserId, currentUserId];

  if (propertyId) {
    deleteSql += " AND MaTTND = ?";
    deleteParams.push(propertyId);
  } else {
    deleteSql += " AND MaTTND IS NULL";
  }

  await db.promise().query(deleteSql, deleteParams);
  return deletePromises.length;
};

module.exports = {
  getConversationMetadata,
  getConversations,
  getMessagesBetweenUsers,
  markAsRead,
  sendMessage,
  deleteConversation,
};
