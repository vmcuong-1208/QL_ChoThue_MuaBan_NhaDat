const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const contentController = require("../controllers/contentController");
const authenticateToken = require("../middleware/authenticateToken");

// Thư mục lưu trữ hình ảnh nội dung (Banner, Tin tức, Giới thiệu)
const uploadDir = path.join(__dirname, "../uploads/content");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "content-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file định dạng hình ảnh (JPG, PNG, JPEG, WEBP)!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Chỉ Quản trị viên (Admin) mới có quyền thực hiện thao tác này!" });
  }
  next();
};

// ==========================================
// 1. STATS METRICS (ADMIN ONLY)
// ==========================================
router.get("/stats", authenticateToken, requireAdmin, contentController.getContentStats);

// ==========================================
// 2. BANNER ROUTES
// ==========================================
// Công khai danh sách banner đang hiển thị
router.get("/banners", contentController.getAllBanners);
router.get("/banners/:id", authenticateToken, requireAdmin, contentController.getBannerById);
router.post("/banners", authenticateToken, requireAdmin, upload.single("HinhAnh"), contentController.createBanner);
router.put("/banners/:id", authenticateToken, requireAdmin, upload.single("HinhAnh"), contentController.updateBanner);
router.delete("/banners/:id", authenticateToken, requireAdmin, contentController.deleteBanner);
router.patch("/banners/:id/status", authenticateToken, requireAdmin, contentController.toggleBannerStatus);

// ==========================================
// 3. TIN TỨC & BÀI VIẾT ROUTES
// ==========================================
router.get("/news", contentController.getAllNews);
router.get("/news/:idOrSlug", contentController.getNewsDetail);
router.post("/news", authenticateToken, requireAdmin, upload.single("HinhAnh"), contentController.createNews);
router.put("/news/:id", authenticateToken, requireAdmin, upload.single("HinhAnh"), contentController.updateNews);
router.delete("/news/:id", authenticateToken, requireAdmin, contentController.deleteNews);
router.patch("/news/:id/status", authenticateToken, requireAdmin, contentController.toggleNewsStatus);

// ==========================================
// 4. TRANG GIỚI THIỆU & LIÊN HỆ
// ==========================================
router.get("/about", contentController.getAbout);
router.put("/about", authenticateToken, requireAdmin, upload.single("HinhAnh"), contentController.updateAbout);

module.exports = router;
