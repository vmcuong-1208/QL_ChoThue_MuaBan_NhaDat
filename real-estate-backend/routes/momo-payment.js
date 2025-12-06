const express = require("express");
const router = express.Router();
const momoPaymentController = require("../controllers/momoPaymentController");
const authenticateToken = require("../middleware/authenticateToken");

// Tạo payment request
router.post("/create-payment", authenticateToken, momoPaymentController.createPayment);

// Xử lý callback từ MoMo (IPN)
router.post("/callback", momoPaymentController.callback);

// Kiểm tra trạng thái giao dịch (polling)
router.get("/check-status/:orderId", authenticateToken, momoPaymentController.checkStatus);

module.exports = router;
