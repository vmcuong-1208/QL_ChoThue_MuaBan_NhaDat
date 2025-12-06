const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verificationController = require("../controllers/verificationController");
const authenticateToken = require("../middleware/authenticateToken");

// Cấu hình multer cho upload file xác thực
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/verification");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "verification-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh hoặc video!"), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan !== "admin") {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
  next();
};

// Gửi yêu cầu xác thực
router.post(
  "/:propertyId",
  authenticateToken,
  upload.fields([
    { name: "fileSoDo", maxCount: 5 },
    { name: "videoXacThuc", maxCount: 1 },
    { name: "fileGiayXacNhan", maxCount: 3 },
    { name: "fileQuyHoach", maxCount: 3 },
  ]),
  verificationController.submitVerification
);

// Lấy danh sách yêu cầu xác thực (Admin)
router.get("/admin/list", authenticateToken, requireAdmin, verificationController.getAdminVerificationList);

// Lấy chi tiết yêu cầu xác thực (Admin)
router.get("/admin/:propertyId", authenticateToken, requireAdmin, verificationController.getAdminVerificationDetail);

// Cập nhật trạng thái xác thực (Admin)
router.put("/admin/:propertyId", authenticateToken, requireAdmin, verificationController.updateVerificationStatus);

// Lấy thông tin xác thực của bài đăng (User)
router.get("/:propertyId", authenticateToken, verificationController.getUserVerification);

module.exports = router;
