const express = require("express")
const router = express.Router()
const db = require("../config/db")
const authenticateToken = require("../middleware/authenticateToken")

// Lấy gợi ý bất động sản cho người dùng
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const limit = Number.parseInt(req.query.limit) || 20

    console.log(`Getting recommendations for user: ${userId}`)

    // Lấy lịch sử xem của người dùng (sửa lỗi DISTINCT + ORDER BY)
    const [viewHistory] = await db.promise().query(
      `
      SELECT tt.MaLoaiND, tt.MaTinh, tt.Gia, MAX(lx.NgayXem) as LastViewed
      FROM LICHSUXEM lx
      JOIN THONGTINNHADAT tt ON lx.MaTTND = tt.MaTTND
      WHERE lx.MaNgDung = ? 
      GROUP BY tt.MaLoaiND, tt.MaTinh, tt.Gia
      ORDER BY LastViewed DESC 
      LIMIT 10
    `,
      [userId],
    )

    // Lấy yêu thích của người dùng
    const [favorites] = await db.promise().query(
      `
      SELECT tt.MaLoaiND, tt.MaTinh, tt.Gia
      FROM YEUTHICH yt
      JOIN THONGTINNHADAT tt ON yt.MaTTND = tt.MaTTND
      WHERE yt.MaNgDung = ?
      GROUP BY tt.MaLoaiND, tt.MaTinh, tt.Gia
    `,
      [userId],
    )

    // Kết hợp lịch sử xem và yêu thích
    const userHistory = [...viewHistory, ...favorites]
    console.log("User history:", userHistory)

    let recommendations = []
    let reason = "Gợi ý cho bạn"

    if (userHistory.length > 0) {
      // Phân tích sở thích người dùng
      const propertyTypes = userHistory.map((h) => h.MaLoaiND)
      const provinces = userHistory.map((h) => h.MaTinh)

      // Chuyển đổi giá từ string sang number và xử lý NaN
      const prices = userHistory
        .map((h) => {
          const price = Number.parseFloat(h.Gia)
          return isNaN(price) ? 0 : price
        })
        .filter((price) => price > 0) // Loại bỏ giá = 0

      let minPrice = 0
      let maxPrice = 999999999999 // Giá trị lớn

      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
        minPrice = avgPrice * 0.7
        maxPrice = avgPrice * 1.5
      }

      // Đếm tần suất xuất hiện
      const typeCount = {}
      const provinceCount = {}

      propertyTypes.forEach((type) => {
        typeCount[type] = (typeCount[type] || 0) + 1
      })

      provinces.forEach((province) => {
        provinceCount[province] = (provinceCount[province] || 0) + 1
      })

      // Lấy top loại và tỉnh phổ biến
      const topTypes = Object.keys(typeCount)
        .sort((a, b) => typeCount[b] - typeCount[a])
        .slice(0, 3)

      const topProvinces = Object.keys(provinceCount)
        .sort((a, b) => provinceCount[b] - provinceCount[a])
        .slice(0, 3)

      console.log("Recommendation criteria:", {
        propertyTypes: topTypes,
        provinces: topProvinces,
        minPrice,
        maxPrice,
      })

      // Tạo điều kiện WHERE động
      const whereConditions = []
      const queryParams = [userId]

      if (topTypes.length > 0) {
        whereConditions.push(`tt.MaLoaiND IN (${topTypes.map(() => "?").join(",")})`)
        queryParams.push(...topTypes)
      }

      if (topProvinces.length > 0) {
        whereConditions.push(`tt.MaTinh IN (${topProvinces.map(() => "?").join(",")})`)
        queryParams.push(...topProvinces)
      }

      if (prices.length > 0) {
        whereConditions.push(`tt.Gia BETWEEN ? AND ?`)
        queryParams.push(minPrice, maxPrice)
      }

      // Tìm bài đăng tương tự
      if (whereConditions.length > 0) {
        const [similarProperties] = await db.promise().query(
          `
          SELECT tt.*, 
                 (SELECT DuongDanAnh 
                  FROM HINHANHBDS 
                  WHERE MaTTND = tt.MaTTND 
                  LIMIT 1) AS HinhAnh,
                 l.TenLoaiND
          FROM THONGTINNHADAT tt
          LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
          WHERE tt.MaNgDung != ?
          AND tt.TrangThai = 'Đang bán'
          AND (${whereConditions.join(" OR ")})
          ORDER BY tt.SoLuotXem DESC, tt.NgayTao DESC
          LIMIT ?
          `,
          [...queryParams, limit],
        )

        recommendations = similarProperties
        reason = "Dựa trên sở thích của bạn"
        console.log("Found recommendations:", recommendations.length)
      }
    }

    // Nếu không có gợi ý hoặc không đủ, lấy bài đăng phổ biến
    if (recommendations.length < limit) {
      const remaining = limit - recommendations.length
      const existingIds = recommendations.map((r) => r.MaTTND)

      let excludeClause = ""
      let excludeParams = []

      if (existingIds.length > 0) {
        excludeClause = `AND tt.MaTTND NOT IN (${existingIds.map(() => "?").join(",")})`
        excludeParams = existingIds
      }

      const [popularProperties] = await db.promise().query(
        `
        SELECT tt.*, 
               (SELECT DuongDanAnh 
                FROM HINHANHBDS 
                WHERE MaTTND = tt.MaTTND 
                LIMIT 1) AS HinhAnh,
               l.TenLoaiND
        FROM THONGTINNHADAT tt
        LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
        WHERE tt.MaNgDung != ?
        AND tt.TrangThai = 'Đang bán'
        ${excludeClause}
        ORDER BY tt.SoLuotXem DESC, tt.NgayTao DESC
        LIMIT ?
      `,
        [userId, ...excludeParams, remaining],
      )

      recommendations = [...recommendations, ...popularProperties]
      if (userHistory.length === 0) {
        reason = "Bất động sản phổ biến"
      }
    }

    // Lấy hình ảnh cho mỗi bài đăng
    for (const property of recommendations) {
      const [images] = await db
        .promise()
        .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [property.MaTTND])
      property.HinhAnh = images.map((img) => img.DuongDanAnh)
    }

    res.json({
      recommendations,
      reason,
      total: recommendations.length,
    })
  } catch (error) {
    console.error("Lỗi khi lấy gợi ý:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Lưu lịch sử xem
router.post("/view-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const { propertyId } = req.body

    console.log(`Saving view history: User ${userId} viewed property ${propertyId}`)

    // Kiểm tra xem đã xem chưa (trong vòng 1 giờ)
    const [existing] = await db.promise().query(
      `
      SELECT * FROM LICHSUXEM 
      WHERE MaNgDung = ? AND MaTTND = ? AND NgayXem > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `,
      [userId, propertyId],
    )

    if (existing.length === 0) {
      // Thêm lịch sử xem mới
      await db.promise().query(
        `
        INSERT INTO LICHSUXEM (MaNgDung, MaTTND, NgayXem) VALUES (?, ?, NOW())
      `,
        [userId, propertyId],
      )
      console.log("View history saved successfully")
    } else {
      console.log("View history already exists within 1 hour")
    }

    res.json({ message: "Đã lưu lịch sử xem" })
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử xem:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
