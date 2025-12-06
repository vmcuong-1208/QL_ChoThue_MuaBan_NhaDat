const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const authenticateToken = require("../middleware/authenticateToken");

// Lấy gợi ý bất động sản cho người dùng
router.get("/", authenticateToken, recommendationController.getRecommendations);

// Lưu lịch sử xem
router.post("/view-history", authenticateToken, recommendationController.saveViewHistory);

module.exports = router;
