const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const propertyReportController = require("../controllers/propertyReportController");
const authenticateToken = require("../middleware/authenticateToken");

// Optional auth cho phép cả user đăng nhập và khách gửi báo cáo
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || "HUTECH", (err, user) => {
    if (!err && user) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  });
};

// Middleware kiểm tra quyền Admin
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.LoaiTaiKhoan || "").toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Yêu cầu quyền Quản trị viên (Admin)!" });
  }
  next();
};

// 1. Lấy danh sách các lý do báo cáo chuẩn (Công khai)
router.get("/reasons", propertyReportController.getReasons);

// 1.1 Lấy lịch sử báo cáo của người dùng đăng nhập
router.get("/user/my-reports", authenticateToken, propertyReportController.getMyReports);

// 2. Khách hàng gửi báo cáo tin sai phạm (Công khai / Đăng nhập)
router.post("/", optionalAuth, propertyReportController.createReport);

// 3. Admin lấy danh sách báo cáo
router.get("/", authenticateToken, requireAdmin, propertyReportController.getReports);

// 4. Admin cập nhật trạng thái xử lý báo cáo
router.patch("/:id/status", authenticateToken, requireAdmin, propertyReportController.updateReportStatus);

module.exports = router;
