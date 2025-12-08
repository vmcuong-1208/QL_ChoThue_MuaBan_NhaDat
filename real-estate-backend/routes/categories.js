const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authenticateToken = require("../middleware/authenticateToken");

// Middleware requireAdmin
const requireAdmin = (req, res, next) => {
  if (!req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan !== "admin") {
    return res.status(403).json({ message: "Không có quyền truy cập. Yêu cầu quyền admin." });
  }
  next();
};

// =========================================================================
// 1. LOẠI BẤT ĐỘNG SẢN
// =========================================================================
router.get("/property-types", categoryController.getPropertyTypes);
router.post("/property-types", authenticateToken, requireAdmin, categoryController.createPropertyType);
router.put("/property-types/:id", authenticateToken, requireAdmin, categoryController.updatePropertyType);
router.patch("/property-types/:id/toggle", authenticateToken, requireAdmin, categoryController.togglePropertyType);
router.delete("/property-types/:id", authenticateToken, requireAdmin, categoryController.deletePropertyType);

// =========================================================================
// 2. TỈNH / THÀNH PHỐ
// =========================================================================
router.get("/provinces", categoryController.getProvinces);
router.post("/provinces", authenticateToken, requireAdmin, categoryController.createProvince);
router.put("/provinces/:code", authenticateToken, requireAdmin, categoryController.updateProvince);
router.patch("/provinces/:code/toggle", authenticateToken, requireAdmin, categoryController.toggleProvince);
router.delete("/provinces/:code", authenticateToken, requireAdmin, categoryController.deleteProvince);

// =========================================================================
// 3. QUẬN / HUYỆN
// =========================================================================
router.get("/districts", categoryController.getDistricts);
router.post("/districts", authenticateToken, requireAdmin, categoryController.createDistrict);
router.put("/districts/:code", authenticateToken, requireAdmin, categoryController.updateDistrict);
router.patch("/districts/:code/toggle", authenticateToken, requireAdmin, categoryController.toggleDistrict);
router.delete("/districts/:code", authenticateToken, requireAdmin, categoryController.deleteDistrict);

// =========================================================================
// 4. DỰ ÁN BẤT ĐỘNG SẢN
// =========================================================================
router.get("/projects", categoryController.getProjects);
router.get("/projects/:id", categoryController.getProjectDetail);
router.post("/projects", authenticateToken, requireAdmin, categoryController.createProject);
router.put("/projects/:id", authenticateToken, requireAdmin, categoryController.updateProject);
router.patch("/projects/:id/toggle", authenticateToken, requireAdmin, categoryController.toggleProject);
router.delete("/projects/:id", authenticateToken, requireAdmin, categoryController.deleteProject);

module.exports = router;