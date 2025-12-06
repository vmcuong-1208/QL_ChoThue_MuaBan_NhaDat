const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");
const authenticateToken = require("../middleware/authenticateToken");

// Lấy danh sách bất động sản yêu thích của người dùng
router.get("/", authenticateToken, favoriteController.getFavorites);

// Thêm bất động sản vào danh sách yêu thích
router.post("/:propertyId", authenticateToken, favoriteController.addFavorite);

// Xóa bất động sản khỏi danh sách yêu thích
router.delete("/:propertyId", authenticateToken, favoriteController.removeFavorite);

// Kiểm tra bất động sản có trong danh sách yêu thích không
router.get("/check/:propertyId", authenticateToken, favoriteController.checkFavorite);

// Cập nhật ghi chú cho bất động sản yêu thích
router.put("/:propertyId", authenticateToken, favoriteController.updateNote);

module.exports = router;
