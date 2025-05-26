const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const db = require("../config/db") 

// Lấy thông tin chi tiết người dùng
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Fetching user details for ID: ${id}`)

    // Kiểm tra quyền: nếu có token, kiểm tra quyền admin hoặc chính người dùng đó
    let isAuthorized = true
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1]
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        isAuthorized = decoded.LoaiTaiKhoan === "admin" || decoded.MaNgDung === Number(id)
      } catch (err) {
        console.error("Token verification failed:", err)
      }
    }

    // Truy vấn cơ bản cho người dùng không đăng nhập hoặc không có quyền
    let query = `
      SELECT MaNgDung, HoTen, Email, LoaiTaiKhoan, AnhDaiDien 
      FROM NGUOIDUNG
      WHERE MaNgDung = ?
    `

    // Truy vấn đầy đủ cho người dùng có quyền
    if (isAuthorized) {
      query = `
        SELECT MaNgDung, TenDangNhap, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, 
         CASE WHEN TrangThai = 1 THEN 'Hoạt động' ELSE 'Không hoạt động' END as TrangThai,
         AnhDaiDien, MoTaBanThan
          FROM NGUOIDUNG
          WHERE MaNgDung = ?
      `
    }

    const [users] = await db.promise().query(query, [id])

    if (users.length === 0) {
      console.log(`No user found with ID: ${id}`)
      return res.status(404).json({ message: "Không tìm thấy người dùng" })
    }

    const user = users[0]

    // Thêm đường dẫn đầy đủ cho ảnh đại diện
    if (user.AnhDaiDien) {
      user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien}`
    }

    console.log(`Found user: ${user.HoTen || user.Email}`)
    res.json(user)
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
