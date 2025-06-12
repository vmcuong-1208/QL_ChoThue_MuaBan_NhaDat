const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("../config/db")
const router = express.Router()
const authenticateToken = require("../middleware/authenticateToken")
const multer = require("multer")
const path = require("path")
const transporter = require("../config/nodemailer")
const crypto = require("crypto")
const passport = require("passport")

// Cấu hình multer để lưu file vào thư mục uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ storage })

// Đăng ký tài khoản
router.post("/register", async (req, res) => {
  const { TenDangNhap, Email, MatKhau, SDT } = req.body

  // Kiểm tra đầu vào
  if (!TenDangNhap || !Email || !MatKhau || !SDT) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" })
  }

  try {
    // Kiểm tra email hoặc SDT đã tồn tại chưa
    const checkUser = "SELECT * FROM NGUOIDUNG WHERE Email = ? OR SDT = ?"
    db.query(checkUser, [Email, SDT], async (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi server", error: err })

      if (results.length > 0) {
        return res.status(400).json({ message: "Email hoặc số điện thoại đã tồn tại!" })
      }

      // Hash mật khẩu
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(MatKhau, salt)

      // Thêm user vào database với trạng thái mặc định
      const sql = `INSERT INTO NGUOIDUNG (TenDangNhap, Email, MatKhau, SDT, TrangThai) VALUES (?, ?, ?, ?, 'hoạt động')`
      db.query(sql, [TenDangNhap, Email, hashedPassword, SDT], (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi khi tạo tài khoản", error: err })

        res.status(201).json({
          success: true,
          message: "Đăng ký thành công!",
        })
      })
    })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error })
  }
})

// Đăng nhập người dùng - HỖ TRỢ CẢ EMAIL VÀ TENDANGNHAP
router.post("/login", async (req, res) => {
  const { Email, MatKhau, TenDangNhap } = req.body

  // Chấp nhận cả Email hoặc TenDangNhap
  const loginField = Email || TenDangNhap

  if (!loginField || !MatKhau) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập email/tên đăng nhập và mật khẩu!",
    })
  }

  try {
    // Tìm user bằng email hoặc tên đăng nhập
    const [user] = await db
      .promise()
      .query("SELECT * FROM NGUOIDUNG WHERE Email = ? OR TenDangNhap = ?", [loginField, loginField])

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại!",
      })
    }

    // Kiểm tra trạng thái tài khoản
    if (user[0].TrangThai === "khóa") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.",
      })
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(MatKhau, user[0].MatKhau)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không đúng!",
      })
    }

    // Tạo JWT token với LoaiTaiKhoan
    const token = jwt.sign(
      {
        MaNgDung: user[0].MaNgDung,
        Email: user[0].Email,
        LoaiTaiKhoan: user[0].LoaiTaiKhoan,
        HoTen: user[0].HoTen,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    )

    console.log("Token created with user role:", user[0].LoaiTaiKhoan)

    // Format avatar URL - chỉ xử lý local files
    let avatarUrl = null
    if (user[0].AnhDaiDien) {
      avatarUrl = `http://localhost:5000${user[0].AnhDaiDien}`
    }

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user: {
        MaNgDung: user[0].MaNgDung,
        Email: user[0].Email,
        HoTen: user[0].HoTen,
        SDT: user[0].SDT,
        DiaChi: user[0].DiaChi,
        LoaiTaiKhoan: user[0].LoaiTaiKhoan,
        TrangThai: user[0].TrangThai,
        AnhDaiDien: avatarUrl,
        MoTaBanThan: user[0].MoTaBanThan,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    })
  }
})

// Verify token endpoint
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    // Kiểm tra trạng thái tài khoản hiện tại
    const [user] = await db.promise().query("SELECT TrangThai FROM NGUOIDUNG WHERE MaNgDung = ?", [req.user.MaNgDung])

    if (user.length === 0 || user[0].TrangThai === "khóa") {
      return res.status(403).json({
        valid: false,
        message: "Tài khoản đã bị khóa",
      })
    }

    res.json({
      valid: true,
      user: req.user,
    })
  } catch (error) {
    res.status(500).json({
      valid: false,
      message: "Lỗi server",
    })
  }
})

// Cập nhật thông tin cá nhân
router.put("/update", authenticateToken, upload.single("AnhDaiDien"), async (req, res) => {
  const { HoTen, DiaChi, MoTaBanThan, SDT } = req.body
  const MaNgDung = req.user.MaNgDung

  if (!MaNgDung) {
    return res.status(400).json({ message: "Missing user ID" })
  }

  try {
    // Kiểm tra trạng thái tài khoản
    const [userStatus] = await db.promise().query("SELECT TrangThai FROM NGUOIDUNG WHERE MaNgDung = ?", [MaNgDung])

    if (userStatus.length === 0 || userStatus[0].TrangThai === "khóa") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" })
    }

    // Lấy thông tin user hiện tại để preserve avatar nếu không upload file mới
    const [currentUser] = await db.promise().query("SELECT AnhDaiDien FROM NGUOIDUNG WHERE MaNgDung = ?", [MaNgDung])

    let AnhDaiDien = currentUser[0]?.AnhDaiDien || null

    // Chỉ cập nhật avatar nếu có file mới được upload
    if (req.file) {
      AnhDaiDien = `/uploads/${req.file.filename}`
    }

    const sql = `UPDATE NGUOIDUNG SET 
                     HoTen = COALESCE(?, HoTen), 
                     SDT = COALESCE(?, SDT),
                     DiaChi = COALESCE(?, DiaChi), 
                     AnhDaiDien = COALESCE(?, AnhDaiDien), 
                     MoTaBanThan = COALESCE(?, MoTaBanThan), 
                     NgayCapNhat = NOW()
                  WHERE MaNgDung = ?`

    await db.promise().query(sql, [HoTen, SDT, DiaChi, AnhDaiDien, MoTaBanThan, MaNgDung])

    // Lấy thông tin user đã cập nhật
    const [updatedUser] = await db
      .promise()
      .query(
        `SELECT MaNgDung, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, AnhDaiDien, MoTaBanThan, TrangThai FROM NGUOIDUNG WHERE MaNgDung = ?`,
        [MaNgDung],
      )

    const user = updatedUser[0]

    // Format avatar URL - chỉ xử lý local files
    if (user.AnhDaiDien) {
      user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien}`
    }

    res.json({
      success: true,
      message: "Update successful!",
      user: user,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Failed to update", error: error.message })
  }
})

// API lấy thông tin người dùng
router.get("/me", authenticateToken, async (req, res) => {
  const MaNgDung = req.user.MaNgDung

  if (!MaNgDung) {
    return res.status(400).json({ message: "Thiếu ID người dùng" })
  }

  try {
    const [results] = await db
      .promise()
      .query(
        `SELECT MaNgDung, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, AnhDaiDien, MoTaBanThan, TrangThai FROM NGUOIDUNG WHERE MaNgDung = ?`,
        [MaNgDung],
      )

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" })
    }

    const user = results[0]

    // Kiểm tra trạng thái tài khoản
    if (user.TrangThai === "khóa") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" })
    }

    // Format avatar URL - chỉ xử lý local files
    if (user.AnhDaiDien) {
      user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien}`
    }

    res.json({
      success: true,
      user: user,
    })
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Upgrade account type
router.put("/upgrade", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.MaNgDung
    const { paymentToken, paymentMethod, upgradeType } = req.body

    // Kiểm tra trạng thái tài khoản
    const [userStatus] = await db.promise().query("SELECT TrangThai FROM NGUOIDUNG WHERE MaNgDung = ?", [userId])

    if (userStatus.length === 0 || userStatus[0].TrangThai === "khóa") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" })
    }

    // Validate payment token (in real implementation, verify with payment gateway)
    if (!paymentToken || !paymentMethod || !upgradeType) {
      return res.status(400).json({ message: "Thiếu thông tin thanh toán" })
    }

    // Update user account type
    let newAccountType = "thường"
    if (upgradeType === "broker") {
      newAccountType = "môi giới"
    } else if (upgradeType === "investor") {
      newAccountType = "chủ đầu tư"
    }

    await db.promise().query(`UPDATE NGUOIDUNG SET LoaiTaiKhoan = ? WHERE MaNgDung = ?`, [newAccountType, userId])

    // Get updated user info
    const [users] = await db.promise().query(
      `SELECT MaNgDung, Email, HoTen, SDT, DiaChi, AnhDaiDien, LoaiTaiKhoan, MoTaBanThan, TrangThai 
       FROM NGUOIDUNG WHERE MaNgDung = ?`,
      [userId],
    )

    const user = users[0]

    // Format avatar URL - chỉ xử lý local files
    if (user.AnhDaiDien) {
      user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien}`
    }

    res.json({
      success: true,
      message: "Nâng cấp tài khoản thành công",
      user: user,
    })
  } catch (error) {
    console.error("Lỗi khi nâng cấp tài khoản:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Quên mật khẩu - Gửi OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: "Vui lòng nhập email!" })
  }

  try {
    // Kiểm tra email có tồn tại không và trạng thái tài khoản
    const [users] = await db.promise().query("SELECT * FROM NGUOIDUNG WHERE Email = ?", [email])

    if (users.length === 0) {
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống!" })
    }

    if (users[0].TrangThai === "khóa") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa. Không thể đặt lại mật khẩu." })
    }

    // Tạo mã OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000) // 10 phút

    // Xóa OTP cũ nếu có
    await db.promise().query("DELETE FROM OTP WHERE Email = ?", [email])

    // Lưu OTP vào database
    await db
      .promise()
      .query("INSERT INTO OTP (Email, OTPCode, ThoiGianHetHan) VALUES (?, ?, ?)", [email, otpCode, expiryTime])

    // Gửi email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="color: #007bff; font-size: 24px; margin: 0;">Mã OTP: ${otpCode}</h3>
          </div>
          <p><strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong 10 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    res.json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn!",
    })
  } catch (error) {
    console.error("Lỗi gửi OTP:", error)
    res.status(500).json({ message: "Lỗi server khi gửi OTP" })
  }
})

// Xác thực OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ message: "Vui lòng nhập email và mã OTP!" })
  }

  try {
    const [otpRecords] = await db
      .promise()
      .query("SELECT * FROM OTP WHERE Email = ? AND OTPCode = ? AND DaSuDung = FALSE AND ThoiGianHetHan > NOW()", [
        email,
        otp,
      ])

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn!" })
    }

    res.json({
      success: true,
      message: "Xác thực OTP thành công!",
    })
  } catch (error) {
    console.error("Lỗi xác thực OTP:", error)
    res.status(500).json({ message: "Lỗi server khi xác thực OTP" })
  }
})

// Đặt lại mật khẩu
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu mới!" })
  }

  try {
    // Kiểm tra OTP còn hợp lệ
    const [otpRecords] = await db
      .promise()
      .query("SELECT * FROM OTP WHERE Email = ? AND DaSuDung = FALSE AND ThoiGianHetHan > NOW()", [email])

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: "Phiên đặt lại mật khẩu đã hết hạn!" })
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Cập nhật mật khẩu
    await db.promise().query("UPDATE NGUOIDUNG SET MatKhau = ? WHERE Email = ?", [hashedPassword, email])

    // Đánh dấu OTP đã sử dụng
    await db.promise().query("UPDATE OTP SET DaSuDung = TRUE WHERE Email = ?", [email])

    res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công!",
    })
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error)
    res.status(500).json({ message: "Lỗi server khi đặt lại mật khẩu" })
  }
})

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/auth?error=google_failed" }),
  async (req, res) => {
    try {
      // Kiểm tra trạng thái tài khoản
      if (req.user.TrangThai === "khóa") {
        return res.redirect("http://localhost:3000/auth?error=account_locked")
      }

      // Tạo JWT token cho user
      const token = jwt.sign(
        {
          MaNgDung: req.user.MaNgDung,
          Email: req.user.Email,
          LoaiTaiKhoan: req.user.LoaiTaiKhoan,
          HoTen: req.user.HoTen,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      )

      // Format avatar URL - chỉ xử lý local files
      let avatarUrl = null
      if (req.user.AnhDaiDien) {
        avatarUrl = `http://localhost:5000${req.user.AnhDaiDien}`
      }

      // Redirect về frontend với token
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
          }),
        )}`,
      )
    } catch (error) {
      console.error("Google callback error:", error)
      res.redirect("http://localhost:3000/auth?error=callback_failed")
    }
  },
)

// Logout route
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" })
    }
    res.json({ message: "Logged out successfully" })
  })
})

module.exports = router
