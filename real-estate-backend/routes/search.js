const express = require("express")
const router = express.Router()
const db = require("../config/db")

// Tìm kiếm bất động sản
router.get("/", async (req, res) => {
  try {
    const {
      keyword = "",
      loaiBDS = "",
      tinh = "",
      huyen = "",
      giaMin = "",
      giaMax = "",
      dienTichMin = "",
      dienTichMax = "",
      page = 1,
      limit = 12,
      sort = "default",
    } = req.query

    console.log("Search params:", req.query)

    const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const values = []
    const conditions = []

    // Điều kiện tìm kiếm
    if (keyword) {
      conditions.push("(tt.TieuDe LIKE ? OR tt.MoTa LIKE ? OR tt.DiaChi LIKE ?)")
      const keywordPattern = `%${keyword}%`
      values.push(keywordPattern, keywordPattern, keywordPattern)
    }

    if (loaiBDS) {
      conditions.push("tt.MaLoaiND = ?")
      values.push(loaiBDS)
    }

    if (tinh) {
      conditions.push("tt.MaTinh = ?")
      values.push(tinh)
    }

    if (huyen) {
      conditions.push("tt.MaHuyen = ?")
      values.push(huyen)
    }

    if (giaMin) {
      conditions.push("tt.Gia >= ?")
      values.push(Number.parseInt(giaMin))
    }

    if (giaMax) {
      conditions.push("tt.Gia <= ?")
      values.push(Number.parseInt(giaMax))
    }

    if (dienTichMin) {
      conditions.push("tt.DienTich >= ?")
      values.push(Number.parseInt(dienTichMin))
    }

    if (dienTichMax) {
      conditions.push("tt.DienTich <= ?")
      values.push(Number.parseInt(dienTichMax))
    }

    // Chỉ hiển thị bài đăng đang bán
    conditions.push("tt.TrangThai = 'Đang bán'")

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Sắp xếp
    let orderClause = "ORDER BY tt.NgayTao DESC"
    switch (sort) {
      case "price-asc":
        orderClause = "ORDER BY tt.Gia ASC"
        break
      case "price-desc":
        orderClause = "ORDER BY tt.Gia DESC"
        break
      case "area-asc":
        orderClause = "ORDER BY tt.DienTich ASC"
        break
      case "area-desc":
        orderClause = "ORDER BY tt.DienTich DESC"
        break
      case "views-desc":
        orderClause = "ORDER BY tt.SoLuotXem DESC"
        break
      case "newest":
        orderClause = "ORDER BY tt.NgayTao DESC"
        break
    }

    // Truy vấn chính
    const searchQuery = `
      SELECT tt.*, 
             (SELECT DuongDanAnh 
              FROM HINHANHBDS 
              WHERE MaTTND = tt.MaTTND 
              LIMIT 1) AS HinhAnh
      FROM THONGTINNHADAT tt
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `

    const searchValues = [...values, Number.parseInt(limit), offset]
    const [properties] = await db.promise().query(searchQuery, searchValues)

    // Lấy hình ảnh cho mỗi bài đăng
    for (const property of properties) {
      const [images] = await db
        .promise()
        .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [property.MaTTND])
      property.HinhAnh = images.map((img) => img.DuongDanAnh)
    }

    // Đếm tổng số kết quả
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM THONGTINNHADAT tt
      ${whereClause}
    `
    const [countResult] = await db.promise().query(countQuery, values)
    const total = countResult[0].total

    console.log(`Found ${properties.length} properties, total: ${total}`)

    res.json({
      properties,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    console.error("Lỗi khi tìm kiếm:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
