const db = require("../config/db");
const notificationService = require("./notificationService");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 1. Khách hàng gửi yêu cầu liên hệ tư vấn
 */
const createContactRequest = async (data, io = null) => {
  const { MaTTND, HoTen, SoDienThoai, Email, NoiDung, MaNgGui } = data;

  if (!MaTTND) {
    throw new Error("Mã tin đăng (MaTTND) không được để trống!");
  }
  if (!HoTen || !HoTen.trim()) {
    throw new Error("Họ và tên khách hàng không được để trống!");
  }
  if (!SoDienThoai || !SoDienThoai.trim()) {
    throw new Error("Số điện thoại liên hệ không được để trống!");
  }
  if (!NoiDung || !NoiDung.trim()) {
    throw new Error("Nội dung yêu cầu tư vấn không được để trống!");
  }

  // 1. Kiểm tra tin đăng và xác định môi giới phụ trách
  const propertyRows = await queryAsync(
    `SELECT t.MaTTND, t.TieuDe, t.Gia, t.DiaChi, t.MaNgDung,
            COALESCE(u.HoTen, u.TenDangNhap) AS TenMoiGioi, u.Email AS EmailMoiGioi, u.SDT AS SDTMoiGioi
     FROM THONGTINNHADAT t
     LEFT JOIN NGUOIDUNG u ON t.MaNgDung = u.MaNgDung
     WHERE t.MaTTND = ?`,
    [MaTTND]
  );

  if (propertyRows.length === 0) {
    throw new Error("Không tìm thấy thông tin bất động sản này!");
  }

  const property = propertyRows[0];
  const MaMoiGioi = property.MaNgDung;

  // Lịch sử tư vấn ban đầu
  const initialHistory = [
    {
      thoiGian: new Date(),
      trangThai: "MOI_NHAN",
      ghiChu: "Khách hàng gửi yêu cầu liên hệ từ trang chi tiết tin đăng",
    },
  ];

  // 2. Lưu yêu cầu vào bảng YEUCAULIENHE với trạng thái MOI_NHAN
  const insertResult = await queryAsync(
    `INSERT INTO YEUCAULIENHE (MaTTND, MaNgGui, MaMoiGioi, HoTen, SoDienThoai, Email, NoiDung, TrangThai, LichSuTuVan)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'MOI_NHAN', ?)`,
    [
      MaTTND,
      MaNgGui || null,
      MaMoiGioi,
      HoTen.trim(),
      SoDienThoai.trim(),
      Email ? Email.trim() : null,
      NoiDung.trim(),
      JSON.stringify(initialHistory),
    ]
  );

  const newRequestId = insertResult.insertId;

  // Format thời gian hiển thị: 10:30 - 15/05/2025
  const now = new Date();
  const timeFormatted = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")} - ${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${now.getFullYear()}`;

  // Nội dung thông báo theo đúng quy chuẩn người dùng yêu cầu
  const notificationContent = `Có khách hàng mới quan tâm đến tin đăng của bạn.\n\nKhách hàng: ${HoTen.trim()}\nSố điện thoại: ${SoDienThoai.trim()}\nTin đăng: ${
    property.TieuDe
  }\nThời gian: ${timeFormatted}\nNội dung: ${NoiDung.trim()}`;

  // 3. Tạo thông báo mới cho môi giới trong bảng THONGBAO và phát realtime Socket.IO
  try {
    await notificationService.createNotification(
      {
        MaNgDung: MaMoiGioi,
        TieuDe: "Có khách hàng mới quan tâm đến tin đăng của bạn",
        NoiDung: notificationContent,
        LoaiTB: "LIEN_HE",
        LienKet: `/yeu-cau-lien-he?id=${newRequestId}`,
        DuLieuThem: {
          MaYCLH: newRequestId,
          MaTTND: MaTTND,
          HoTen: HoTen.trim(),
          SoDienThoai: SoDienThoai.trim(),
          TieuDe: property.TieuDe,
          ThoiGian: timeFormatted,
          NgayGui: now,
        },
      },
      io
    );
  } catch (notifErr) {
    console.warn("[ContactRequest] Không thể tạo thông báo THONGBAO:", notifErr.message);
  }

  // 4. Đồng thời tạo tin nhắn trong bảng `TINNHAN`
  try {
    const senderId = MaNgGui || 1;
    await queryAsync(
      `INSERT INTO TINNHAN (MaNgMua, MaNgBan, MaTTND, NoiDung, TrangThaiDoc)
       VALUES (?, ?, ?, ?, 0)`,
      [senderId, MaMoiGioi, MaTTND, notificationContent]
    );
  } catch (msgErr) {
    console.warn("[ContactRequest] Không thể tạo tin nhắn tự động:", msgErr.message);
  }

  // 5. Phát tín hiệu realtime qua Socket.IO tới môi giới
  if (io) {
    try {
      io.emit("new_contact_request", {
        MaYCLH: newRequestId,
        MaMoiGioi: MaMoiGioi,
        HoTen: HoTen.trim(),
        SoDienThoai: SoDienThoai.trim(),
        Email: Email ? Email.trim() : null,
        NoiDung: NoiDung.trim(),
        TieuDe: property.TieuDe,
        MaTTND: MaTTND,
        ThoiGian: timeFormatted,
        NgayGui: now,
      });
    } catch (sockErr) {
      console.warn("[ContactRequest] Socket emit error:", sockErr.message);
    }
  }

  return {
    MaYCLH: newRequestId,
    MaTTND,
    TieuDe: property.TieuDe,
    MaMoiGioi,
    HoTen: HoTen.trim(),
    SoDienThoai: SoDienThoai.trim(),
    Email: Email ? Email.trim() : null,
    NoiDung: NoiDung.trim(),
    TrangThai: "MOI_NHAN",
    ThoiGian: timeFormatted,
    NgayGui: now,
  };
};

/**
 * 2. Môi giới xem danh sách khách hàng đã liên hệ (Quản lý khách hàng quan tâm / Leads)
 */
const getRequestsForBroker = async (brokerId, options = {}) => {
  const { trangThai = "all", maTTND = "", search = "", page = 1, limit = 20 } = options;

  let whereClauses = [`y.MaMoiGioi = ?`];
  const params = [brokerId];

  if (trangThai && trangThai !== "all") {
    // 6 trạng thái nghiệp vụ chuẩn của Môi giới
    if (trangThai === "MOI_NHAN") {
      whereClauses.push(`(y.TrangThai = 'MOI_NHAN' OR y.TrangThai = 'CHUA_XU_LY')`);
    } else if (trangThai === "DANG_LIEN_HE") {
      whereClauses.push(`y.TrangThai = 'DANG_LIEN_HE'`);
    } else if (trangThai === "DANG_TU_VAN") {
      whereClauses.push(`(y.TrangThai = 'DANG_TU_VAN' OR y.TrangThai = 'DA_TU_VAN' OR y.TrangThai = 'DA_LIEN_HE')`);
    } else if (trangThai === "DA_XEM_NHA") {
      whereClauses.push(`y.TrangThai = 'DA_XEM_NHA'`);
    } else if (trangThai === "DA_GIAO_DICH") {
      whereClauses.push(`(y.TrangThai = 'DA_GIAO_DICH' OR y.TrangThai = 'HOAN_THANH')`);
    } else if (trangThai === "KHONG_NHU_CAU") {
      whereClauses.push(`(y.TrangThai = 'KHONG_NHU_CAU' OR y.TrangThai = 'DA_HUY')`);
    } else {
      whereClauses.push(`y.TrangThai = ?`);
      params.push(trangThai);
    }
  }

  // Lọc theo tin đăng bất động sản
  if (maTTND && maTTND !== "all" && maTTND !== "") {
    whereClauses.push(`y.MaTTND = ?`);
    params.push(Number(maTTND));
  }

  // Tìm kiếm theo tên, số điện thoại, email, tiêu đề BĐS hoặc mã tin
  if (search && search.trim() !== "") {
    whereClauses.push(
      `(y.HoTen LIKE ? OR y.SoDienThoai LIKE ? OR y.Email LIKE ? OR t.TieuDe LIKE ? OR CAST(y.MaTTND AS CHAR) LIKE ?)`
    );
    const kw = `%${search.trim()}%`;
    params.push(kw, kw, kw, kw, kw);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  // Đếm tổng số bản ghi
  const [countRes] = await queryAsync(
    `SELECT COUNT(*) AS total
     FROM YEUCAULIENHE y
     LEFT JOIN THONGTINNHADAT t ON y.MaTTND = t.MaTTND
     ${whereSql}`,
    params
  );
  const total = countRes?.total || 0;

  // Lấy dữ liệu phân trang
  const offset = (Number(page) - 1) * Number(limit);
  const dataParams = [...params, Number(limit), Number(offset)];

  const items = await queryAsync(
    `SELECT y.MaYCLH, y.MaTTND, y.MaNgGui, y.MaMoiGioi, y.HoTen, y.SoDienThoai, y.Email,
            y.NoiDung, y.TrangThai, y.GhiChuMoiGioi, y.LichSuTuVan, y.NgayGui, y.NgayXuLy,
            t.TieuDe, t.Gia, t.DiaChi,
            (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = t.MaTTND LIMIT 1) AS HinhAnhBDS,
            u.AnhDaiDien AS AvatarKhachHang
     FROM YEUCAULIENHE y
     LEFT JOIN THONGTINNHADAT t ON y.MaTTND = t.MaTTND
     LEFT JOIN NGUOIDUNG u ON y.MaNgGui = u.MaNgDung
     ${whereSql}
     ORDER BY y.NgayGui DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  // Parse LichSuTuVan JSON
  const parsedItems = items.map((item) => {
    let history = [];
    if (item.LichSuTuVan) {
      try {
        history = typeof item.LichSuTuVan === "string" ? JSON.parse(item.LichSuTuVan) : item.LichSuTuVan;
      } catch (e) {}
    }
    return {
      ...item,
      LichSuTuVan: history,
    };
  });

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    items: parsedItems,
  };
};

/**
 * 3. Khách hàng (User thường) xem lịch sử yêu cầu tư vấn đã gửi
 */
const getRequestsForCustomer = async (customerId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (Number(page) - 1) * Number(limit);

  const [countRes] = await queryAsync(
    `SELECT COUNT(*) AS total FROM YEUCAULIENHE WHERE MaNgGui = ?`,
    [customerId]
  );
  const total = countRes?.total || 0;

  const items = await queryAsync(
    `SELECT y.MaYCLH, y.MaTTND, y.HoTen, y.SoDienThoai, y.Email, y.NoiDung, y.TrangThai, y.GhiChuMoiGioi, y.LichSuTuVan, y.NgayGui, y.NgayXuLy,
            t.TieuDe, t.Gia, t.DiaChi,
            (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = t.MaTTND LIMIT 1) AS HinhAnhBDS,
            COALESCE(m.HoTen, m.TenDangNhap, m.Email) AS TenMoiGioi, m.SDT AS SDTMoiGioi, m.Email AS EmailMoiGioi, m.AnhDaiDien AS AvatarMoiGioi,
            m.TrangThaiXacMinhMoiGioi
     FROM YEUCAULIENHE y
     LEFT JOIN THONGTINNHADAT t ON y.MaTTND = t.MaTTND
     LEFT JOIN NGUOIDUNG m ON y.MaMoiGioi = m.MaNgDung
     WHERE y.MaNgGui = ?
     ORDER BY y.NgayGui DESC
     LIMIT ? OFFSET ?`,
    [customerId, Number(limit), Number(offset)]
  );

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    items,
  };
};

/**
 * 4. Môi giới cập nhật trạng thái yêu cầu & lịch sử tư vấn
 * Trạng thái chuẩn: MOI_NHAN, DANG_LIEN_HE, DA_TU_VAN, HOAN_THANH, DA_HUY
 */
const updateRequestStatus = async (requestId, userId, updateData, userRole = "") => {
  const rows = await queryAsync(`SELECT * FROM YEUCAULIENHE WHERE MaYCLH = ?`, [requestId]);
  if (rows.length === 0) {
    throw new Error(`Không tìm thấy yêu cầu liên hệ với mã ID: ${requestId}`);
  }

  const request = rows[0];
  const isAdmin = userRole.toLowerCase() === "admin";
  const isOwnerBroker = String(request.MaMoiGioi) === String(userId);

  if (!isAdmin && !isOwnerBroker) {
    throw new Error("Bạn không có quyền cập nhật yêu cầu liên hệ này!");
  }

  let { TrangThai, GhiChuMoiGioi } = updateData;

  // Chuẩn hóa trạng thái nếu truyền kiểu cũ
  if (TrangThai === "CHUA_XU_LY") TrangThai = "MOI_NHAN";
  if (TrangThai === "DA_LIEN_HE") TrangThai = "DANG_LIEN_HE";
  if (TrangThai === "DA_TU_VAN") TrangThai = "DANG_TU_VAN";
  if (TrangThai === "HOAN_THANH") TrangThai = "DA_GIAO_DICH";
  if (TrangThai === "DA_HUY") TrangThai = "KHONG_NHU_CAU";

  const validStatuses = [
    "MOI_NHAN",
    "DANG_LIEN_HE",
    "DANG_TU_VAN",
    "DA_XEM_NHA",
    "DA_GIAO_DICH",
    "KHONG_NHU_CAU",
    "HOAN_THANH",
    "DA_HUY",
  ];
  if (TrangThai && !validStatuses.includes(TrangThai)) {
    throw new Error(
      "Trạng thái cập nhật không hợp lệ! (Cho phép: MOI_NHAN, DANG_LIEN_HE, DANG_TU_VAN, DA_XEM_NHA, DA_GIAO_DICH, KHONG_NHU_CAU)"
    );
  }

  // Cập nhật mảng lịch sử tư vấn
  let history = [];
  if (request.LichSuTuVan) {
    try {
      history =
        typeof request.LichSuTuVan === "string"
          ? JSON.parse(request.LichSuTuVan)
          : request.LichSuTuVan;
    } catch (e) {}
  }
  history.push({
    thoiGian: new Date(),
    trangThai: TrangThai || request.TrangThai,
    ghiChu: GhiChuMoiGioi || "Cập nhật trạng thái xử lý",
  });

  await queryAsync(
    `UPDATE YEUCAULIENHE
     SET TrangThai = COALESCE(?, TrangThai),
         GhiChuMoiGioi = COALESCE(?, GhiChuMoiGioi),
         LichSuTuVan = ?,
         NgayXuLy = NOW()
     WHERE MaYCLH = ?`,
    [TrangThai, GhiChuMoiGioi, JSON.stringify(history), requestId]
  );

  const [updated] = await queryAsync(`SELECT * FROM YEUCAULIENHE WHERE MaYCLH = ?`, [requestId]);
  return {
    ...updated,
    LichSuTuVan: history,
  };
};

/**
 * 5. Thống kê KPI yêu cầu liên hệ / khách hàng quan tâm cho Môi giới
 */
const getBrokerStats = async (brokerId) => {
  const [stats] = await queryAsync(
    `SELECT 
       COUNT(*) AS total,
       SUM(CASE WHEN TrangThai = 'MOI_NHAN' OR TrangThai = 'CHUA_XU_LY' THEN 1 ELSE 0 END) AS moiNhan,
       SUM(CASE WHEN TrangThai = 'DANG_LIEN_HE' THEN 1 ELSE 0 END) AS dangLienHe,
       SUM(CASE WHEN TrangThai = 'DANG_TU_VAN' OR TrangThai = 'DA_TU_VAN' OR TrangThai = 'DA_LIEN_HE' THEN 1 ELSE 0 END) AS dangTuVan,
       SUM(CASE WHEN TrangThai = 'DA_XEM_NHA' THEN 1 ELSE 0 END) AS daXemNha,
       SUM(CASE WHEN TrangThai = 'DA_GIAO_DICH' OR TrangThai = 'HOAN_THANH' THEN 1 ELSE 0 END) AS daGiaoDich,
       SUM(CASE WHEN TrangThai = 'KHONG_NHU_CAU' OR TrangThai = 'DA_HUY' THEN 1 ELSE 0 END) AS khongNhuCau
     FROM YEUCAULIENHE
     WHERE MaMoiGioi = ?`,
    [brokerId]
  );

  return {
    total: stats?.total || 0,
    moiNhan: stats?.moiNhan || 0,
    dangLienHe: stats?.dangLienHe || 0,
    dangTuVan: stats?.dangTuVan || 0,
    daXemNha: stats?.daXemNha || 0,
    daGiaoDich: stats?.daGiaoDich || 0,
    khongNhuCau: stats?.khongNhuCau || 0,
    // Tương thích các key cũ
    daTuVan: stats?.dangTuVan || 0,
    hoanThanh: stats?.daGiaoDich || 0,
    daHuy: stats?.khongNhuCau || 0,
    pending: stats?.moiNhan || 0,
    contacted: stats?.dangTuVan || 0,
  };
};

/**
 * 6. Lấy danh sách các tin đăng của môi giới có khách hàng quan tâm
 */
const getBrokerPropertiesWithLeads = async (brokerId) => {
  const properties = await queryAsync(
    `SELECT t.MaTTND, t.TieuDe, t.Gia, t.DiaChi,
            COUNT(y.MaYCLH) AS totalLeads
     FROM THONGTINNHADAT t
     INNER JOIN YEUCAULIENHE y ON t.MaTTND = y.MaTTND
     WHERE y.MaMoiGioi = ?
     GROUP BY t.MaTTND, t.TieuDe, t.Gia, t.DiaChi
     ORDER BY totalLeads DESC, t.MaTTND DESC`,
    [brokerId]
  );

  return properties;
};

module.exports = {
  createContactRequest,
  getRequestsForBroker,
  getRequestsForCustomer,
  updateRequestStatus,
  getBrokerStats,
  getBrokerPropertiesWithLeads,
};
