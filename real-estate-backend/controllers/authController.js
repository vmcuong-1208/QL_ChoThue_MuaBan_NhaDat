const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

const register = async (req, res) => {
  const { TenDangNhap, Email, MatKhau, SDT } = req.body;

  if (!TenDangNhap || !Email || !MatKhau || !SDT) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
  }

  try {
    await authService.register({ TenDangNhap, Email, MatKhau, SDT });
    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const login = async (req, res) => {
  const { Email, MatKhau, TenDangNhap } = req.body;
  const loginField = Email || TenDangNhap;

  if (!loginField || !MatKhau) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập email/tên đăng nhập và mật khẩu!",
    });
  }

  try {
    const result = await authService.login({ Email, MatKhau, TenDangNhap });
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      ...result,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    if (error.status === 401 || error.status === 403) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

const verify = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.MaNgDung);
    res.json({
      valid: true,
      user,
    });
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      return res.status(403).json({
        valid: false,
        message: "Tài khoản không hợp lệ hoặc đã bị khóa",
      });
    }
    res.status(500).json({
      valid: false,
      message: "Lỗi server",
    });
  }
};

const update = async (req, res) => {
  const { HoTen, DiaChi, MoTaBanThan, SDT } = req.body;
  const MaNgDung = req.user.MaNgDung;

  try {
    const user = await authService.updateProfile(MaNgDung, {
      HoTen,
      DiaChi,
      MoTaBanThan,
      SDT,
      file: req.file,
    });

    res.json({
      success: true,
      message: "Update successful!",
      user,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update", error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.MaNgDung);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    if (error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const upgrade = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const { paymentToken, paymentMethod, upgradeType } = req.body;

    if (!paymentToken || !paymentMethod || !upgradeType) {
      return res.status(400).json({ message: "Thiếu thông tin thanh toán" });
    }

    const user = await authService.upgradeAccount(userId, upgradeType);
    res.json({
      success: true,
      message: "Nâng cấp tài khoản thành công",
      user,
    });
  } catch (error) {
    console.error("Lỗi khi nâng cấp tài khoản:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Vui lòng nhập email!" });
  }

  try {
    await authService.sendForgotPasswordOTP(email);
    res.json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn!",
    });
  } catch (error) {
    console.error("Lỗi gửi OTP:", error);
    if (error.status === 404 || error.status === 403) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server khi gửi OTP" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Vui lòng nhập email và mã OTP!" });
  }

  try {
    const isValid = await authService.verifyOTP(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn!" });
    }
    res.json({
      success: true,
      message: "Xác thực OTP thành công!",
    });
  } catch (error) {
    console.error("Lỗi xác thực OTP:", error);
    res.status(500).json({ message: "Lỗi server khi xác thực OTP" });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu mới!" });
  }

  try {
    await authService.resetPassword(email, newPassword);
    res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công!",
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server khi đặt lại mật khẩu" });
  }
};

const updateLastSeen = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const lastSeen = await authService.updateLastSeen(userId);
    res.json({
      success: true,
      lastSeen,
    });
  } catch (error) {
    console.error("❌ Lỗi update lastSeen:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

module.exports = {
  register,
  login,
  verify,
  update,
  me,
  upgrade,
  forgotPassword,
  verifyOtp,
  resetPassword,
  updateLastSeen,
};
