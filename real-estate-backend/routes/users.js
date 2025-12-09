const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Lấy danh sách môi giới uy tín / đã xác minh cho trang chủ
router.get("/verified-brokers", userController.getVerifiedBrokers);

// Lấy thông tin chi tiết người dùng
router.get("/:id", userController.getUserById);

module.exports = router;
