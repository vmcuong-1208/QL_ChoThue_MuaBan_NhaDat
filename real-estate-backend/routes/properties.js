const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const jwt = require("jsonwebtoken")
const db = require("../config/db") // Import database connection
const authenticateToken = require("../middleware/authenticateToken") // Import middleware for token authentication

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/properties")

    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "property-" + uniqueSuffix + ext)
  },
})

// Lọc file
const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận ảnh
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh!"), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// Lấy tất cả bài đăng (có phân trang và lọc)
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const values = []
    const filterConditions = []

    if (req.query.loaiBDS) {
      filterConditions.push("MaLoaiND = ?")
      values.push(req.query.loaiBDS)
    }
    if (req.query.trangThai) {
      filterConditions.push("TrangThai = ?")
      values.push(req.query.trangThai)
    }
    if (req.query.giaTu) {
      filterConditions.push("Gia >= ?")
      values.push(Number(req.query.giaTu))
    }
    if (req.query.giaDen) {
      filterConditions.push("Gia <= ?")
      values.push(Number(req.query.giaDen))
    }
    if (req.query.dienTichTu) {
      filterConditions.push("DienTich >= ?")
      values.push(Number(req.query.dienTichTu))
    }
    if (req.query.dienTichDen) {
      filterConditions.push("DienTich <= ?")
      values.push(Number(req.query.dienTichDen))
    }
    if (req.query.maTinh) {
      filterConditions.push("MaTinh = ?")
      values.push(req.query.maTinh)
    }
    if (req.query.maHuyen) {
      filterConditions.push("MaHuyen = ?")
      values.push(req.query.maHuyen)
    }

    const filterQuery = filterConditions.length > 0 ? "WHERE " + filterConditions.join(" AND ") : ""

    const sql = `
      SELECT tt.*, 
             (SELECT DuongDanAnh 
              FROM HINHANHBDS 
              WHERE MaTTND = tt.MaTTND 
              LIMIT 1) AS HinhAnh
      FROM THONGTINNHADAT tt
      ${filterQuery}
      ORDER BY NgayTao DESC
      LIMIT ? OFFSET ?
    `

    values.push(limit, offset)

    const [properties] = await db.promise().query(sql, values)

    // Lấy hình ảnh cho mỗi bài đăng
    for (const property of properties) {
      const [images] = await db
        .promise()
        .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [property.MaTTND])
      property.HinhAnh = images.map((img) => img.DuongDanAnh)
    }
    // Tổng số bản ghi
    const countSql = `SELECT COUNT(*) AS total FROM THONGTINNHADAT ${filterQuery}`
    const [countRows] = await db.promise().query(countSql, values.slice(0, values.length - 2)) 
    const total = countRows[0].total

    res.json({
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bất động sản:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})


// Lấy bài đăng của người dùng hiện tại
router.get("/user", authenticateToken, async (req, res) => {
    try {
      console.log(">> Đã gọi vào GET /api/properties/user")
      const userId = req.user.id || req.user.MaNgDung
      console.log(">> User ID:", userId)
      const [properties] = await db
      .promise()
      .query(`SELECT * FROM THONGTINNHADAT WHERE MaNgDung = ? ORDER BY NgayTao DESC`, [userId])

    // Lấy hình ảnh cho mỗi bài đăng
    for (const property of properties) {
      const [images] = await db
        .promise()
        .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [property.MaTTND])
      property.HinhAnh = images.map((img) => img.DuongDanAnh)
    }

      res.json(properties)
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bất động sản của người dùng:", error)
      res.status(500).json({ message: "Lỗi server" })
    }
  })

// Lấy bài đăng theo ID
router.get("/:id", async (req, res) => {
  try {
    const propertyId = req.params.id
    const [properties] = await db.promise().query(`SELECT * FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId])
    const property = properties[0]

    if (!property) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" })
    }

    // Lấy hình ảnh cho bài đăng
    const [images] = await db.promise().query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId])
    property.HinhAnh = images.map((img) => img.DuongDanAnh)



    res.json(property)
  } catch (error) {
    console.error("Lỗi khi lấy thông tin bất động sản:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// API tăng lượt xem
router.post("/:id/view", async (req, res) => {
  try {
    const propertyId = req.params.id

    // Kiểm tra bài đăng có tồn tại không
    const [properties] = await db.promise().query(`SELECT * FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId])
    const property = properties[0]

    if (!property) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" })
    }

    // Tăng lượt xem
    await db.promise().query(`UPDATE THONGTINNHADAT SET SoLuotXem = SoLuotXem + 1 WHERE MaTTND = ?`, [propertyId])

    res.json({ message: "Tăng lượt xem thành công", SoLuotXem: property.SoLuotXem + 1 })
  } catch (error) {
    console.error("Lỗi khi tăng lượt xem:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})
// Tạo bài đăng mới
router.post("/", authenticateToken, upload.array("HinhAnh", 10), async (req, res) => {
  try {
    const userId = req.user.id || req.user.MaNgDung
    const { TieuDe, MoTa, Gia, DienTich, DiaChi, MaTinh, MaHuyen, MaXa, MaLoaiND, TrangThai } = req.body
    const hinhAnh = req.files.map((file) => `/uploads/properties/${file.filename}`)

    const [result] = await db.promise().query(
      `INSERT INTO THONGTINNHADAT (MaNgDung, TieuDe, MoTa, MaLoaiND, Gia, DienTich, DiaChi, MaTinh, MaHuyen, MaXa, TrangThai, SoLuotXem, NgayTao) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
       [userId, TieuDe, MoTa, MaLoaiND, Gia, DienTich, DiaChi, MaTinh, MaHuyen, MaXa, TrangThai],
    )

    const propertyId = result.insertId

    // Insert images into HINHANHBDS table
    for (const imagePath of hinhAnh) {
      await db.promise().query(`INSERT INTO HINHANHBDS (MaTTND, DuongDanAnh) VALUES (?, ?)`, [propertyId, imagePath])
    }

    res.status(201).json({
      message: "Đăng tin thành công",
      property: { MaTTND: propertyId, ...req.body, HinhAnh: hinhAnh },
    })
  } catch (error) {
    console.error("Lỗi khi tạo bài đăng:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Cập nhật bài đăng
router.put("/:id", authenticateToken, upload.array("HinhAnh", 10), async (req, res) => {
  try {
    const propertyId = req.params.id
    const userId = req.user.id || req.user.MaNgDung
    const [properties] = await db.promise().query(
      `SELECT * FROM THONGTINNHADAT WHERE MaTTND = ?`,
      [propertyId]
    )
    const property = properties[0]

    if (!property) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" })
    }

    if (property.MaNgDung !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài đăng này" })
    }
    const { TieuDe, MoTa, Gia, DienTich, DiaChi, MaTinh, MaHuyen, MaXa, MaLoaiND, TrangThai, HinhAnhCu } = req.body
    let hinhAnh = HinhAnhCu ? JSON.parse(HinhAnhCu) : []

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/properties/${file.filename}`)
      hinhAnh = [...hinhAnh, ...newImages]
    }

    await db
      .promise()
      .query(
        `UPDATE THONGTINNHADAT SET TieuDe = ?, MoTa = ?, MaLoaiND = ?, Gia = ?, DienTich = ?, DiaChi = ?, MaTinh = ?, MaHuyen = ?, MaXa = ?, TrangThai = ? WHERE MaTTND = ?`,
        [TieuDe, MoTa, MaLoaiND, Gia, DienTich, DiaChi, MaTinh, MaHuyen, MaXa, TrangThai, propertyId],
    )

    // Update images in HINHANHBDS table
    await db.promise().query(`DELETE FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId])
    for (const imagePath of hinhAnh) {
      await db.promise().query(`INSERT INTO HINHANHBDS (MaTTND, DuongDanAnh) VALUES (?, ?)`, [propertyId, imagePath])
    }

    res.json({
      message: "Cập nhật bài đăng thành công",
      property: { MaTTND: propertyId, ...req.body, HinhAnh: hinhAnh },
    })
  } catch (error) {
    console.error("Lỗi khi cập nhật bài đăng:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Xóa bài đăng
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const propertyId = req.params.id
    const userId = req.user.id || req.user.MaNgDung
    const [properties] = await db.promise().query(`SELECT * FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId])
    const property = properties[0]

    if (!property) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" })
    }

    if (property.MaNgDung !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài đăng này" })
    }

    // Delete images from HINHANHBDS table
    const [images] = await db.promise().query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId])
    for (const { DuongDanAnh } of images) {
      const fullPath = path.join(__dirname, "..", DuongDanAnh)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }
    // Xóa hình ảnh từ bảng HINHANHBDS
    await db.promise().query(`DELETE FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId])

    // Xóa bài đăng từ bảng THONGTINNHADAT
    await db.promise().query(`DELETE FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId])

    res.json({ message: "Xóa bài đăng thành công" })
  } catch (error) {
    console.error("Lỗi khi xóa bài đăng:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router