const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authenticateToken");

// Danh sách các gói tin nổi bật chuẩn hệ thống theo đặc tả
const FEATURED_PLANS = {
  "3_DAYS": { planId: "3_DAYS", name: "Gói 3 ngày", days: 3, price: 30000, description: "Hiển thị ưu tiên trong 3 ngày" },
  "7_DAYS": { planId: "7_DAYS", name: "Gói 7 ngày", days: 7, price: 60000, description: "Hiển thị ưu tiên trong 7 ngày (Tiết kiệm 5%)" },
  "30_DAYS": { planId: "30_DAYS", name: "Gói 30 ngày", days: 30, price: 200000, description: "Hiển thị ưu tiên cả tháng (Tối ưu nhất)" },
};

// Cấu hình ngân hàng cho VietQR SePay
const DEFAULT_BANK_CONFIG = {
  bankId: process.env.SEPAY_BANK_ID || "MBBank",
  accountNo: process.env.SEPAY_ACCOUNT_NO || "0000000001",
  accountName: process.env.SEPAY_ACCOUNT_NAME || "VU MANH CUONG",
};

/**
 * 1. GET /api/featured-posts/plans
 * Lấy danh sách các gói tin nổi bật
 */
router.get("/plans", (req, res) => {
  res.json({
    success: true,
    data: Object.values(FEATURED_PLANS),
  });
});

/**
 * 2. POST /api/featured-posts/register
 * Môi giới tạo đơn đăng ký tin nổi bật cho một bài đăng
 */
router.post("/register", authenticateToken, async (req, res) => {
  try {
    const maNgDung = req.user.MaNgDung;
    const { propertyId, planId, paymentMethod = "VietQR_SePay" } = req.body;

    if (!propertyId || !planId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bài đăng hoặc gói dịch vụ" });
    }

    const plan = FEATURED_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: "Gói dịch vụ không hợp lệ" });
    }

    const promiseDb = db.promise();

    // Kiểm tra quyền sở hữu bài đăng
    const [properties] = await promiseDb.query(
      `SELECT MaTTND, TieuDe, MaNgDung, Featured, FeaturedEndDate 
       FROM thongtinnhadat 
       WHERE MaTTND = ?`,
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ success: false, message: "Bài đăng không tồn tại" });
    }

    const prop = properties[0];
    if (prop.MaNgDung !== maNgDung && req.user.LoaiTaiKhoan?.toLowerCase() !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền đăng ký cho bài đăng này" });
    }

    // Tạo bản ghi đăng ký tin nổi bật mới
    const [insertResult] = await promiseDb.query(
      `INSERT INTO DANGKYTINNOIBAT 
       (MaTTND, MaNgDung, GoiDichVu, SoNgay, SoTien, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai, NgayTao)
       VALUES (?, ?, ?, ?, ?, ?, 'CHUA_THANH_TOAN', 'ACTIVE', NOW())`,
      [propertyId, maNgDung, plan.planId, plan.days, plan.price, paymentMethod]
    );

    const registrationId = insertResult.insertId;

    // Sinh cú pháp chuyển khoản độc nhất: NB<MaDK> (Ví dụ: NB1, NB2)
    const transferContent = `NB${registrationId}`;

    // Tạo link VietQR chuẩn NAPAS 247
    const qrCodeUrl = `https://img.vietqr.io/image/${DEFAULT_BANK_CONFIG.bankId}-${DEFAULT_BANK_CONFIG.accountNo}-compact2.png?amount=${plan.price}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(DEFAULT_BANK_CONFIG.accountName)}`;

    res.json({
      success: true,
      data: {
        registrationId,
        propertyId,
        propertyTitle: prop.TieuDe,
        plan,
        paymentInfo: {
          bankId: DEFAULT_BANK_CONFIG.bankId,
          accountNo: DEFAULT_BANK_CONFIG.accountNo,
          accountName: DEFAULT_BANK_CONFIG.accountName,
          amount: plan.price,
          transferContent,
          qrCodeUrl,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký tin nổi bật:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 3. GET /api/featured-posts/check-status/:registrationId
 * Polling kiểm tra trạng thái thanh toán từ frontend
 */
router.get("/check-status/:registrationId", authenticateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const promiseDb = db.promise();

    const [regs] = await promiseDb.query(
      `SELECT d.*, t.TieuDe, t.Featured, t.FeaturedStartDate, t.FeaturedEndDate 
       FROM DANGKYTINNOIBAT d
       JOIN thongtinnhadat t ON d.MaTTND = t.MaTTND
       WHERE d.MaDK = ?`,
      [registrationId]
    );

    if (regs.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu đăng ký" });
    }

    const reg = regs[0];
    res.json({
      success: true,
      data: {
        registrationId: reg.MaDK,
        propertyId: reg.MaTTND,
        isPaid: reg.TrangThaiThanhToan === "DA_THANH_TOAN",
        status: reg.TrangThai,
        startDate: reg.NgayBatDau,
        endDate: reg.NgayKetThuc,
        featuredEndDate: reg.FeaturedEndDate,
      },
    });
  } catch (error) {
    console.error("Lỗi check status tin nổi bật:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 4. POST /api/featured-posts/confirm-manual
 * Nút xác nhận thanh toán thủ công (Test mode / môi giới bấm xác nhận)
 */
router.post("/confirm-manual", authenticateToken, async (req, res) => {
  try {
    const { registrationId } = req.body;
    if (!registrationId) {
      return res.status(400).json({ success: false, message: "Thiếu mã đăng ký" });
    }

    const promiseDb = db.promise();
    const [regs] = await promiseDb.query(`SELECT * FROM DANGKYTINNOIBAT WHERE MaDK = ?`, [registrationId]);
    if (regs.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu đăng ký" });
    }

    const reg = regs[0];
    const days = reg.SoNgay || 3;
    const transId = `CONFIRM_MANUAL_NB_${reg.MaDK}_${Date.now()}`;

    // Cập nhật DANGKYTINNOIBAT
    await promiseDb.query(
      `UPDATE DANGKYTINNOIBAT 
       SET TrangThaiThanhToan = 'DA_THANH_TOAN',
           MaGiaoDich = ?,
           NgayBatDau = NOW(),
           NgayKetThuc = DATE_ADD(NOW(), INTERVAL ? DAY),
           TrangThai = 'ACTIVE'
       WHERE MaDK = ?`,
      [transId, days, reg.MaDK]
    );

    // Kích hoạt Featured cho bài đăng
    await promiseDb.query(
      `UPDATE thongtinnhadat 
       SET Featured = 1,
           FeaturedStartDate = NOW(),
           FeaturedEndDate = DATE_ADD(NOW(), INTERVAL ? DAY),
           FeaturedPlan = ?
       WHERE MaTTND = ?`,
      [days, reg.GoiDichVu, reg.MaTTND]
    );

    // Ghi vào bảng GIAODICH cho hệ thống Quản lý Doanh thu
    await promiseDb.query(
      `INSERT INTO GIAODICH 
       (MaNgDung, OrderId, TransId, Amount, OrderInfo, UpgradeType, LoaiDichVu, PhuongThucThanhToan, TrangThai, NgayTao, NgayCapNhat)
       VALUES (?, ?, ?, ?, ?, 'FEATURED_POST', 'TIN_NOI_BAT', ?, 'SUCCESS', NOW(), NOW())`,
      [
        reg.MaNgDung,
        `ORDER_NB_${reg.MaDK}`,
        transId,
        reg.SoTien,
        `Đăng ký tin nổi bật #${reg.MaTTND} (${days} ngày)`,
        reg.PhuongThucThanhToan || "VietQR_SePay",
      ]
    );

    res.json({
      success: true,
      message: "Kích hoạt tin nổi bật thành công!",
      data: {
        propertyId: reg.MaTTND,
        days,
      },
    });
  } catch (error) {
    console.error("Lỗi xác nhận tin nổi bật:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 5. GET /api/featured-posts/admin/list
 * Admin: Lấy danh sách tin đang hoặc từng nổi bật, thời gian còn hiệu lực
 */
router.get("/admin/list", authenticateToken, async (req, res) => {
  try {
    if (req.user.LoaiTaiKhoan?.toLowerCase() !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
    }

    const promiseDb = db.promise();
    const [rows] = await promiseDb.query(
      `SELECT 
         t.MaTTND, t.TieuDe, t.Gia, t.DienTich, t.Featured, t.FeaturedStartDate, t.FeaturedEndDate, t.FeaturedPlan,
         u.MaNgDung, u.HoTen, u.Email, u.SDT AS SoDienThoai,
         CASE 
           WHEN t.Featured = 1 AND (t.FeaturedEndDate IS NULL OR t.FeaturedEndDate >= NOW()) THEN 'ACTIVE'
           WHEN t.Featured = 1 AND t.FeaturedEndDate < NOW() THEN 'EXPIRED'
           ELSE 'PAUSED'
         END AS TinhTrangHieuLuc,
         TIMESTAMPDIFF(HOUR, NOW(), t.FeaturedEndDate) AS GioConLai
       FROM thongtinnhadat t
       LEFT JOIN nguoidung u ON t.MaNgDung = u.MaNgDung
       WHERE t.FeaturedStartDate IS NOT NULL OR t.Featured = 1
       ORDER BY (t.Featured = 1 AND (t.FeaturedEndDate IS NULL OR t.FeaturedEndDate >= NOW())) DESC, t.FeaturedEndDate DESC`
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Lỗi admin lấy danh sách tin nổi bật:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 6. POST /api/featured-posts/admin/toggle-status
 * Admin: Tạm ngưng hoặc khôi phục tin nổi bật nếu vi phạm
 */
router.post("/admin/toggle-status", authenticateToken, async (req, res) => {
  try {
    if (req.user.LoaiTaiKhoan?.toLowerCase() !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
    }

    const { propertyId, active } = req.body;
    if (!propertyId) {
      return res.status(400).json({ success: false, message: "Thiếu propertyId" });
    }

    const promiseDb = db.promise();
    await promiseDb.query(
      `UPDATE thongtinnhadat 
       SET Featured = ? 
       WHERE MaTTND = ?`,
      [active ? 1 : 0, propertyId]
    );

    res.json({
      success: true,
      message: active ? "Đã kích hoạt lại tin nổi bật" : "Đã tạm ngưng tin nổi bật",
    });
  } catch (error) {
    console.error("Lỗi toggle status tin nổi bật:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
