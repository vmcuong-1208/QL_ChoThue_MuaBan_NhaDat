const express = require("express")
const router = express.Router()
const db = require("../config/db") // Import kết nối database

// Lấy danh sách tỉnh/thành phố
router.get("/provinces", async (req, res) => {
  try {
    const query = "SELECT * FROM TINHTHANH ORDER BY TenTinh"
    db.query(query, (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn database:", err)
        return res.status(500).json({ message: "Lỗi server" })
      }
      res.json(results)
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Lấy danh sách quận/huyện theo tỉnh/thành phố
router.get("/districts/:provinceId", async (req, res) => {
  try {
    const { provinceId } = req.params
    const query = "SELECT * FROM QUANHUYEN WHERE MaTinh = ? ORDER BY TenHuyen"
    db.query(query, [provinceId], (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn database:", err)
        return res.status(500).json({ message: "Lỗi server" })
      }
      res.json(results)
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách quận/huyện:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Lấy danh sách phường/xã theo quận/huyện
router.get("/wards/:districtId", async (req, res) => {
  try {
    const { districtId } = req.params
    const query = "SELECT * FROM PHUONGXA WHERE MaHuyen = ? ORDER BY TenXa"
    db.query(query, [districtId], (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn database:", err)
        return res.status(500).json({ message: "Lỗi server" })
      }
      res.json(results)
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phường/xã:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

module.exports = router
