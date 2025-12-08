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

module.exports = {
  getUserById,
};
