const db = require("../config/db");

const getFavoritesByUser = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const sql = `
    SELECT 
      yt.MaYT,
      yt.NgayTao as NgayYeuThich,
      yt.GhiChu,
      tt.*,
      l.TenLoaiND as LoaiBDS,
      (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = tt.MaTTND LIMIT 1) AS HinhAnh
    FROM YEUTHICH yt
    INNER JOIN THONGTINNHADAT tt ON yt.MaTTND = tt.MaTTND
    LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
    WHERE yt.MaNgDung = ?
    ORDER BY yt.NgayTao DESC
    LIMIT ? OFFSET ?
  `;

  const [favorites] = await db.promise().query(sql, [userId, limit, offset]);

  for (const favorite of favorites) {
    const [images] = await db
      .promise()
      .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [favorite.MaTTND]);
    favorite.HinhAnh = images.map((img) => img.DuongDanAnh);
  }

  const [countRows] = await db.promise().query(`SELECT COUNT(*) AS total FROM YEUTHICH WHERE MaNgDung = ?`, [userId]);
  const total = countRows[0].total;

  return {
    favorites,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const addFavorite = async (userId, propertyId, note) => {
  const [propertyRows] = await db.promise().query("SELECT MaTTND FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId]);
  if (propertyRows.length === 0) {
    const err = new Error("Không tìm thấy bất động sản");
    err.status = 404;
    throw err;
  }

  const [existingRows] = await db
    .promise()
    .query("SELECT MaYT FROM YEUTHICH WHERE MaNgDung = ? AND MaTTND = ?", [userId, propertyId]);
  if (existingRows.length > 0) {
    const err = new Error("Bất động sản đã có trong danh sách yêu thích");
    err.status = 400;
    throw err;
  }

  const [result] = await db
    .promise()
    .query("INSERT INTO YEUTHICH (MaNgDung, MaTTND, GhiChu, NgayTao) VALUES (?, ?, ?, NOW())", [
      userId,
      propertyId,
      note || null,
    ]);

  return result.insertId;
};

const removeFavorite = async (userId, propertyId) => {
  const [result] = await db
    .promise()
    .query("DELETE FROM YEUTHICH WHERE MaNgDung = ? AND MaTTND = ?", [userId, propertyId]);
  return result.affectedRows > 0;
};

const checkFavorite = async (userId, propertyId) => {
  const [rows] = await db
    .promise()
    .query("SELECT MaYT FROM YEUTHICH WHERE MaNgDung = ? AND MaTTND = ?", [userId, propertyId]);
  return rows.length > 0;
};

const updateNote = async (userId, propertyId, note) => {
  const [result] = await db
    .promise()
    .query("UPDATE YEUTHICH SET GhiChu = ? WHERE MaNgDung = ? AND MaTTND = ?", [note || null, userId, propertyId]);
  return result.affectedRows > 0;
};

module.exports = {
  getFavoritesByUser,
  addFavorite,
  removeFavorite,
  checkFavorite,
  updateNote,
};
