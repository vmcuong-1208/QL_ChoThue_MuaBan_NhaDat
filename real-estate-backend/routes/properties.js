const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const propertyController = require("../controllers/propertyController");
const authenticateToken = require("../middleware/authenticateToken");

// Cấu hình multer để upload ảnh và video cho bài đăng
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    if (file.fieldname === "HinhAnhGiayTo") {
      uploadDir = path.join(__dirname, "../uploads/documents");
    } else if (file.fieldname === "VideoThuaDat") {
      uploadDir = path.join(__dirname, "../uploads/videos");
    } else {
      uploadDir = path.join(__dirname, "../uploads/properties");
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    let prefix = "property";
    if (file.fieldname === "HinhAnhGiayTo") {
      prefix = "document";
    } else if (file.fieldname === "VideoThuaDat") {
      prefix = "video";
    }

    cb(null, prefix + "-" + uniqueSuffix + ext);
  },
});

// Bộ lọc định dạng file
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "VideoThuaDat") {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file video!"), false);
    }
  } else {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh!"), false);
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const propertyUploadFields = upload.fields([
  { name: "HinhAnh", maxCount: 10 },
  { name: "HinhAnhGiayTo", maxCount: 5 },
  { name: "VideoThuaDat", maxCount: 1 },
]);

// Route lấy danh sách bài đăng (có phân trang và lọc)
router.get("/", propertyController.getAllProperties);

// Route tìm kiếm bài đăng
router.get("/search", propertyController.searchProperties);

// Route lấy bài đăng của người dùng hiện tại (phải đặt trước /:id)
router.get("/user", authenticateToken, propertyController.getUserProperties);

// Route lấy chi tiết bài đăng theo ID
router.get("/:id", propertyController.getPropertyById);

// Route tăng lượt xem bài đăng
router.post("/:id/view", propertyController.incrementViews);

// Route tạo bài đăng mới
router.post(
  "/",
  authenticateToken,
  propertyUploadFields,
  propertyController.createProperty
);

// Route cập nhật bài đăng
router.put(
  "/:id",
  authenticateToken,
  propertyUploadFields,
  propertyController.updateProperty
);

// Route xóa bài đăng
router.delete("/:id", authenticateToken, propertyController.deleteProperty);

module.exports = router;
