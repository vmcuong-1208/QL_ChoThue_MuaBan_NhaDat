const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const contactRequestController = require("../controllers/contactRequestController");
const authenticateToken = require("../middleware/authenticateToken");

// Middleware xác thực tùy chọn: Cho phép cả user đã đăng nhập hoặc khách vãng lai
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

// 1. Khách hàng gửi yêu cầu liên hệ / tư vấn
router.post("/", optionalAuth, contactRequestController.createContactRequest);

// 2. Môi giới xem danh sách yêu cầu liên hệ nhận được & Thống kê
router.get("/broker", authenticateToken, contactRequestController.getBrokerRequests);
router.get("/broker/stats", authenticateToken, contactRequestController.getBrokerStats);
router.get("/broker/properties", authenticateToken, contactRequestController.getBrokerProperties);

// 3. Khách hàng (User thường) xem lịch sử yêu cầu tư vấn đã gửi
router.get("/customer", authenticateToken, contactRequestController.getCustomerRequests);

// 4. Cập nhật trạng thái yêu cầu (Đã liên hệ, Chưa xử lý, Hủy)
router.patch("/:id/status", authenticateToken, contactRequestController.updateRequestStatus);

module.exports = router;
