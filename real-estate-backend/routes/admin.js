const express = require("express")
const router = express.Router()
const db = require("../config/db")
const authenticateToken = require("../middleware/authenticateToken")

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  console.log("Checking admin permission for user:", req.user)

  if (!req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan !== "admin") {
    return res.status(403).json({
      message: "Không có quyền truy cập",
      userRole: req.user.LoaiTaiKhoan,
      required: "admin",
    })
  }

  console.log("Admin access granted for user:", req.user.MaNgDung)
  next()
}

// Lấy thống kê tổng quan
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log("Getting stats for admin user:", req.user.MaNgDung)

    // Tổng số người dùng
    const [totalUsers] = await db.promise().query("SELECT COUNT(*) as total FROM NGUOIDUNG")

    // Người dùng mới trong tháng
    const [newUsersThisMonth] = await db.promise().query(`
      SELECT COUNT(*) as total FROM NGUOIDUNG 
      WHERE MONTH(NgayTao) = MONTH(CURRENT_DATE()) 
      AND YEAR(NgayTao) = YEAR(CURRENT_DATE())
    `)

    // Tổng số bài đăng
    const [totalPosts] = await db.promise().query("SELECT COUNT(*) as total FROM THONGTINNHADAT")

    // Bài đăng mới trong tháng
    const [newPostsThisMonth] = await db.promise().query(`
      SELECT COUNT(*) as total FROM THONGTINNHADAT 
      WHERE MONTH(NgayTao) = MONTH(CURRENT_DATE()) 
      AND YEAR(NgayTao) = YEAR(CURRENT_DATE())
    `)

    // Thống kê theo loại tài khoản
    const [usersByRole] = await db.promise().query(`
      SELECT LoaiTaiKhoan, COUNT(*) as count 
      FROM NGUOIDUNG 
      GROUP BY LoaiTaiKhoan
    `)

    // Thống kê theo trạng thái - sử dụng ENUM
    const [usersByStatus] = await db.promise().query(`
      SELECT TrangThai as status_name, COUNT(*) as count 
      FROM NGUOIDUNG 
      GROUP BY TrangThai
    `)

    // Tổng số loại nhà đất
    const [totalPropertyTypes] = await db.promise().query("SELECT COUNT(*) as total FROM LOAINHADAT")

    // Bài đăng theo trạng thái
    const [postsByStatus] = await db.promise().query(`
      SELECT TrangThai, COUNT(*) as count 
      FROM THONGTINNHADAT 
      GROUP BY TrangThai
    `)

    // Hoạt động gần đây
    const [recentActivities] = await db.promise().query(`
      SELECT 
        'post' as type,
        nd.HoTen as userName,
        tt.TieuDe as content,
        tt.NgayTao as createdAt
      FROM THONGTINNHADAT tt
      JOIN NGUOIDUNG nd ON tt.MaNgDung = nd.MaNgDung
      ORDER BY tt.NgayTao DESC
      LIMIT 10
    `)

    res.json({
      stats: {
        totalUsers: totalUsers[0].total,
        newUsersThisMonth: newUsersThisMonth[0].total,
        totalPosts: totalPosts[0].total,
        newPostsThisMonth: newPostsThisMonth[0].total,
        totalPropertyTypes: totalPropertyTypes[0].total,
        usersByRole: usersByRole,
        usersByStatus: usersByStatus,
        postsByStatus: postsByStatus,
      },
      recentActivities,
    })
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Lấy danh sách người dùng với tìm kiếm
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log("Getting users list for admin:", req.user.MaNgDung)

    const { search = "", page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let whereClause = ""
    let queryParams = []

    if (search) {
      whereClause = `
        WHERE HoTen LIKE ? 
        OR Email LIKE ? 
        OR SDT LIKE ?
      `
      const searchTerm = `%${search}%`
      queryParams = [searchTerm, searchTerm, searchTerm]
    }

    // Lấy tổng số người dùng
    const [totalResult] = await db
      .promise()
      .query(`SELECT COUNT(*) as total FROM NGUOIDUNG ${whereClause}`, queryParams)

    // Lấy danh sách người dùng - sử dụng ENUM trực tiếp
    const [users] = await db.promise().query(
      `
      SELECT 
        MaNgDung,
        TenDangNhap,
        HoTen,
        Email,
        SDT,
        DiaChi,
        LoaiTaiKhoan,
        TrangThai,
        AnhDaiDien,
        NgayTao,
        (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaNgDung = NGUOIDUNG.MaNgDung) as SoBaiDang
      FROM NGUOIDUNG 
      ${whereClause}
      ORDER BY NgayTao DESC
      LIMIT ? OFFSET ?
    `,
      [...queryParams, Number.parseInt(limit), Number.parseInt(offset)],
    )

    // Thêm đường dẫn đầy đủ cho ảnh đại diện
    users.forEach((user) => {
      if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
        user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien}`
      }
    })

    res.json({
      users,
      pagination: {
        total: totalResult[0].total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(totalResult[0].total / limit),
      },
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Cập nhật thông tin người dùng
router.put("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { LoaiTaiKhoan, TrangThai } = req.body

    console.log("Updating user:", id, "with data:", { LoaiTaiKhoan, TrangThai })

    // Validate loại tài khoản
    const validRoles = ["admin", "thường", "chủ đầu tư", "môi giới"]
    if (!validRoles.includes(LoaiTaiKhoan)) {
      return res.status(400).json({
        message: "Loại tài khoản không hợp lệ",
        received: LoaiTaiKhoan,
        valid: validRoles,
      })
    }

    // Validate trạng thái - sử dụng ENUM trực tiếp
    const validStatuses = ["hoạt động", "khóa", "chờ xác thực"]
    if (!validStatuses.includes(TrangThai)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
        received: TrangThai,
        valid: validStatuses,
      })
    }

    console.log("Using ENUM status directly:", TrangThai)

    // Kiểm tra user tồn tại
    const [existingUser] = await db.promise().query("SELECT MaNgDung FROM NGUOIDUNG WHERE MaNgDung = ?", [id])

    if (existingUser.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" })
    }

    // Cập nhật - sử dụng ENUM trực tiếp
    const [result] = await db
      .promise()
      .query("UPDATE NGUOIDUNG SET LoaiTaiKhoan = ?, TrangThai = ? WHERE MaNgDung = ?", [LoaiTaiKhoan, TrangThai, id])

    console.log("Update result:", result)

    res.json({
      message: "Cập nhật thành công",
      updated: {
        LoaiTaiKhoan,
        TrangThai,
      },
    })
  } catch (error) {
    console.error("Lỗi khi cập nhật người dùng:", error)
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
      stack: error.stack,
    })
  }
})

module.exports = router
