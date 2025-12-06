const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Lấy thông tin chi tiết người dùng
router.get("/:id", userController.getUserById);

module.exports = router;
