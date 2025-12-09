const express = require("express");
const router = express.Router();
const brokerAnalyticsController = require("../controllers/brokerAnalyticsController");
const authenticateToken = require("../middleware/authenticateToken");

// Middleware kiểm tra quyền Môi giới hoặc Admin
const requireBrokerOrAdmin = (req, res, next) => {
  const role = (req.user?.LoaiTaiKhoan || "").toLowerCase();
  const isBrokerOrAdmin =
    role.includes("môi") ||
    role.includes("broker") ||
    role.includes("admin") ||
    role.includes("đầu tư");

  if (!isBrokerOrAdmin) {
    return res.status(403).json({
      success: false,
      message: "Quyền truy cập bị từ chối. Chức năng này chỉ dành cho Môi giới.",
    });
  }
  next();
};

// Lấy thống kê hiệu quả hoạt động tin đăng của Môi giới
router.get(
  "/",
  authenticateToken,
  requireBrokerOrAdmin,
  brokerAnalyticsController.getBrokerAnalytics
);

module.exports = router;
