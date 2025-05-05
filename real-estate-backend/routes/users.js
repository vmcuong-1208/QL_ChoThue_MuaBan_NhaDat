const express = require("express")
const router = express.Router()
const db = require("../config/db")
const authenticateToken = require("../middleware/authenticateToken")
const bcrypt = require("bcrypt")

// Lấy danh sách người dùng (chỉ admin mới có quyền)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.LoaiTaiKhoan !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" })
    }

    const [users] = await db.promise().query(`
      SELECT MaNgDung, TenDangNhap, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, 
             DATE_FORMAT(NgayDangKy, '%d/%m/%Y') as NgayDangKy,
             CASE WHEN TrangThai = 1 THEN 'Hoạt động' ELSE 'Không hoạt động' END as TrangThai
      FROM NGUOIDUNG
      ORDER BY NgayDangKy DESC
    `)

    res.json(users)
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Cập nhật thông tin người dùng (admin)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { LoaiTaiKhoan, TrangThai } = req.body

    // Kiểm tra quyền admin
    if (req.user.LoaiTaiKhoan !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" })
    }

    // Không cho phép thay đổi loại tài khoản của chính mình
    if (Number.parseInt(id) === req.user.MaNgDung) {
      return res.status(403).json({ message: "Không thể thay đổi loại tài khoản của chính mình" })
    }

    // Cập nhật thông tin người dùng
    await db
      .promise()
      .query(`UPDATE NGUOIDUNG SET LoaiTaiKhoan = ?, TrangThai = ? WHERE MaNgDung = ?`, [
        LoaiTaiKhoan,
        TrangThai === "Hoạt động" ? 1 : 0,
        id,
      ])

    res.json({ message: "Cập nhật thông tin người dùng thành công" })
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Lấy thông tin chi tiết người dùng
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Kiểm tra quyền: chỉ admin hoặc chính người dùng đó mới có quyền xem
    if (req.user.LoaiTaiKhoan !== "admin" && Number.parseInt(id) !== req.user.MaNgDung) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" })
    }

    const [users] = await db.promise().query(
      `SELECT MaNgDung, TenDangNhap, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, 
              DATE_FORMAT(NgayDangKy, '%d/%m/%Y') as NgayDangKy,
              CASE WHEN TrangThai = 1 THEN 'Hoạt động' ELSE 'Không hoạt động' END as TrangThai,
              AnhDaiDien, MoTaBanThan
       FROM NGUOIDUNG
       WHERE MaNgDung = ?`,
      [id],
    )

    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" })
    }

    res.json(users[0])
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
