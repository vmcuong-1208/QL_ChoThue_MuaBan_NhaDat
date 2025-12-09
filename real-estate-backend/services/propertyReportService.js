const db = require("../config/db");
const notificationService = require("./notificationService");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const VALID_REASONS = [
  "Thông tin sai sự thật",
  "Giá bán không chính xác",
  "Tin đăng trùng lặp",
  "Bất động sản không còn giao dịch",
  "Hình ảnh không đúng thực tế",
  "Có dấu hiệu lừa đảo",
  "Nội dung không phù hợp",
  "Khác",
];

/**
 * 1. Khách hàng gửi báo cáo vi phạm tin đăng
 */
const createReport = async (data, io = null) => {
  const {
    MaTTND,
    MaNgBaoCao = null,
    HoTen = null,
    SoDienThoai = null,
    Email = null,
    LyDo,
    MoTaChiTiet = "",
  } = data;

  if (!MaTTND) {
    throw new Error("Mã tin đăng (MaTTND) không được để trống!");
  }

  if (!LyDo || !LyDo.trim()) {
    throw new Error("Vui lòng chọn lý do báo cáo tin đăng vi phạm!");
  }

  // 1. Kiểm tra tin đăng có tồn tại trong hệ thống không
  const [property] = await queryAsync(
    `SELECT t.MaTTND, t.TieuDe, t.Gia, t.DiaChi, t.MaNgDung, t.TrangThaiDuyet,
            u.HoTen AS TenMoiGioi, u.Email AS EmailMoiGioi, u.SDT AS SDTMoiGioi
     FROM THONGTINNHADAT t
     LEFT JOIN NGUOIDUNG u ON t.MaNgDung = u.MaNgDung
     WHERE t.MaTTND = ?`,
    [MaTTND]
  );

  if (!property) {
    throw new Error(`Không tìm thấy tin đăng bất động sản #${MaTTND}!`);
  }

  // 2. Lưu thông tin báo cáo vào bảng BAOCAOSAIPHAM
  const insertResult = await queryAsync(
    `INSERT INTO BAOCAOSAIPHAM (MaTTND, MaNgBaoCao, HoTen, SoDienThoai, Email, LyDo, MoTaChiTiet, TrangThai)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'CHO_XU_LY')`,
    [
      MaTTND,
      MaNgBaoCao || null,
      HoTen ? HoTen.trim() : null,
      SoDienThoai ? SoDienThoai.trim() : null,
      Email ? Email.trim() : null,
      LyDo.trim(),
      MoTaChiTiet ? MoTaChiTiet.trim() : null,
    ]
  );

  const reportId = insertResult.insertId;

  // 3. Gửi thông báo đến Admin
  try {
    const adminRows = await queryAsync(
      `SELECT MaNgDung FROM NGUOIDUNG WHERE LOWER(LoaiTaiKhoan) = 'admin'`
    );

    const reporterName = HoTen ? HoTen.trim() : "Khách hàng";
    const notifContent = `Tin đăng #${MaTTND} ("${property.TieuDe}") vừa bị báo cáo sai phạm.\n\nNgười báo cáo: ${reporterName}\nLý do: ${LyDo}\nNội dung: ${
      MoTaChiTiet || "Không có mô tả thêm"
    }\nVui lòng kiểm tra và xử lý kịp thời.`;

    for (const admin of adminRows) {
      await notificationService.createNotification(
        {
          MaNgDung: admin.MaNgDung,
          TieuDe: `[BÁO CÁO VI PHẠM] Tin đăng #${MaTTND}: ${LyDo}`,
          NoiDung: notifContent,
          LoaiTB: "BAO_CAO",
          LienKet: `/admin-panel?tab=reports`,
          DuLieuThem: {
            MaBC: reportId,
            MaTTND,
            TieuDe: property.TieuDe,
            LyDo,
            Reporter: reporterName,
          },
        },
        io
      );
    }
  } catch (notifErr) {
    console.warn("[PropertyReportService] Không thể tạo thông báo cho Admin:", notifErr.message);
  }

  // Phát tín hiệu realtime qua Socket
  if (io) {
    try {
      io.emit("new_property_report", {
        MaBC: reportId,
        MaTTND,
        TieuDe: property.TieuDe,
        LyDo,
        NgayBaoCao: new Date(),
      });
    } catch (sockErr) {
      console.warn("[PropertyReportService] Socket error:", sockErr.message);
    }
  }

  return {
    MaBC: reportId,
    MaTTND,
    TieuDe: property.TieuDe,
    LyDo,
    TrangThai: "CHO_XU_LY",
    NgayBaoCao: new Date(),
  };
};

/**
 * 2. Lấy danh sách báo cáo sai phạm (Dành cho Admin)
 */
const getReports = async (options = {}) => {
  const { trangThai = "all", search = "", page = 1, limit = 20 } = options;

  let whereClauses = ["1=1"];
  const params = [];

  if (trangThai && trangThai !== "all") {
    whereClauses.push("b.TrangThai = ?");
    params.push(trangThai);
  }

  if (search && search.trim() !== "") {
    whereClauses.push(
      "(b.HoTen LIKE ? OR b.SoDienThoai LIKE ? OR b.LyDo LIKE ? OR t.TieuDe LIKE ? OR CAST(b.MaTTND AS CHAR) LIKE ?)"
    );
    const kw = `%${search.trim()}%`;
    params.push(kw, kw, kw, kw, kw);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  // Thống kê đếm theo các trạng thái
  const [statsRes] = await queryAsync(
    `SELECT 
       COUNT(*) AS total,
       SUM(CASE WHEN TrangThai = 'CHO_XU_LY' THEN 1 ELSE 0 END) AS choXuLy,
       SUM(CASE WHEN TrangThai = 'DANG_KIEM_TRA' THEN 1 ELSE 0 END) AS dangKiemTra,
       SUM(CASE WHEN TrangThai = 'DA_XU_LY' THEN 1 ELSE 0 END) AS daXuLy,
       SUM(CASE WHEN TrangThai = 'DA_GO_TIN' THEN 1 ELSE 0 END) AS daGoTin
     FROM BAOCAOSAIPHAM`
  );

  const stats = {
    total: statsRes?.total || 0,
    choXuLy: statsRes?.choXuLy || 0,
    dangKiemTra: statsRes?.dangKiemTra || 0,
    daXuLy: statsRes?.daXuLy || 0,
    daGoTin: statsRes?.daGoTin || 0,
  };

  // Đếm tổng số bản ghi phù hợp bộ lọc
  const [countRes] = await queryAsync(
    `SELECT COUNT(*) AS count
     FROM BAOCAOSAIPHAM b
     LEFT JOIN THONGTINNHADAT t ON b.MaTTND = t.MaTTND
     ${whereSql}`,
    params
  );
  const filteredTotal = countRes?.count || 0;

  // Lấy dữ liệu phân trang
  const offset = (Number(page) - 1) * Number(limit);
  const dataParams = [...params, Number(limit), Number(offset)];

  const items = await queryAsync(
    `SELECT b.MaBC, b.MaTTND, b.MaNgBaoCao, b.HoTen, b.SoDienThoai, b.Email,
            b.LyDo, b.MoTaChiTiet, b.TrangThai, b.GhiChuAdmin, b.MaAdminXuLy,
            b.NgayBaoCao, b.NgayXuLy,
            t.TieuDe AS TieuDeBDS, t.Gia, t.DiaChi, t.TrangThaiDuyet, t.MaNgDung AS MaMoiGioi,
            (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = t.MaTTND LIMIT 1) AS HinhAnhBDS,
            m.HoTen AS TenMoiGioi, m.SDT AS SDTMoiGioi, m.Email AS EmailMoiGioi,
            u.HoTen AS TenNguoiBaoCao, u.AnhDaiDien AS AvatarNguoiBaoCao
     FROM BAOCAOSAIPHAM b
     LEFT JOIN THONGTINNHADAT t ON b.MaTTND = t.MaTTND
     LEFT JOIN NGUOIDUNG m ON t.MaNgDung = m.MaNgDung
     LEFT JOIN NGUOIDUNG u ON b.MaNgBaoCao = u.MaNgDung
     ${whereSql}
     ORDER BY b.NgayBaoCao DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  return {
    stats,
    total: filteredTotal,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(filteredTotal / Number(limit)),
    items,
  };
};

/**
 * 3. Admin xử lý báo cáo vi phạm
 * Trạng thái: CHO_XU_LY, DANG_KIEM_TRA, DA_XU_LY (Bỏ qua / Không vi phạm), DA_GO_TIN (Gỡ tin vi phạm)
 * Hành động: 'GO_TIN', 'KHOA_MOI_GIOI', 'BO_QUA'
 */
const updateReportStatus = async (reportId, updateData, adminId, io = null) => {
  const [report] = await queryAsync(`SELECT * FROM BAOCAOSAIPHAM WHERE MaBC = ?`, [reportId]);
  if (!report) {
    throw new Error(`Không tìm thấy báo cáo vi phạm #${reportId}!`);
  }

  const { TrangThai, GhiChuAdmin = "", HanhDong = "" } = updateData;

  const validStatuses = ["CHO_XU_LY", "DANG_KIEM_TRA", "DA_XU_LY", "DA_GO_TIN"];
  if (TrangThai && !validStatuses.includes(TrangThai)) {
    throw new Error("Trạng thái xử lý không hợp lệ!");
  }

  // 1. Cập nhật bảng BAOCAOSAIPHAM
  await queryAsync(
    `UPDATE BAOCAOSAIPHAM
     SET TrangThai = COALESCE(?, TrangThai),
         GhiChuAdmin = COALESCE(?, GhiChuAdmin),
         MaAdminXuLy = ?,
         NgayXuLy = NOW()
     WHERE MaBC = ?`,
    [TrangThai, GhiChuAdmin.trim(), adminId, reportId]
  );

  // 2. Lấy thông tin tin đăng và môi giới phụ trách
  const [property] = await queryAsync(
    `SELECT t.MaTTND, t.TieuDe, t.MaNgDung, u.HoTen, u.Email
     FROM THONGTINNHADAT t
     LEFT JOIN NGUOIDUNG u ON t.MaNgDung = u.MaNgDung
     WHERE t.MaTTND = ?`,
    [report.MaTTND]
  );

  // 3. Nếu hành động là GỠ TIN hoặc trạng thái là DA_GO_TIN:
  if (HanhDong === "GO_TIN" || TrangThai === "DA_GO_TIN") {
    if (property) {
      await queryAsync(
        `UPDATE THONGTINNHADAT 
         SET TrangThaiDuyet = 'REMOVED',
             LyDoTuChoi = ?,
             NgayDuyet = NOW(),
             NguoiDuyet = ?
         WHERE MaTTND = ?`,
        [GhiChuAdmin.trim() || `Gỡ tin do vi phạm: ${report.LyDo}`, adminId, report.MaTTND]
      );

      // Thông báo cho môi giới sở hữu tin
      if (property.MaNgDung) {
        const notifContent = `Tin đăng #${property.MaTTND} ("${property.TieuDe}") của bạn đã bị gỡ khỏi hệ thống vì lý do: ${report.LyDo}.\n\nGhi chú từ Ban quản trị: "${
          GhiChuAdmin.trim() || "Vi phạm quy định đăng tin"
        }".\nVui lòng kiểm tra lại thông tin trước khi đăng bài mới.`;

        try {
          await notificationService.createNotification(
            {
              MaNgDung: property.MaNgDung,
              TieuDe: `[CẢNH BÁO] Tin đăng #${property.MaTTND} đã bị gỡ do vi phạm`,
              NoiDung: notifContent,
              LoaiTB: "CANH_BAO",
              LienKet: `/quan-ly-bai-dang`,
              DuLieuThem: {
                MaTTND: property.MaTTND,
                LyDo: report.LyDo,
                GhiChu: GhiChuAdmin.trim(),
              },
            },
            io
          );
        } catch (e) {
          console.warn("[PropertyReport] Lỗi gửi thông báo cho môi giới:", e.message);
        }
      }
    }
  }

  // 4. Nếu hành động là KHÓA TÀI KHOẢN MÔI GIỚI:
  if (HanhDong === "KHOA_MOI_GIOI" && property?.MaNgDung) {
    await queryAsync(
      `UPDATE NGUOIDUNG SET TrangThaiTaiKhoan = 'LOCKED' WHERE MaNgDung = ?`,
      [property.MaNgDung]
    );
  }

  const [updated] = await queryAsync(`SELECT * FROM BAOCAOSAIPHAM WHERE MaBC = ?`, [reportId]);
  return updated;
};

/**
 * 4. Lấy lịch sử báo cáo của người dùng
 */
const getMyReports = async (userId) => {
  const reports = await queryAsync(
    `SELECT r.MaBC, r.MaTTND, r.LyDo, r.MoTaChiTiet, r.TrangThai, r.NgayBaoCao, r.NgayXuLy, r.GhiChuAdmin,
            t.TieuDe AS TieuDeTinDang, t.Gia, t.DiaChi, t.TrangThaiDuyet,
            (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = t.MaTTND LIMIT 1) AS HinhAnh,
            u.HoTen AS TenMoiGioi
     FROM BAOCAOSAIPHAM r
     LEFT JOIN THONGTINNHADAT t ON r.MaTTND = t.MaTTND
     LEFT JOIN NGUOIDUNG u ON t.MaNgDung = u.MaNgDung
     WHERE r.MaNgBaoCao = ?
     ORDER BY r.NgayBaoCao DESC`,
    [userId]
  );
  return reports;
};

module.exports = {
  createReport,
  getReports,
  updateReportStatus,
  getMyReports,
  VALID_REASONS,
};
