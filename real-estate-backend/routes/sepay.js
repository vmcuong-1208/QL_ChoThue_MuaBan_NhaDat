const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authenticateToken");

// Cấu hình tài khoản ngân hàng nhận tiền mặc định
const DEFAULT_BANK_CONFIG = {
  bankId: process.env.SEPAY_BANK_ID || "MBBank", // MBBank, Vietcombank, Techcombank, ACB, TPBank...
  accountNo: process.env.SEPAY_ACCOUNT_NO || "0866690965", // Số tài khoản ngân hàng
  accountName: process.env.SEPAY_ACCOUNT_NAME || "NGUYEN VAN A", // Tên chủ tài khoản
};

/**
 * 1. API: Lấy thông tin thanh toán chuyển khoản SePay / VietQR cho người dùng hiện tại
 * GET /api/sepay/payment-info
 */
router.get("/payment-info", authenticateToken, async (req, res) => {
  try {
    const maNgDung = req.user.MaNgDung;
    const promiseDb = db.promise();

    // Lấy hồ sơ xác minh môi giới mới nhất của user đang chờ thanh toán
    const [records] = await promiseDb.query(
      `SELECT MaXacMinh, SoTienThanhToan, TrangThaiThanhToan 
       FROM XACMINHMOIGIOI 
       WHERE MaNgDung = ? 
       ORDER BY MaXacMinh DESC LIMIT 1`,
      [maNgDung]
    );

    const record = records.length > 0 ? records[0] : null;
    const amount = record ? Number(record.SoTienThanhToan) : 299000;
    const maXacMinh = record ? record.MaXacMinh : maNgDung;

    // Cú pháp nội dung chuyển khoản độc nhất: MG<Mã người dùng> hoặc MG<Mã xác minh>
    // SePay sẽ quét nội dung này trong tin nhắn biến động số dư ngân hàng
    const transferContent = `MG${maNgDung}`;

    // Link ảnh VietQR chuẩn quốc gia NAPAS 247 (Tự động sinh QR động chứa đúng Số TK, Số tiền và Nội dung)
    const qrCodeUrl = `https://img.vietqr.io/image/${DEFAULT_BANK_CONFIG.bankId}-${DEFAULT_BANK_CONFIG.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(DEFAULT_BANK_CONFIG.accountName)}`;

    res.json({
      success: true,
      data: {
        bankId: DEFAULT_BANK_CONFIG.bankId,
        accountNo: DEFAULT_BANK_CONFIG.accountNo,
        accountName: DEFAULT_BANK_CONFIG.accountName,
        amount,
        transferContent,
        qrCodeUrl,
        maXacMinh,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin chuyển khoản VietQR:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 2. API: Webhook tiếp nhận thanh toán tự động từ SePay
 * POST /api/sepay/webhook
 * SePay sẽ tự động gọi API này khi tài khoản ngân hàng của bạn nhận được tiền
 */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("🔔 [SePay Webhook Received]:", JSON.stringify(payload, null, 2));

    // Kiểm tra API Key nếu có cấu hình trong SePay Webhook Authentication
    const authHeader = req.headers.authorization;
    if (process.env.SEPAY_API_KEY) {
      const expectedToken = `Apikey ${process.env.SEPAY_API_KEY}`;
      if (authHeader !== expectedToken) {
        console.warn("⚠️ Cảnh báo: Webhook SePay không khớp API Key");
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
    }

    // Các trường dữ liệu chuẩn từ SePay:
    // payload: { id, gateway, transactionDate, accountNumber, transferType, transferAmount, content, ... }
    const { transferAmount, content, id: transactionId } = payload;

    if (!content) {
      return res.status(400).json({ success: false, message: "Thiếu nội dung chuyển khoản" });
    }

    // Phân tích nội dung chuyển khoản để lấy Mã người dùng (Ví dụ: "MG1", "MG 1", "Chuyen khoan MG1")
    const match = content.match(/MG\s*(\d+)/i);
    if (!match) {
      console.log(`ℹ️ Giao dịch ${transactionId} không chứa cú pháp MG: "${content}"`);
      return res.json({ success: true, message: "Bỏ qua: không khớp cú pháp MG" });
    }

    const maNgDung = parseInt(match[1], 10);
    const amount = Number(transferAmount);

    console.log(`✅ Khớp thanh toán môi giới cho User ID: ${maNgDung}, Số tiền: ${amount}`);

    const promiseDb = db.promise();

    // Cập nhật trạng thái hồ sơ xác minh của user sang ĐÃ THANH TOÁN
    const [updateResult] = await promiseDb.query(
      `UPDATE XACMINHMOIGIOI 
       SET TrangThaiThanhToan = 'DA_THANH_TOAN', 
           PhuongThucThanhToan = 'VietQR_SePay', 
           MaGiaoDich = ?, 
           TrangThai = 'PENDING' 
       WHERE MaNgDung = ? AND TrangThaiThanhToan = 'CHUA_THANH_TOAN'`,
      [transactionId ? String(transactionId) : `SEPAY_${Date.now()}`, maNgDung]
    );

    // Ghi nhận vào bảng doanh thu GIAODICH
    const orderId = `SEPAY_${transactionId || Date.now()}`;
    await promiseDb.query(
      `INSERT INTO GIAODICH 
       (MaNgDung, OrderId, TransId, Amount, OrderInfo, UpgradeType, LoaiDichVu, PhuongThucThanhToan, TrangThai, NgayTao, NgayCapNhat) 
       VALUES (?, ?, ?, ?, ?, 'UPGRADE_BROKER', 'NANG_CAP_MOI_GIOI', 'VietQR_SePay', 'SUCCESS', NOW(), NOW())
       ON DUPLICATE KEY UPDATE TrangThai = 'SUCCESS', TransId = VALUES(TransId), NgayCapNhat = NOW()`,
      [maNgDung, orderId, String(transactionId || orderId), amount, content || "Nâng cấp tài khoản môi giới"]
    );

    // Cập nhật trạng thái user trong NGUOIDUNG sang PENDING (Chờ duyệt)
    await promiseDb.query(
      "UPDATE NGUOIDUNG SET TrangThaiXacMinhMoiGioi = 'PENDING' WHERE MaNgDung = ?",
      [maNgDung]
    );

    // Bắn socket thông báo realtime đến frontend (nếu có io)
    const io = req.app.get("io");
    if (io) {
      io.emit(`payment_success_${maNgDung}`, {
        success: true,
        message: "Thanh toán thành công! Hồ sơ đã được chuyển sang trạng thái chờ xét duyệt.",
        amount,
      });
    }

    return res.json({
      success: true,
      message: "Xử lý webhook SePay thành công",
      updatedRows: updateResult.affectedRows,
    });
  } catch (error) {
    console.error("Lỗi xử lý SePay webhook:", error);
    return res.status(500).json({ success: false, message: "Lỗi xử lý webhook", error: error.message });
  }
});

/**
 * 3. API: Kiểm tra trạng thái thanh toán chuyển khoản từ Frontend (Polling)
 * GET /api/sepay/check-status
 */
router.get("/check-status", authenticateToken, async (req, res) => {
  try {
    const maNgDung = req.user.MaNgDung;
    const promiseDb = db.promise();

    const [records] = await promiseDb.query(
      `SELECT MaXacMinh, TrangThai, TrangThaiThanhToan, PhuongThucThanhToan, MaGiaoDich
       FROM XACMINHMOIGIOI 
       WHERE MaNgDung = ? 
       ORDER BY MaXacMinh DESC LIMIT 1`,
      [maNgDung]
    );

    if (records.length === 0) {
      return res.json({ isPaid: false });
    }

    const latest = records[0];
    const isPaid = latest.TrangThaiThanhToan === "DA_THANH_TOAN";

    res.json({
      isPaid,
      status: latest.TrangThai,
      paymentMethod: latest.PhuongThucThanhToan,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái thanh toán SePay:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 4. API: Xác nhận đã chuyển khoản thủ công (Dành cho trường hợp test hoặc duyệt tay)
 * POST /api/sepay/confirm-transfer
 */
router.post("/confirm-transfer", authenticateToken, async (req, res) => {
  try {
    const maNgDung = req.user.MaNgDung;
    const promiseDb = db.promise();

    // Giả lập hoặc đánh dấu chờ admin xác nhận chuyển khoản
    const transId = `MANUAL_${Date.now()}`;
    await promiseDb.query(
      `UPDATE XACMINHMOIGIOI 
       SET PhuongThucThanhToan = 'VietQR_Manual',
           TrangThaiThanhToan = 'DA_THANH_TOAN',
           TrangThai = 'PENDING',
           MaGiaoDich = ?
       WHERE MaNgDung = ? AND TrangThaiThanhToan = 'CHUA_THANH_TOAN'`,
      [transId, maNgDung]
    );

    // Ghi nhận vào bảng doanh thu GIAODICH
    await promiseDb.query(
      `INSERT INTO GIAODICH 
       (MaNgDung, OrderId, TransId, Amount, OrderInfo, UpgradeType, LoaiDichVu, PhuongThucThanhToan, TrangThai, NgayTao, NgayCapNhat) 
       VALUES (?, ?, ?, 299000.00, 'Nâng cấp tài khoản môi giới (Chuyển khoản)', 'UPGRADE_BROKER', 'NANG_CAP_MOI_GIOI', 'VietQR_Manual', 'SUCCESS', NOW(), NOW())`,
      [maNgDung, transId, transId]
    );

    await promiseDb.query(
      "UPDATE NGUOIDUNG SET TrangThaiXacMinhMoiGioi = 'PENDING' WHERE MaNgDung = ?",
      [maNgDung]
    );

    res.json({
      success: true,
      message: "Đã xác nhận yêu cầu thanh toán chuyển khoản! Hồ sơ của bạn đã được chuyển sang Chờ xét duyệt.",
    });
  } catch (error) {
    console.error("Lỗi xác nhận chuyển khoản:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
