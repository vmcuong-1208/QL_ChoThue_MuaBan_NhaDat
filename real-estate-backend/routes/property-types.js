const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const propertyTypeController = require("../controllers/propertyTypeController");

// Lấy danh sách loại nhà đất - không yêu cầu xác thực
router.get("/", propertyTypeController.getAll);

// Thêm loại nhà đất
router.post("/", authenticateToken, propertyTypeController.create);

// Cập nhật loại nhà đất
router.put("/:id", authenticateToken, propertyTypeController.update);

// Xóa loại nhà đất
router.delete("/:id", authenticateToken, propertyTypeController.remove);

module.exports = router;
