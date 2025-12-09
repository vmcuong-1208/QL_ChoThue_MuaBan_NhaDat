const express = require("express");
const router = express.Router();
const brokerReviewController = require("../controllers/brokerReviewController");
const authenticateToken = require("../middleware/authenticateToken");

// 1. Xem danh sách đánh giá & thống kê của môi giới (công khai)
router.get("/:brokerId", brokerReviewController.getBrokerReviews);

// 2. Kiểm tra điều kiện đánh giá của user hiện tại với môi giới
router.get("/:brokerId/eligibility", authenticateToken, brokerReviewController.checkEligibility);

// 3. Khách hàng gửi hoặc sửa đánh giá
router.post("/", authenticateToken, brokerReviewController.submitReview);

// 4. Xóa đánh giá
router.delete("/:id", authenticateToken, brokerReviewController.deleteReview);

module.exports = router;
