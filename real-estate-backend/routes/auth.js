const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authenticateToken");

// Cấu hình multer để lưu file vào thư mục uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Đăng ký & Đăng nhập
router.post("/register", authController.register);
router.post("/login", authController.login);

// Verify token
router.get("/verify", authenticateToken, authController.verify);

// Cập nhật thông tin cá nhân
router.put("/update", authenticateToken, upload.single("AnhDaiDien"), authController.update);

// Thông tin tài khoản hiện tại
router.get("/me", authenticateToken, authController.me);

// Nâng cấp tài khoản
router.put("/upgrade", authenticateToken, authController.upgrade);

// Quên mật khẩu & OTP
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);

// Cập nhật last seen
router.put("/update-last-seen", authenticateToken, authController.updateLastSeen);

// Google OAuth routes
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      message: "Tính năng đăng nhập Google chưa được cấu hình Client ID / Secret trên hệ thống.",
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect("http://localhost:3000/auth?error=google_not_configured");
    }
    passport.authenticate("google", {
      failureRedirect: "http://localhost:3000/auth?error=google_failed",
    })(req, res, next);
  },
  async (req, res) => {
    try {
      if (req.user.TrangThai === "khóa") {
        return res.redirect("http://localhost:3000/auth?error=account_locked");
      }

      const token = jwt.sign(
        {
          MaNgDung: req.user.MaNgDung,
          Email: req.user.Email,
          LoaiTaiKhoan: req.user.LoaiTaiKhoan,
          HoTen: req.user.HoTen,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      let avatarUrl = null;
      if (req.user.AnhDaiDien) {
        avatarUrl = `http://localhost:5000${req.user.AnhDaiDien}`;
      }

      res.redirect(
        `http://localhost:3000/auth/google/success?token=${token}&user=${encodeURIComponent(
          JSON.stringify({
            MaNgDung: req.user.MaNgDung,
            Email: req.user.Email,
            HoTen: req.user.HoTen,
            SDT: req.user.SDT,
            DiaChi: req.user.DiaChi,
            LoaiTaiKhoan: req.user.LoaiTaiKhoan,
            TrangThai: req.user.TrangThai,
            AnhDaiDien: avatarUrl,
            MoTaBanThan: req.user.MoTaBanThan,
          })
        )}`
      );
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect("http://localhost:3000/auth?error=callback_failed");
    }
  }
);

// Logout route
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
