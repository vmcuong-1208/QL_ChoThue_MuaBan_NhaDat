const db = require("../config/db");

/**
 * Lấy trạng thái xác minh của một tài khoản môi giới
 */
const getVerificationStatus = async (maNgDung) => {
  const promiseDb = db.promise();
  
  // 1. Lấy trạng thái từ bảng NGUOIDUNG
  const [users] = await promiseDb.query(
    "SELECT MaNgDung, HoTen, Email, SDT, LoaiTaiKhoan, TrangThaiXacMinhMoiGioi FROM NGUOIDUNG WHERE MaNgDung = ?",
    [maNgDung]
  );
  if (!users || users.length === 0) {
    throw new Error("Không tìm thấy người dùng");
  }

  const user = users[0];

  // 2. Lấy hồ sơ xác minh mới nhất (nếu có)
  const [records] = await promiseDb.query(
    `SELECT xm.*, admin.HoTen as TenNguoiDuyet 
     FROM XACMINHMOIGIOI xm
     LEFT JOIN NGUOIDUNG admin ON xm.NguoiDuyet = admin.MaNgDung
     WHERE xm.MaNgDung = ? 
     ORDER BY xm.MaXacMinh DESC LIMIT 1`,
    [maNgDung]
  );

  const latest = records.length > 0 ? records[0] : null;

  // Nếu hồ sơ mới nhất chưa thanh toán thì không coi là đã nộp/chờ xét duyệt
  if (latest && latest.TrangThaiThanhToan !== "DA_THANH_TOAN") {
    return {
      userStatus: "CHUA_XAC_MINH",
      latestRecord: null,
    };
  }

  return {
    userStatus: user.TrangThaiXacMinhMoiGioi || "CHUA_XAC_MINH",
    latestRecord: latest,
  };
};

/**
 * Môi giới nộp hồ sơ xác minh CCCD
 */
const submitVerification = async ({
  maNgDung,
  soCCCD = null,
  anhCCCDMatTruoc,
  anhCCCDMatSau,
  anhChanDung = null,
  sdtLienHe = null,
  khuVucHoatDong = null,
}) => {
  const promiseDb = db.promise();

  // Kiểm tra người dùng
  const [users] = await promiseDb.query(
    "SELECT MaNgDung, LoaiTaiKhoan, TrangThaiXacMinhMoiGioi FROM NGUOIDUNG WHERE MaNgDung = ?",
    [maNgDung]
  );
  if (!users || users.length === 0) {
    throw new Error("Người dùng không tồn tại");
  }

  // Chèn hồ sơ xác minh mới với trạng thái ban đầu: PENDING, TrangThaiThanhToan: CHUA_THANH_TOAN, Phí: 299000
  const [insertResult] = await promiseDb.query(
    `INSERT INTO XACMINHMOIGIOI 
     (MaNgDung, SoCCCD, AnhCCCDMatTruoc, AnhCCCDMatSau, AnhChanDung, SDTLienHe, KhuVucHoatDong, TrangThai, TrangThaiThanhToan, SoTienThanhToan, NgayGui) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 'CHUA_THANH_TOAN', 299000.00, NOW())`,
    [maNgDung, soCCCD, anhCCCDMatTruoc, anhCCCDMatSau, anhChanDung, sdtLienHe, khuVucHoatDong]
  );

  // Cập nhật trạng thái người dùng sang PENDING
  await promiseDb.query(
    "UPDATE NGUOIDUNG SET TrangThaiXacMinhMoiGioi = 'PENDING' WHERE MaNgDung = ?",
    [maNgDung]
  );

  return {
    maXacMinh: insertResult.insertId,
    status: "PENDING",
    soTienThanhToan: 299000,
  };
};

/**
 * Hủy hồ sơ đăng ký môi giới đang PENDING của người dùng nếu họ hủy thanh toán
 */
const cancelPendingVerification = async (maNgDung) => {
  const promiseDb = db.promise();

  // Xóa tất cả hồ sơ chưa thanh toán của user này
  await promiseDb.query(
    "DELETE FROM XACMINHMOIGIOI WHERE MaNgDung = ? AND TrangThaiThanhToan = 'CHUA_THANH_TOAN'",
    [maNgDung]
  );

  // Đặt lại trạng thái người dùng về CHUA_XAC_MINH (hoặc trạng thái cũ nếu chưa phải môi giới)
  const [users] = await promiseDb.query(
    "SELECT LoaiTaiKhoan FROM NGUOIDUNG WHERE MaNgDung = ?",
    [maNgDung]
  );

  const isBroker = users.length > 0 && (users[0].LoaiTaiKhoan || "").toLowerCase().includes("môi");
  if (!isBroker) {
    await promiseDb.query(
      "UPDATE NGUOIDUNG SET TrangThaiXacMinhMoiGioi = 'CHUA_XAC_MINH' WHERE MaNgDung = ?",
      [maNgDung]
    );
  }

  return { success: true };
};

/**
 * Admin: Lấy danh sách hồ sơ xác minh môi giới (có phân trang, tìm kiếm, lọc)
 */
const getAdminVerificationList = async ({
  status = "ALL",
  search = "",
  page = 1,
  limit = 10,
}) => {
  const promiseDb = db.promise();
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const params = [];

  // Lọc theo trạng thái
  if (status && status !== "ALL") {
    conditions.push("xm.TrangThai = ?");
    params.push(status);
  }

  // Tìm kiếm theo tên, sđt, email, số cccd
  if (search && search.trim() !== "") {
    conditions.push(
      "(u.HoTen LIKE ? OR u.Email LIKE ? OR u.SDT LIKE ? OR xm.SoCCCD LIKE ?)"
    );
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  // Query danh sách
  const query = `
    SELECT 
      xm.MaXacMinh,
      xm.MaNgDung,
      xm.SoCCCD,
      xm.AnhCCCDMatTruoc,
      xm.AnhCCCDMatSau,
      xm.AnhChanDung,
      xm.SDTLienHe,
      xm.KhuVucHoatDong,
      xm.TrangThaiThanhToan,
      xm.SoTienThanhToan,
      xm.PhuongThucThanhToan,
      xm.MaGiaoDichMoMo,
      xm.TrangThai,
      xm.GhiChuAdmin,
      xm.NgayGui,
      xm.NgayDuyet,
      u.HoTen,
      u.Email,
      u.SDT,
      u.AnhDaiDien,
      u.DiaChi,
      u.LoaiTaiKhoan,
      admin.HoTen as TenNguoiDuyet
    FROM XACMINHMOIGIOI xm
    INNER JOIN NGUOIDUNG u ON xm.MaNgDung = u.MaNgDung
    LEFT JOIN NGUOIDUNG admin ON xm.NguoiDuyet = admin.MaNgDung
    ${whereClause}
    ORDER BY 
      CASE WHEN xm.TrangThai = 'PENDING' THEN 1 ELSE 2 END,
      xm.NgayGui DESC
    LIMIT ? OFFSET ?
  `;

  const [records] = await promiseDb.query(query, [...params, parsedLimit, offset]);

  // Đếm tổng theo điều kiện lọc
  const countQuery = `
    SELECT COUNT(*) as total
    FROM XACMINHMOIGIOI xm
    INNER JOIN NGUOIDUNG u ON xm.MaNgDung = u.MaNgDung
    ${whereClause}
  `;
  const [countResult] = await promiseDb.query(countQuery, params);
  const total = countResult[0]?.total || 0;

  // Thống kê nhanh số lượng theo từng trạng thái
  const [counts] = await promiseDb.query(`
    SELECT 
      COUNT(*) as totalAll,
      SUM(CASE WHEN TrangThai = 'PENDING' THEN 1 ELSE 0 END) as totalPending,
      SUM(CASE WHEN TrangThai = 'VERIFIED' THEN 1 ELSE 0 END) as totalVerified,
      SUM(CASE WHEN TrangThai = 'REJECTED' THEN 1 ELSE 0 END) as totalRejected
    FROM XACMINHMOIGIOI
  `);

  return {
    records,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
    counts: {
      all: counts[0]?.totalAll || 0,
      pending: counts[0]?.totalPending || 0,
      verified: counts[0]?.totalVerified || 0,
      rejected: counts[0]?.totalRejected || 0,
    },
  };
};

/**
 * Admin: Lấy chi tiết hồ sơ xác minh
 */
const getAdminVerificationDetail = async (maXacMinh) => {
  const promiseDb = db.promise();

  const [records] = await promiseDb.query(
    `SELECT 
      xm.*,
      u.HoTen,
      u.Email,
      u.SDT,
      u.AnhDaiDien,
      u.DiaChi,
      u.LoaiTaiKhoan,
      u.NgayTao as NgayTaoTaiKhoan,
      admin.HoTen as TenNguoiDuyet
    FROM XACMINHMOIGIOI xm
    INNER JOIN NGUOIDUNG u ON xm.MaNgDung = u.MaNgDung
    LEFT JOIN NGUOIDUNG admin ON xm.NguoiDuyet = admin.MaNgDung
    WHERE xm.MaXacMinh = ?`,
    [maXacMinh]
  );

  return records.length > 0 ? records[0] : null;
};

/**
 * Admin: Cập nhật trạng thái xác minh (Duyệt VERIFIED hoặc Từ chối REJECTED)
 */
const updateVerificationStatus = async ({
  maXacMinh,
  status,
  ghiChuAdmin = "",
  adminId,
}) => {
  const promiseDb = db.promise();

  if (!["VERIFIED", "REJECTED", "PENDING"].includes(status)) {
    throw new Error("Trạng thái không hợp lệ. Chỉ chấp nhận PENDING, VERIFIED, REJECTED");
  }

  // 1. Lấy thông tin hồ sơ
  const [records] = await promiseDb.query(
    "SELECT MaXacMinh, MaNgDung, TrangThaiThanhToan FROM XACMINHMOIGIOI WHERE MaXacMinh = ?",
    [maXacMinh]
  );
  if (!records || records.length === 0) {
    throw new Error("Không tìm thấy hồ sơ xác minh");
  }

  const maNgDung = records[0].MaNgDung;
  const daThanhToan = records[0].TrangThaiThanhToan === "DA_THANH_TOAN";

  if (status === "VERIFIED" && !daThanhToan) {
    throw new Error("Không thể phê duyệt hồ sơ chưa hoàn tất thanh toán phí đăng ký!");
  }

  // 2. Cập nhật bảng XACMINHMOIGIOI
  await promiseDb.query(
    `UPDATE XACMINHMOIGIOI 
     SET TrangThai = ?, GhiChuAdmin = ?, NgayDuyet = NOW(), NguoiDuyet = ? 
     WHERE MaXacMinh = ?`,
    [status, ghiChuAdmin, adminId, maXacMinh]
  );

  // 3. Cập nhật trạng thái người dùng trong NGUOIDUNG (nếu VERIFIED thì nâng cấp thành Môi giới)
  if (status === "VERIFIED") {
    // Lấy thông tin KhuVucHoatDong, SDTLienHe từ hồ sơ để cập nhật đồng bộ sang NGUOIDUNG nếu có
    const [fullRecord] = await promiseDb.query(
      "SELECT SDTLienHe, KhuVucHoatDong FROM XACMINHMOIGIOI WHERE MaXacMinh = ?",
      [maXacMinh]
    );
    const sdt = fullRecord[0]?.SDTLienHe;
    const kv = fullRecord[0]?.KhuVucHoatDong;

    await promiseDb.query(
      `UPDATE NGUOIDUNG 
       SET TrangThaiXacMinhMoiGioi = ?, 
           LoaiTaiKhoan = 'môi giới',
           SDT = COALESCE(?, SDT),
           KhuVucChuyenMon = COALESCE(?, KhuVucChuyenMon)
       WHERE MaNgDung = ?`,
      [status, sdt || null, kv || null, maNgDung]
    );
  } else {
    await promiseDb.query(
      "UPDATE NGUOIDUNG SET TrangThaiXacMinhMoiGioi = ? WHERE MaNgDung = ?",
      [status, maNgDung]
    );
  }

  return {
    maXacMinh,
    maNgDung,
    status,
    ghiChuAdmin,
  };
};

module.exports = {
  getVerificationStatus,
  submitVerification,
  getAdminVerificationList,
  getAdminVerificationDetail,
  updateVerificationStatus,
};
