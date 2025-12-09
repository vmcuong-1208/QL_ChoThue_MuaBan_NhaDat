const db = require("../config/db");

const getUserById = async (id, isAuthorized) => {
  let query = `
    SELECT MaNgDung, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, AnhDaiDien, TrangThaiXacMinhMoiGioi, MoTaBanThan, NgayTao 
    FROM NGUOIDUNG
    WHERE MaNgDung = ?
  `;

  if (isAuthorized) {
    query = `
      SELECT MaNgDung, TenDangNhap, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, 
       TrangThai, TrangThaiXacMinhMoiGioi,
       AnhDaiDien, MoTaBanThan, NgayTao
      FROM NGUOIDUNG
      WHERE MaNgDung = ?
    `;
  }

  const [users] = await db.promise().query(query, [id]);
  return users.length > 0 ? users[0] : null;
};

const getVerifiedBrokers = async (limit = 8) => {
  const query = `
    SELECT 
      u.MaNgDung,
      COALESCE(NULLIF(u.HoTen, ''), SUBSTRING_INDEX(u.Email, '@', 1)) AS HoTen,
      u.Email,
      u.SDT,
      u.DiaChi,
      u.LoaiTaiKhoan,
      u.AnhDaiDien,
      u.KhuVucChuyenMon,
      u.MoTaBanThan,
      (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaNgDung = u.MaNgDung AND (TrangThaiDuyet = 'APPROVED' OR TrangThaiDuyet IS NULL)) AS SoTinDang,
      COALESCE((SELECT ROUND(AVG(SoSao), 1) FROM DANHGIAMOIGIOI WHERE MaMoiGioi = u.MaNgDung), 5.0) AS DiemDanhGia,
      COALESCE((SELECT COUNT(*) FROM DANHGIAMOIGIOI WHERE MaMoiGioi = u.MaNgDung), 0) AS SoDanhGia,
      CASE WHEN xm.TrangThai = 'VERIFIED' OR u.TrangThaiXacMinhMoiGioi = 'VERIFIED' THEN 1 ELSE 0 END AS DaXacMinh
    FROM NGUOIDUNG u
    LEFT JOIN XACMINHMOIGIOI xm ON u.MaNgDung = xm.MaNgDung
    WHERE (LOWER(u.LoaiTaiKhoan) LIKE '%môi%' OR LOWER(u.LoaiTaiKhoan) LIKE '%broker%' OR xm.TrangThai = 'VERIFIED')
    GROUP BY u.MaNgDung
    ORDER BY DaXacMinh DESC, SoTinDang DESC
    LIMIT ?
  `;
  const [rows] = await db.promise().query(query, [Number(limit) || 8]);
  return rows;
};

module.exports = {
  getUserById,
  getVerifiedBrokers,
};
