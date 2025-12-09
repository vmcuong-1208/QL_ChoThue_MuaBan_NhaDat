const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const transporter = require("../config/nodemailer");

const register = async ({ TenDangNhap, Email, MatKhau, SDT }) => {
  const [existing] = await db
    .promise()
    .query("SELECT * FROM NGUOIDUNG WHERE Email = ? OR SDT = ?", [Email, SDT]);

  if (existing.length > 0) {
    const err = new Error("Email hoặc số điện thoại đã tồn tại!");
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(MatKhau, salt);

  const sql = `INSERT INTO NGUOIDUNG (TenDangNhap, Email, MatKhau, SDT, TrangThai) VALUES (?, ?, ?, ?, 'hoạt động')`;
  await db.promise().query(sql, [TenDangNhap, Email, hashedPassword, SDT]);
  return true;
};

const login = async ({ Email, MatKhau, TenDangNhap }) => {
  const loginField = Email || TenDangNhap;
  const [users] = await db
    .promise()
    .query("SELECT * FROM NGUOIDUNG WHERE Email = ? OR TenDangNhap = ?", [loginField, loginField]);

  if (users.length === 0) {
    const err = new Error("Tài khoản không tồn tại!");
    err.status = 401;
    throw err;
  }

  const user = users[0];
  if (user.TrangThai === "khóa") {
    const err = new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.");
    err.status = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(MatKhau, user.MatKhau);
  if (!isMatch) {
    const err = new Error("Mật khẩu không đúng!");
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    {
      MaNgDung: user.MaNgDung,
      Email: user.Email,
      LoaiTaiKhoan: user.LoaiTaiKhoan,
      HoTen: user.HoTen,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  let avatarUrl = null;
  if (user.AnhDaiDien) {
    avatarUrl = user.AnhDaiDien.startsWith("http")
      ? user.AnhDaiDien
      : `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
  }

  return {
    token,
    user: {
      MaNgDung: user.MaNgDung,
      Email: user.Email,
      HoTen: user.HoTen,
      SDT: user.SDT,
      DiaChi: user.DiaChi,
      LoaiTaiKhoan: user.LoaiTaiKhoan,
      TrangThai: user.TrangThai,
      AnhDaiDien: avatarUrl,
      MoTaBanThan: user.MoTaBanThan,
      TenChungChi: user.TenChungChi || null,
      SoChungChi: user.SoChungChi || null,
      NgayCapChungChi: user.NgayCapChungChi || null,
      FileChungChi: user.FileChungChi || null,
      KhuVucChuyenMon: user.KhuVucChuyenMon || null,
    },
  };
};

const getProfile = async (MaNgDung) => {
  const [results] = await db
    .promise()
    .query(
      `SELECT MaNgDung, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, AnhDaiDien, MoTaBanThan, 
              TenChungChi, SoChungChi, NgayCapChungChi, FileChungChi, KhuVucChuyenMon, TrangThai 
       FROM NGUOIDUNG WHERE MaNgDung = ?`,
      [MaNgDung]
    );

  if (results.length === 0) {
    const err = new Error("Không tìm thấy người dùng");
    err.status = 404;
    throw err;
  }

  const user = results[0];
  if (user.TrangThai === "khóa") {
    const err = new Error("Tài khoản đã bị khóa");
    err.status = 403;
    throw err;
  }

  if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
    user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
  }

  if (user.FileChungChi && !user.FileChungChi.startsWith("http")) {
    user.FileChungChi = `http://localhost:5000${user.FileChungChi.startsWith("/") ? "" : "/"}${user.FileChungChi}`;
  }

  return user;
};

const updateProfile = async (
  MaNgDung,
  {
    HoTen,
    DiaChi,
    MoTaBanThan,
    SDT,
    TenChungChi,
    SoChungChi,
    NgayCapChungChi,
    KhuVucChuyenMon,
    files = {},
  }
) => {
  const [userStatus] = await db
    .promise()
    .query("SELECT TrangThai, AnhDaiDien, FileChungChi FROM NGUOIDUNG WHERE MaNgDung = ?", [MaNgDung]);

  if (userStatus.length === 0 || userStatus[0].TrangThai === "khóa") {
    const err = new Error("Tài khoản đã bị khóa");
    err.status = 403;
    throw err;
  }

  let AnhDaiDien = userStatus[0]?.AnhDaiDien || null;
  if (files?.AnhDaiDien?.[0]) {
    AnhDaiDien = `/uploads/${files.AnhDaiDien[0].filename}`;
  }

  let FileChungChi = userStatus[0]?.FileChungChi || null;
  if (files?.FileChungChi?.[0]) {
    FileChungChi = `/uploads/${files.FileChungChi[0].filename}`;
  }

  const formattedDate = NgayCapChungChi && NgayCapChungChi.trim() ? NgayCapChungChi.trim() : null;

  const sql = `UPDATE NGUOIDUNG SET 
                 HoTen = COALESCE(?, HoTen), 
                 SDT = COALESCE(?, SDT),
                 DiaChi = COALESCE(?, DiaChi), 
                 AnhDaiDien = COALESCE(?, AnhDaiDien), 
                 MoTaBanThan = COALESCE(?, MoTaBanThan),
                 TenChungChi = COALESCE(?, TenChungChi),
                 SoChungChi = COALESCE(?, SoChungChi),
                 NgayCapChungChi = COALESCE(?, NgayCapChungChi),
                 FileChungChi = COALESCE(?, FileChungChi),
                 KhuVucChuyenMon = COALESCE(?, KhuVucChuyenMon),
                 NgayCapNhat = NOW()
              WHERE MaNgDung = ?`;

  await db
    .promise()
    .query(sql, [
      HoTen,
      SDT,
      DiaChi,
      AnhDaiDien,
      MoTaBanThan,
      TenChungChi,
      SoChungChi,
      formattedDate,
      FileChungChi,
      KhuVucChuyenMon,
      MaNgDung,
    ]);

  const [updatedUser] = await db
    .promise()
    .query(
      `SELECT MaNgDung, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, AnhDaiDien, MoTaBanThan, 
              TenChungChi, SoChungChi, NgayCapChungChi, FileChungChi, KhuVucChuyenMon, TrangThai 
       FROM NGUOIDUNG WHERE MaNgDung = ?`,
      [MaNgDung]
    );

  const user = updatedUser[0];
  if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
    user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
  }
  if (user.FileChungChi && !user.FileChungChi.startsWith("http")) {
    user.FileChungChi = `http://localhost:5000${user.FileChungChi.startsWith("/") ? "" : "/"}${user.FileChungChi}`;
  }

  return user;
};

const upgradeAccount = async (userId, upgradeType) => {
  let newAccountType = "thường";
  if (upgradeType === "broker") {
    newAccountType = "môi giới";
  } else if (upgradeType === "investor") {
    newAccountType = "chủ đầu tư";
  }

  await db.promise().query(`UPDATE NGUOIDUNG SET LoaiTaiKhoan = ? WHERE MaNgDung = ?`, [newAccountType, userId]);

  const [users] = await db.promise().query(
    `SELECT MaNgDung, Email, HoTen, SDT, DiaChi, AnhDaiDien, LoaiTaiKhoan, MoTaBanThan, TrangThai 
     FROM NGUOIDUNG WHERE MaNgDung = ?`,
    [userId]
  );

  const user = users[0];
  if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
    user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
  }

  return user;
};

const sendForgotPasswordOTP = async (email) => {
  const [users] = await db.promise().query("SELECT * FROM NGUOIDUNG WHERE Email = ?", [email]);

  if (users.length === 0) {
    const err = new Error("Email không tồn tại trong hệ thống!");
    err.status = 404;
    throw err;
  }

  if (users[0].TrangThai === "khóa") {
    const err = new Error("Tài khoản đã bị khóa. Không thể đặt lại mật khẩu.");
    err.status = 403;
    throw err;
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

  await db.promise().query("DELETE FROM OTP WHERE Email = ?", [email]);
  await db
    .promise()
    .query("INSERT INTO OTP (Email, OTPCode, ThoiGianHetHan) VALUES (?, ?, ?)", [email, otpCode, expiryTime]);

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
  };

  await transporter.sendMail(mailOptions);
  return true;
};

const verifyOTP = async (email, otp) => {
  const [otpRecords] = await db
    .promise()
    .query("SELECT * FROM OTP WHERE Email = ? AND OTPCode = ? AND DaSuDung = FALSE AND ThoiGianHetHan > NOW()", [
      email,
      otp,
    ]);

  return otpRecords.length > 0;
};

const resetPassword = async (email, newPassword) => {
  const [otpRecords] = await db
    .promise()
    .query("SELECT * FROM OTP WHERE Email = ? AND DaSuDung = FALSE AND ThoiGianHetHan > NOW()", [email]);

  if (otpRecords.length === 0) {
    const err = new Error("Phiên đặt lại mật khẩu đã hết hạn!");
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await db.promise().query("UPDATE NGUOIDUNG SET MatKhau = ? WHERE Email = ?", [hashedPassword, email]);
  await db.promise().query("UPDATE OTP SET DaSuDung = TRUE WHERE Email = ?", [email]);

  return true;
};

const updateLastSeen = async (userId) => {
  const lastSeenTime = new Date();
  await db.promise().query("UPDATE NGUOIDUNG SET LastSeen = ? WHERE MaNgDung = ?", [lastSeenTime, userId]);
  return lastSeenTime;
};

const changePassword = async ({ userId, oldPassword, newPassword }) => {
  if (!userId || !oldPassword || !newPassword) {
    const err = new Error("Vui lòng cung cấp đầy đủ mật khẩu cũ và mật khẩu mới!");
    err.status = 400;
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error("Mật khẩu mới phải có ít nhất 6 ký tự!");
    err.status = 400;
    throw err;
  }

  const [users] = await db
    .promise()
    .query("SELECT MaNgDung, MatKhau FROM NGUOIDUNG WHERE MaNgDung = ?", [userId]);

  if (!users || users.length === 0) {
    const err = new Error("Người dùng không tồn tại!");
    err.status = 404;
    throw err;
  }

  const user = users[0];
  const isMatch = await bcrypt.compare(oldPassword, user.MatKhau);
  if (!isMatch) {
    const err = new Error("Mật khẩu hiện tại không chính xác!");
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await db
    .promise()
    .query("UPDATE NGUOIDUNG SET MatKhau = ? WHERE MaNgDung = ?", [hashedPassword, userId]);

  return true;
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  upgradeAccount,
  sendForgotPasswordOTP,
  verifyOTP,
  resetPassword,
  updateLastSeen,
  changePassword,
};
