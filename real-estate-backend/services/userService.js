const db = require("../config/db");

const getUserById = async (id, isAuthorized) => {
  let query = `
    SELECT MaNgDung, HoTen, Email, LoaiTaiKhoan, AnhDaiDien 
    FROM NGUOIDUNG
    WHERE MaNgDung = ?
  `;

  if (isAuthorized) {
    query = `
      SELECT MaNgDung, TenDangNhap, HoTen, Email, SDT, DiaChi, LoaiTaiKhoan, 
       CASE WHEN TrangThai = 1 THEN 'Hoạt động' ELSE 'Không hoạt động' END as TrangThai,
       AnhDaiDien, MoTaBanThan
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
