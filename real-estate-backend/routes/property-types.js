const express = require("express")
const router = express.Router()
const db = require("../config/db")
const authenticateToken = require("../middleware/authenticateToken")

// Lấy danh sách loại nhà đất - không yêu cầu xác thực
router.get("/", async (req, res) => {
  try {
    const [types] = await db.promise().query("SELECT MaLoaiND AS MaLoai, TenLoaiND AS TenLoai, MoTa FROM LOAINHADAT ORDER BY TenLoaiND")
    res.json(types)
  } catch (error) {
    console.error("Lỗi khi lấy danh sách loại nhà đất:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Các route khác vẫn giữ nguyên yêu cầu xác thực
router.post("/", authenticateToken, async (req, res) => {
  const { TenLoai, MoTa } = req.body
  if (!TenLoai) {
    return res.status(400).json({ message: "Vui lòng nhập tên loại nhà đất." })
  }

  try {
    const [result] = await db.promise().query("INSERT INTO LOAINHADAT (TenLoaiND, MoTa) VALUES (?, ?)", [TenLoai, MoTa])

    res.status(201).json({ MaLoai: result.insertId, TenLoai, MoTa })
  } catch (error) {
    console.error("Lỗi khi thêm loại nhà đất:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Cập nhật loại nhà đất
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params
  const { TenLoai, MoTa } = req.body

  try {
    await db.promise().query("UPDATE LOAINHADAT SET TenLoaiND = ?, MoTa = ? WHERE MaLoaiND = ?", [TenLoai, MoTa, id])

    res.json({ MaLoai: Number.parseInt(id), TenLoai, MoTa })
  } catch (error) {
    console.error("Lỗi khi cập nhật loại nhà đất:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Xóa loại nhà đất
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    await db.promise().query("DELETE FROM LOAINHADAT WHERE MaLoaiND = ?", [id])
    res.json({ message: "Xóa loại nhà đất thành công" })
  } catch (error) {
    console.error("Lỗi khi xóa loại nhà đất:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
