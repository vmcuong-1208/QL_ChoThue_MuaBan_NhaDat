const db = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * Lấy toàn bộ số liệu thống kê hoạt động kinh doanh cho môi giới
 */
const getBrokerAnalytics = async (brokerId) => {
  // 1. Thống kê tổng quan: Tổng lượt xem, Tổng lượt liên hệ, Tin đang hoạt động, Tổng tin
  const [summaryRes] = await queryAsync(
    `SELECT 
       COALESCE(SUM(SoLuotXem), 0) AS tongLuotXem,
       (SELECT COUNT(*) FROM YEUCAULIENHE WHERE MaMoiGioi = ?) AS tongLuotLienHe,
       COUNT(CASE WHEN TrangThaiDuyet = 'APPROVED' AND (TrangThai = 'đang bán' OR TrangThai = 'cho thuê') THEN 1 END) AS tinDangHoatDong,
       COUNT(*) AS tongSoTin
     FROM THONGTINNHADAT
     WHERE MaNgDung = ?`,
    [brokerId, brokerId]
  );

  const tongLuotXem = Number(summaryRes?.tongLuotXem || 0);
  const tongLuotLienHe = Number(summaryRes?.tongLuotLienHe || 0);
  const tinDangHoatDong = Number(summaryRes?.tinDangHoatDong || 0);
  const tongSoTin = Number(summaryRes?.tongSoTin || 0);

  const tiLeChuyenDoi =
    tongLuotXem > 0 ? ((tongLuotLienHe / tongLuotXem) * 100).toFixed(2) : "0.00";

  // 2. Thống kê tin đang hoạt động theo từng loại hình bất động sản
  const categories = await queryAsync(
    `SELECT COALESCE(l.TenLoaiND, 'Loại khác') AS TenLoai, COUNT(t.MaTTND) AS soTin
     FROM THONGTINNHADAT t
     LEFT JOIN LOAINHADAT l ON t.MaLoaiND = l.MaLoaiND
     WHERE t.MaNgDung = ? AND t.TrangThaiDuyet = 'APPROVED' AND (t.TrangThai = 'đang bán' OR t.TrangThai = 'cho thuê')
     GROUP BY l.MaLoaiND, l.TenLoaiND
     ORDER BY soTin DESC`,
    [brokerId]
  );

  // 3. Top bất động sản theo lượt xem
  const topViews = await queryAsync(
    `SELECT t.MaTTND, t.TieuDe, t.Gia, t.SoLuotXem, t.DiaChi, t.TrangThai, t.TrangThaiDuyet,
            COALESCE(l.TenLoaiND, 'BĐS') AS TenLoai,
            (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = t.MaTTND LIMIT 1) AS HinhAnh,
            (SELECT COUNT(*) FROM YEUCAULIENHE WHERE MaTTND = t.MaTTND) AS SoLuotLienHe
     FROM THONGTINNHADAT t
     LEFT JOIN LOAINHADAT l ON t.MaLoaiND = l.MaLoaiND
     WHERE t.MaNgDung = ?
     ORDER BY t.SoLuotXem DESC, t.MaTTND DESC
     LIMIT 5`,
    [brokerId]
  );

  // 4. Top bất động sản theo lượt liên hệ
  const topLeads = await queryAsync(
    `SELECT t.MaTTND, t.TieuDe, t.Gia, t.SoLuotXem, t.DiaChi, t.TrangThai, t.TrangThaiDuyet,
            COALESCE(l.TenLoaiND, 'BĐS') AS TenLoai,
            (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = t.MaTTND LIMIT 1) AS HinhAnh,
            COUNT(y.MaYCLH) AS SoLuotLienHe
     FROM THONGTINNHADAT t
     LEFT JOIN LOAINHADAT l ON t.MaLoaiND = l.MaLoaiND
     LEFT JOIN YEUCAULIENHE y ON t.MaTTND = y.MaTTND
     WHERE t.MaNgDung = ?
     GROUP BY t.MaTTND, t.TieuDe, t.Gia, t.SoLuotXem, t.DiaChi, t.TrangThai, t.TrangThaiDuyet, l.TenLoaiND
     ORDER BY SoLuotLienHe DESC, t.SoLuotXem DESC, t.MaTTND DESC
     LIMIT 5`,
    [brokerId]
  );

  // 5. Toàn bộ hiệu suất từng tin đăng của môi giới
  const propertiesPerformance = await queryAsync(
    `SELECT t.MaTTND, t.TieuDe, t.Gia, t.DiaChi, t.DienTich, t.SoLuotXem, t.TrangThai, t.TrangThaiDuyet, t.NgayTao,
            COALESCE(l.TenLoaiND, 'BĐS') AS TenLoai,
            (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = t.MaTTND LIMIT 1) AS HinhAnh,
            (SELECT COUNT(*) FROM YEUCAULIENHE WHERE MaTTND = t.MaTTND) AS SoLuotLienHe
     FROM THONGTINNHADAT t
     LEFT JOIN LOAINHADAT l ON t.MaLoaiND = l.MaLoaiND
     WHERE t.MaNgDung = ?
     ORDER BY t.NgayTao DESC`,
    [brokerId]
  );

  return {
    summary: {
      tongLuotXem,
      tongLuotLienHe,
      tinDangHoatDong,
      tongSoTin,
      tiLeChuyenDoi,
    },
    categories,
    topViews,
    topLeads,
    propertiesPerformance,
  };
};

module.exports = {
  getBrokerAnalytics,
};
