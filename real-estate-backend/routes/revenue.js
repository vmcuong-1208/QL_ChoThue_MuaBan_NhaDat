const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authenticateToken");

// Middleware xác thực quyền Admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Chỉ Quản trị viên (Admin) mới có quyền truy cập!" });
  }
  next();
};

/**
 * 1. GET /api/admin/revenue/overview
 * Thống kê tổng doanh thu: Hôm nay, Tháng này, Năm nay, Toàn hệ thống
 */
router.get("/overview", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const promiseDb = db.promise();

    // 1. Tổng toàn hệ thống thành công
    const [allTime] = await promiseDb.query(`
      SELECT 
        COALESCE(SUM(Amount), 0) AS totalRevenue,
        COUNT(*) AS totalTransactions
      FROM GIAODICH 
      WHERE TrangThai = 'SUCCESS'
    `);

    // 2. Hôm nay
    const [today] = await promiseDb.query(`
      SELECT 
        COALESCE(SUM(Amount), 0) AS todayRevenue,
        COUNT(*) AS todayTransactions
      FROM GIAODICH 
      WHERE TrangThai = 'SUCCESS' AND DATE(NgayTao) = CURDATE()
    `);

    // 3. Tháng này
    const [thisMonth] = await promiseDb.query(`
      SELECT 
        COALESCE(SUM(Amount), 0) AS monthRevenue,
        COUNT(*) AS monthTransactions
      FROM GIAODICH 
      WHERE TrangThai = 'SUCCESS' 
        AND MONTH(NgayTao) = MONTH(CURDATE()) 
        AND YEAR(NgayTao) = YEAR(CURDATE())
    `);

    // 4. Năm nay
    const [thisYear] = await promiseDb.query(`
      SELECT 
        COALESCE(SUM(Amount), 0) AS yearRevenue,
        COUNT(*) AS yearTransactions
      FROM GIAODICH 
      WHERE TrangThai = 'SUCCESS' 
        AND YEAR(NgayTao) = YEAR(CURDATE())
    `);

    // 5. Thống kê theo loại dịch vụ (Nâng cấp môi giới, Tin nổi bật, Gói VIP...)
    const [byService] = await promiseDb.query(`
      SELECT 
        LoaiDichVu,
        COUNT(*) AS count,
        COALESCE(SUM(Amount), 0) AS revenue
      FROM GIAODICH 
      WHERE TrangThai = 'SUCCESS'
      GROUP BY LoaiDichVu
      ORDER BY revenue DESC
    `);

    // 6. Thống kê theo phương thức thanh toán (MoMo, VietQR_SePay, VietQR_Manual...)
    const [byMethod] = await promiseDb.query(`
      SELECT 
        PhuongThucThanhToan,
        COUNT(*) AS count,
        COALESCE(SUM(Amount), 0) AS revenue
      FROM GIAODICH 
      WHERE TrangThai = 'SUCCESS'
      GROUP BY PhuongThucThanhToan
      ORDER BY revenue DESC
    `);

    res.json({
      success: true,
      data: {
        totalRevenue: Number(allTime[0].totalRevenue),
        totalTransactions: Number(allTime[0].totalTransactions),
        todayRevenue: Number(today[0].todayRevenue),
        todayTransactions: Number(today[0].todayTransactions),
        monthRevenue: Number(thisMonth[0].monthRevenue),
        monthTransactions: Number(thisMonth[0].monthTransactions),
        yearRevenue: Number(thisYear[0].yearRevenue),
        yearTransactions: Number(thisYear[0].yearTransactions),
        byService: byService.map((item) => ({
          service: item.LoaiDichVu,
          count: Number(item.count),
          revenue: Number(item.revenue),
        })),
        byMethod: byMethod.map((item) => ({
          method: item.PhuongThucThanhToan || "Khác",
          count: Number(item.count),
          revenue: Number(item.revenue),
        })),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy tổng quan doanh thu:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 2. GET /api/admin/revenue/transactions
 * Danh sách lịch sử giao dịch (Phân trang, tìm kiếm, lọc theo loại dịch vụ & trạng thái)
 */
router.get("/transactions", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      service = "ALL",
      status = "ALL",
      method = "ALL",
      fromDate = "",
      toDate = "",
    } = req.query;

    const promiseDb = db.promise();
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (parsedPage - 1) * parsedLimit;

    const conditions = [];
    const params = [];

    if (service && service !== "ALL") {
      conditions.push("g.LoaiDichVu = ?");
      params.push(service);
    }

    if (status && status !== "ALL") {
      conditions.push("g.TrangThai = ?");
      params.push(status);
    }

    if (method && method !== "ALL") {
      conditions.push("g.PhuongThucThanhToan = ?");
      params.push(method);
    }

    if (fromDate) {
      conditions.push("DATE(g.NgayTao) >= ?");
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push("DATE(g.NgayTao) <= ?");
      params.push(toDate);
    }

    if (search && search.trim() !== "") {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        "(g.OrderId LIKE ? OR g.TransId LIKE ? OR u.HoTen LIKE ? OR u.Email LIKE ? OR u.SDT LIKE ? OR g.OrderInfo LIKE ?)"
      );
      params.push(pattern, pattern, pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Đếm tổng số bản ghi
    const [countRows] = await promiseDb.query(
      `SELECT COUNT(*) AS total 
       FROM GIAODICH g
       LEFT JOIN NGUOIDUNG u ON g.MaNgDung = u.MaNgDung
       ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Lấy danh sách giao dịch
    const [rows] = await promiseDb.query(
      `SELECT 
        g.MaGD,
        g.MaNgDung,
        g.OrderId,
        g.TransId,
        g.Amount,
        g.OrderInfo,
        g.LoaiDichVu,
        g.PhuongThucThanhToan,
        g.TrangThai,
        g.NgayTao,
        g.NgayCapNhat,
        u.HoTen AS TenNguoiThanhToan,
        u.Email AS EmailNguoiThanhToan,
        u.SDT AS SDTNguoiThanhToan,
        u.AnhDaiDien
       FROM GIAODICH g
       LEFT JOIN NGUOIDUNG u ON g.MaNgDung = u.MaNgDung
       ${whereClause}
       ORDER BY g.NgayTao DESC
       LIMIT ? OFFSET ?`,
      [...params, parsedLimit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách giao dịch:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

/**
 * 3. GET /api/admin/revenue/analytics
 * Biểu đồ thống kê doanh thu theo thời gian: Theo ngày, tuần, tháng, năm
 * Tự động lấp đầy các mốc thời gian liên tục (kể cả những ngày 0đ)
 */
router.get("/analytics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeRange = "month", year = new Date().getFullYear() } = req.query;
    const promiseDb = db.promise();

    let chartData = [];

    if (timeRange === "day" || timeRange === "7days") {
      // 1. Tạo danh sách 7 ngày liên tiếp từ (Hôm nay - 6 ngày) đến Hôm nay
      const daysMap = {};
      const dateList = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = String(d.getDate()).padStart(2, "0");
        const monthStr = String(d.getMonth() + 1).padStart(2, "0");
        const label = `${dayStr}/${monthStr}`;
        const yyyyMmDd = d.toISOString().slice(0, 10);
        daysMap[label] = {
          timeLabel: label,
          rawDate: yyyyMmDd,
          total: 0,
          moiGioi: 0,
          tinNoiBat: 0,
          dichVuKhac: 0,
        };
        dateList.push(label);
      }

      // Lấy dữ liệu thực tế từ DB
      const [rows] = await promiseDb.query(`
        SELECT 
          DATE_FORMAT(NgayTao, '%d/%m') AS timeLabel,
          DATE(NgayTao) AS rawDate,
          COALESCE(SUM(Amount), 0) AS total,
          COALESCE(SUM(CASE WHEN LoaiDichVu = 'NANG_CAP_MOI_GIOI' THEN Amount ELSE 0 END), 0) AS moiGioi,
          COALESCE(SUM(CASE WHEN LoaiDichVu = 'TIN_NOI_BAT' THEN Amount ELSE 0 END), 0) AS tinNoiBat,
          COALESCE(SUM(CASE WHEN LoaiDichVu NOT IN ('NANG_CAP_MOI_GIOI', 'TIN_NOI_BAT') THEN Amount ELSE 0 END), 0) AS dichVuKhac
        FROM GIAODICH
        WHERE TrangThai = 'SUCCESS' AND NgayTao >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(NgayTao), timeLabel
      `);

      // Gộp vào danh sách 7 ngày
      rows.forEach((r) => {
        if (daysMap[r.timeLabel]) {
          daysMap[r.timeLabel].total = Number(r.total);
          daysMap[r.timeLabel].moiGioi = Number(r.moiGioi);
          daysMap[r.timeLabel].tinNoiBat = Number(r.tinNoiBat);
          daysMap[r.timeLabel].dichVuKhac = Number(r.dichVuKhac);
        }
      });

      chartData = dateList.map((label) => daysMap[label]);
    } else if (timeRange === "month" || timeRange === "30days") {
      // 2. Tạo danh sách 30 ngày liên tiếp
      const daysMap = {};
      const dateList = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = String(d.getDate()).padStart(2, "0");
        const monthStr = String(d.getMonth() + 1).padStart(2, "0");
        const label = `${dayStr}/${monthStr}`;
        const yyyyMmDd = d.toISOString().slice(0, 10);
        daysMap[label] = {
          timeLabel: label,
          rawDate: yyyyMmDd,
          total: 0,
          moiGioi: 0,
          tinNoiBat: 0,
          dichVuKhac: 0,
        };
        dateList.push(label);
      }

      const [rows] = await promiseDb.query(`
        SELECT 
          DATE_FORMAT(NgayTao, '%d/%m') AS timeLabel,
          DATE(NgayTao) AS rawDate,
          COALESCE(SUM(Amount), 0) AS total,
          COALESCE(SUM(CASE WHEN LoaiDichVu = 'NANG_CAP_MOI_GIOI' THEN Amount ELSE 0 END), 0) AS moiGioi,
          COALESCE(SUM(CASE WHEN LoaiDichVu = 'TIN_NOI_BAT' THEN Amount ELSE 0 END), 0) AS tinNoiBat,
          COALESCE(SUM(CASE WHEN LoaiDichVu NOT IN ('NANG_CAP_MOI_GIOI', 'TIN_NOI_BAT') THEN Amount ELSE 0 END), 0) AS dichVuKhac
        FROM GIAODICH
        WHERE TrangThai = 'SUCCESS' AND NgayTao >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(NgayTao), timeLabel
      `);

      rows.forEach((r) => {
        if (daysMap[r.timeLabel]) {
          daysMap[r.timeLabel].total = Number(r.total);
          daysMap[r.timeLabel].moiGioi = Number(r.moiGioi);
          daysMap[r.timeLabel].tinNoiBat = Number(r.tinNoiBat);
          daysMap[r.timeLabel].dichVuKhac = Number(r.dichVuKhac);
        }
      });

      chartData = dateList.map((label) => daysMap[label]);
    } else if (timeRange === "year") {
      // 3. Tạo danh sách đủ 12 tháng của năm
      const monthsMap = {};
      const monthList = [];
      for (let m = 1; m <= 12; m++) {
        const label = `T${m}`;
        monthsMap[m] = {
          timeLabel: label,
          monthNum: m,
          total: 0,
          moiGioi: 0,
          tinNoiBat: 0,
          dichVuKhac: 0,
        };
        monthList.push(m);
      }

      const [rows] = await promiseDb.query(`
        SELECT 
          MONTH(NgayTao) AS monthNum,
          COALESCE(SUM(Amount), 0) AS total,
          COALESCE(SUM(CASE WHEN LoaiDichVu = 'NANG_CAP_MOI_GIOI' THEN Amount ELSE 0 END), 0) AS moiGioi,
          COALESCE(SUM(CASE WHEN LoaiDichVu = 'TIN_NOI_BAT' THEN Amount ELSE 0 END), 0) AS tinNoiBat,
          COALESCE(SUM(CASE WHEN LoaiDichVu NOT IN ('NANG_CAP_MOI_GIOI', 'TIN_NOI_BAT') THEN Amount ELSE 0 END), 0) AS dichVuKhac
        FROM GIAODICH
        WHERE TrangThai = 'SUCCESS' AND YEAR(NgayTao) = ?
        GROUP BY MONTH(NgayTao)
      `, [year]);

      rows.forEach((r) => {
        const m = Number(r.monthNum);
        if (monthsMap[m]) {
          monthsMap[m].total = Number(r.total);
          monthsMap[m].moiGioi = Number(r.moiGioi);
          monthsMap[m].tinNoiBat = Number(r.tinNoiBat);
          monthsMap[m].dichVuKhac = Number(r.dichVuKhac);
        }
      });

      chartData = monthList.map((m) => monthsMap[m]);
    }

    res.json({
      success: true,
      timeRange,
      data: chartData,
    });
  } catch (error) {
    console.error("Lỗi lấy biểu đồ phân tích doanh thu:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
