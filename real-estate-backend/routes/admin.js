const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authenticateToken = require("../middleware/authenticateToken");

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan !== "admin") {
    return res.status(403).json({
      message: "Không có quyền truy cập",
      userRole: req.user.LoaiTaiKhoan,
      required: "admin",
    });
  }
  next();
};

// Lấy thống kê tổng quan
router.get("/stats", authenticateToken, requireAdmin, adminController.getStats);

// Lấy danh sách người dùng với tìm kiếm
router.get("/users", authenticateToken, requireAdmin, adminController.getUsers);

// Cập nhật thông tin người dùng
router.put("/users/:id", authenticateToken, requireAdmin, adminController.updateUser);

module.exports = router;
