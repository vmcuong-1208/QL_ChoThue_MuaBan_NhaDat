const express = require("express")
const router = express.Router()
const db = require("../config/db")
const authenticateToken = require("../middleware/authenticateToken")

// Lấy danh sách bất động sản yêu thích của người dùng
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    console.log(`Lấy danh sách yêu thích cho người dùng ${userId}, trang ${page}`)

    // Truy vấn lấy bất động sản yêu thích với thông tin chi tiết
    const sql = `
      SELECT 
        yt.MaYT,
        yt.NgayTao as NgayYeuThich,
        yt.GhiChu,
        tt.*,
        l.TenLoaiND as LoaiBDS,
        (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = tt.MaTTND LIMIT 1) AS HinhAnh
      FROM YEUTHICH yt
      INNER JOIN THONGTINNHADAT tt ON yt.MaTTND = tt.MaTTND
      LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
      WHERE yt.MaNgDung = ?
      ORDER BY yt.NgayTao DESC
      LIMIT ? OFFSET ?
    `

    const [favorites] = await db.promise().query(sql, [userId, limit, offset])

    // Lấy hình ảnh cho mỗi bài đăng
    for (const favorite of favorites) {
      const [images] = await db
        .promise()
        .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [favorite.MaTTND])
      favorite.HinhAnh = images.map((img) => img.DuongDanAnh)
    }

    // Đếm tổng số bài đăng yêu thích
    const [countRows] = await db.promise().query(`SELECT COUNT(*) AS total FROM YEUTHICH WHERE MaNgDung = ?`, [userId])
    const total = countRows[0].total

    console.log(`Tìm thấy ${favorites.length} bất động sản yêu thích`)

    res.json({
      favorites,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu thích:", error)
    res.status(500).json({ message: "Lỗi server khi lấy danh sách yêu thích" })
  }
})

// Thêm bất động sản vào danh sách yêu thích
router.post("/:propertyId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const propertyId = req.params.propertyId
    const { GhiChu } = req.body

    console.log(`Thêm bất động sản ${propertyId} vào yêu thích của người dùng ${userId}`)

    // Kiểm tra bất động sản có tồn tại không
    const [propertyRows] = await db.promise().query("SELECT MaTTND FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId])

    if (propertyRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bất động sản" })
    }

    // Kiểm tra đã yêu thích chưa
    const [existingRows] = await db
      .promise()
      .query("SELECT MaYT FROM YEUTHICH WHERE MaNgDung = ? AND MaTTND = ?", [userId, propertyId])

    if (existingRows.length > 0) {
      return res.status(400).json({ message: "Bất động sản đã có trong danh sách yêu thích" })
    }

    // Thêm vào yêu thích
    const [result] = await db
      .promise()
      .query("INSERT INTO YEUTHICH (MaNgDung, MaTTND, GhiChu, NgayTao) VALUES (?, ?, ?, NOW())", [
        userId,
        propertyId,
        GhiChu || null,
      ])

    console.log(`Đã thêm vào yêu thích với ID: ${result.insertId}`)

    res.status(201).json({
      message: "Đã thêm vào danh sách yêu thích",
      favoriteId: result.insertId,
    })
  } catch (error) {
    console.error("Lỗi khi thêm vào yêu thích:", error)
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Bất động sản đã có trong danh sách yêu thích" })
    }
    res.status(500).json({ message: "Lỗi server khi thêm vào yêu thích" })
  }
})

// Xóa bất động sản khỏi danh sách yêu thích
router.delete("/:propertyId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const propertyId = req.params.propertyId

    console.log(`Xóa bất động sản ${propertyId} khỏi yêu thích của người dùng ${userId}`)

    const [result] = await db
      .promise()
      .query("DELETE FROM YEUTHICH WHERE MaNgDung = ? AND MaTTND = ?", [userId, propertyId])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy bất động sản trong danh sách yêu thích" })
    }

    console.log("Đã xóa khỏi danh sách yêu thích")

    res.json({ message: "Đã xóa khỏi danh sách yêu thích" })
  } catch (error) {
    console.error("Lỗi khi xóa khỏi yêu thích:", error)
    res.status(500).json({ message: "Lỗi server khi xóa khỏi yêu thích" })
  }
})

// Kiểm tra bất động sản có trong danh sách yêu thích không
router.get("/check/:propertyId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const propertyId = req.params.propertyId

    const [rows] = await db
      .promise()
      .query("SELECT MaYT FROM YEUTHICH WHERE MaNgDung = ? AND MaTTND = ?", [userId, propertyId])

    res.json({ isFavorite: rows.length > 0 })
  } catch (error) {
    console.error("Lỗi khi kiểm tra yêu thích:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Cập nhật ghi chú cho bất động sản yêu thích
router.put("/:propertyId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const propertyId = req.params.propertyId
    const { GhiChu } = req.body

    const [result] = await db
      .promise()
      .query("UPDATE YEUTHICH SET GhiChu = ? WHERE MaNgDung = ? AND MaTTND = ?", [GhiChu || null, userId, propertyId])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy bất động sản trong danh sách yêu thích" })
    }

    res.json({ message: "Đã cập nhật ghi chú" })
  } catch (error) {
    console.error("Lỗi khi cập nhật ghi chú yêu thích:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
