const express = require("express")
const router = express.Router()
const db = require("../config/db")
const authenticateToken = require("../middleware/authenticateToken")

// Lấy danh sách cuộc trò chuyện của người dùng
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    console.log("Đang lấy danh sách cuộc trò chuyện cho người dùng:", userId)

    // Truy vấn để lấy danh sách cuộc trò chuyện
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
    `

    console.log("Câu truy vấn SQL conversations:", sql)
    console.log("Tham số truy vấn:", [userId, userId, userId, userId])

    const [conversations] = await db.promise().query(sql, [userId, userId, userId, userId])

    console.log("Tìm thấy số cuộc trò chuyện thô:", conversations.length)
    console.log("Dữ liệu cuộc trò chuyện thô:", conversations)

    if (conversations.length === 0) {
      return res.json([])
    }

    // Lấy thông tin chi tiết cho mỗi cuộc trò chuyện
    const conversationsWithDetails = []

    for (const conv of conversations) {
      try {
        console.log("Đang xử lý cuộc trò chuyện với user:", conv.OtherUserId, "property:", conv.MaTTND)

        // Lấy thông tin người dùng
        const [userRows] = await db
          .promise()
          .query("SELECT MaNgDung, HoTen, Email, AnhDaiDien FROM NGUOIDUNG WHERE MaNgDung = ?", [conv.OtherUserId])

        if (userRows.length === 0) {
          console.log("Không tìm thấy user với ID:", conv.OtherUserId)
          continue
        }

        const user = userRows[0]
        if (user.AnhDaiDien) {
          user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien}`
        }

        // Lấy thông tin bất động sản (nếu có)
        let property = null
        if (conv.MaTTND) {
          const [propertyRows] = await db
            .promise()
            .query("SELECT MaTTND, TieuDe FROM THONGTINNHADAT WHERE MaTTND = ?", [conv.MaTTND])
          if (propertyRows.length > 0) {
            property = propertyRows[0]
          }
        }

        // Lấy tin nhắn cuối cùng
        const [lastMessageRows] = await db.promise().query(
          `SELECT * FROM TINNHAN 
           WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
           ${conv.MaTTND ? "AND MaTTND = ?" : "AND MaTTND IS NULL"}
           ORDER BY NgayGui DESC 
           LIMIT 1`,
          conv.MaTTND
            ? [userId, conv.OtherUserId, conv.OtherUserId, userId, conv.MaTTND]
            : [userId, conv.OtherUserId, conv.OtherUserId, userId],
        )

        const lastMessage = lastMessageRows.length > 0 ? lastMessageRows[0] : null

        // Đếm tin nhắn chưa đọc
        const [unreadRows] = await db.promise().query(
          `SELECT COUNT(*) as unreadCount FROM TINNHAN 
           WHERE MaNgBan = ? AND MaNgMua = ? AND TrangThaiDoc = FALSE
           ${conv.MaTTND ? "AND MaTTND = ?" : "AND MaTTND IS NULL"}`,
          conv.MaTTND ? [userId, conv.OtherUserId, conv.MaTTND] : [userId, conv.OtherUserId],
        )

        const unreadCount = unreadRows[0].unreadCount

        conversationsWithDetails.push({
          user: user,
          property: property,
          lastMessage: lastMessage,
          unreadCount: unreadCount,
        })

        console.log("Đã thêm cuộc trò chuyện:", {
          user: user.HoTen || user.Email,
          property: property?.TieuDe || "Không có",
          hasLastMessage: !!lastMessage,
          unreadCount: unreadCount,
        })
      } catch (error) {
        console.error(`Lỗi khi xử lý cuộc trò chuyện với user ${conv.OtherUserId}:`, error)
      }
    }

    console.log("Tổng số cuộc trò chuyện đã xử lý:", conversationsWithDetails.length)
    res.json(conversationsWithDetails)
  } catch (error) {
    console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error)
    res.status(500).json({ message: "Lỗi server khi lấy danh sách cuộc trò chuyện" })
  }
})

// Lấy tin nhắn giữa hai người dùng
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung
    const otherUserId = req.params.userId
    const propertyId = req.query.propertyId

    console.log(
      `Lấy tin nhắn giữa người mua ${currentUserId} và người bán ${otherUserId}${propertyId ? `, cho bất động sản ${propertyId}` : ""}`,
    )

    let sql = `
      SELECT * FROM TINNHAN
      WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?)) AND (MaTTND = ? OR (? IS NULL AND MaTTND IS NULL))
    `
    const params = [currentUserId, otherUserId, otherUserId, currentUserId, propertyId, propertyId]

    if (propertyId) {
      sql += ` AND MaTTND = ?`
      params.push(propertyId)
    }

    sql += ` ORDER BY NgayGui ASC`

    console.log("Câu truy vấn SQL:", sql)
    console.log("Tham số truy vấn:", params)

    const [messages] = await db.promise().query(sql, params)

    console.log(`Tìm thấy ${messages.length} tin nhắn`)

    // Đánh dấu tin nhắn đã đọc
    if (messages.length > 0) {
      let updateSql = `
        UPDATE TINNHAN 
        SET TrangThaiDoc = TRUE 
        WHERE MaNgBan = ? AND MaNgMua = ? AND TrangThaiDoc = FALSE
      `
      const updateParams = [currentUserId, otherUserId]

      if (propertyId) {
        updateSql += ` AND MaTTND = ?`
        updateParams.push(propertyId)
      } else {
        updateSql += ` AND MaTTND IS NULL`
      }

      await db.promise().query(updateSql, updateParams)
      console.log("Đã cập nhật trạng thái đọc cho tin nhắn")
    }

    res.json(messages)
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error)
    res.status(500).json({ message: "Lỗi server khi lấy tin nhắn" })
  }
})

// Gửi tin nhắn mới
router.post("/", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung
    const { MaNgBan, MaTTND, NoiDung } = req.body

    console.log("Đang gửi tin nhắn:", {
      từ: currentUserId,
      đến: MaNgBan,
      bàiĐăng: MaTTND,
      nộiDung: NoiDung,
    })

    if (!MaNgBan || !NoiDung) {
      return res.status(400).json({ message: "Thiếu thông tin người nhận hoặc nội dung tin nhắn" })
    }

    const sql = `
      INSERT INTO TINNHAN (MaNgMua, MaNgBan, MaTTND, NoiDung, TrangThaiDoc, NgayGui)
      VALUES (?, ?, ?, ?, FALSE, NOW())
    `

    const [result] = await db.promise().query(sql, [currentUserId, MaNgBan, MaTTND || null, NoiDung])

    // Lấy tin nhắn vừa tạo
    const [newMessage] = await db.promise().query("SELECT * FROM TINNHAN WHERE MaTN = ?", [result.insertId])

    console.log("Tin nhắn đã được tạo với ID:", result.insertId)

    res.status(201).json(newMessage[0])
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error)
    res.status(500).json({ message: "Lỗi server khi gửi tin nhắn" })
  }
})

// Đánh dấu tin nhắn đã đọc
router.put("/read/:userId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung
    const otherUserId = req.params.userId
    const propertyId = req.query.propertyId

    let sql = `
      UPDATE TINNHAN 
      SET TrangThaiDoc = TRUE 
      WHERE MaNgBan = ? AND MaNgMua = ? AND TrangThaiDoc = FALSE
    `
    const params = [currentUserId, otherUserId]

    if (propertyId) {
      sql += ` AND MaTTND = ?`
      params.push(propertyId)
    } else {
      sql += ` AND MaTTND IS NULL`
    }

    await db.promise().query(sql, params)

    console.log("Đã đánh dấu tin nhắn đã đọc")
    res.json({ message: "Đã đánh dấu tin nhắn đã đọc" })
  } catch (error) {
    console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Xóa cuộc trò chuyện
router.delete("/conversation/:userId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.MaNgDung
    const otherUserId = req.params.userId
    const propertyId = req.query.propertyId

    let sql = `
      DELETE FROM TINNHAN 
      WHERE ((MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?))
    `
    const params = [currentUserId, otherUserId, otherUserId, currentUserId]

    if (propertyId) {
      sql += ` AND MaTTND = ?`
      params.push(propertyId)
    } else {
      sql += ` AND MaTTND IS NULL`
    }

    await db.promise().query(sql, params)

    console.log("Đã xóa cuộc trò chuyện")
    res.json({ message: "Đã xóa cuộc trò chuyện" })
  } catch (error) {
    console.error("Lỗi khi xóa cuộc trò chuyện:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
