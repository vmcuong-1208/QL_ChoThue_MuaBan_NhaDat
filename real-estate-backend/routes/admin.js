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

// ==========================================
// QUẢN LÝ TIN ĐĂNG BẤT ĐỘNG SẢN (ADMIN)
// ==========================================
// Lấy danh sách tin đăng kiểm duyệt (có phân trang, tìm kiếm, lọc theo trạng thái)
router.get("/properties", authenticateToken, requireAdmin, adminController.getProperties);

// Lấy chi tiết tin đăng kiểm duyệt
router.get("/properties/:id", authenticateToken, requireAdmin, adminController.getPropertyDetail);

// Cập nhật trạng thái duyệt tin (APPROVED, REJECTED, REMOVED)
router.put("/properties/:id/status", authenticateToken, requireAdmin, adminController.updatePropertyStatus);

// Bật/tắt đánh dấu tin nổi bật (Featured)
router.put("/properties/:id/feature", authenticateToken, requireAdmin, adminController.togglePropertyFeatured);

module.exports = router;
