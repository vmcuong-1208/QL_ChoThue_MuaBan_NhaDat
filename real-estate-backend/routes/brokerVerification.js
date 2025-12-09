const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const brokerVerificationController = require("../controllers/brokerVerificationController");
const authenticateToken = require("../middleware/authenticateToken");

// Thư mục lưu trữ ảnh CCCD xác minh môi giới
const uploadDir = path.join(__dirname, "../uploads/broker-verification");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu file với tên duy nhất
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "cccd-" + uniqueSuffix + ext);
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
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Chỉ Admin mới có quyền thực hiện thao tác này!" });
  }
  next();
};

// Route cho môi giới
router.get("/status", authenticateToken, brokerVerificationController.getVerificationStatus);
router.post("/cancel", authenticateToken, brokerVerificationController.cancelVerification);

router.post(
  "/request",
  authenticateToken,
  upload.fields([
    { name: "anhCCCDMatTruoc", maxCount: 1 },
    { name: "anhCCCDMatSau", maxCount: 1 },
    { name: "anhChanDung", maxCount: 1 },
  ]),
  brokerVerificationController.submitVerification
);

// Route cho admin
router.get(
  "/admin/list",
  authenticateToken,
  requireAdmin,
  brokerVerificationController.getAdminVerificationList
);

router.get(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  brokerVerificationController.getAdminVerificationDetail
);

router.put(
  "/admin/:id/status",
  authenticateToken,
  requireAdmin,
  brokerVerificationController.updateVerificationStatus
);

module.exports = router;
