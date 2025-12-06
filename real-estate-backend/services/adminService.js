const db = require("../config/db");

const getStats = async () => {
  const [totalUsers] = await db.promise().query("SELECT COUNT(*) as total FROM NGUOIDUNG");

  const [newUsersThisMonth] = await db.promise().query(`
    SELECT COUNT(*) as total FROM NGUOIDUNG 
    WHERE MONTH(NgayTao) = MONTH(CURRENT_DATE()) 
    AND YEAR(NgayTao) = YEAR(CURRENT_DATE())
  `);

  const [totalPosts] = await db.promise().query("SELECT COUNT(*) as total FROM THONGTINNHADAT");

  const [newPostsThisMonth] = await db.promise().query(`
    SELECT COUNT(*) as total FROM THONGTINNHADAT 
    WHERE MONTH(NgayTao) = MONTH(CURRENT_DATE()) 
    AND YEAR(NgayTao) = YEAR(CURRENT_DATE())
  `);

  const [usersByRole] = await db.promise().query(`
    SELECT LoaiTaiKhoan, COUNT(*) as count 
    FROM NGUOIDUNG 
    GROUP BY LoaiTaiKhoan
  `);

  const [usersByStatus] = await db.promise().query(`
    SELECT TrangThai as status_name, COUNT(*) as count 
    FROM NGUOIDUNG 
    GROUP BY TrangThai
  `);

  const [totalPropertyTypes] = await db.promise().query("SELECT COUNT(*) as total FROM LOAINHADAT");

  const [postsByStatus] = await db.promise().query(`
    SELECT TrangThai, COUNT(*) as count 
    FROM THONGTINNHADAT 
    GROUP BY TrangThai
  `);

  const [recentActivities] = await db.promise().query(`
    SELECT 
      'post' as type,
      nd.HoTen as userName,
      tt.TieuDe as content,
      tt.NgayTao as createdAt
    FROM THONGTINNHADAT tt
    JOIN NGUOIDUNG nd ON tt.MaNgDung = nd.MaNgDung
    ORDER BY tt.NgayTao DESC
    LIMIT 10
  `);

  return {
    stats: {
      totalUsers: totalUsers[0].total,
      newUsersThisMonth: newUsersThisMonth[0].total,
      totalPosts: totalPosts[0].total,
      newPostsThisMonth: newPostsThisMonth[0].total,
      totalPropertyTypes: totalPropertyTypes[0].total,
      usersByRole,
      usersByStatus,
      postsByStatus,
    },
    recentActivities,
  };
};

const getUsers = async (search = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let whereClause = "";
  let queryParams = [];

  if (search) {
    whereClause = `
      WHERE HoTen LIKE ? 
      OR Email LIKE ? 
      OR SDT LIKE ?
    `;
    const searchTerm = `%${search}%`;
    queryParams = [searchTerm, searchTerm, searchTerm];
  }

  const [totalResult] = await db
    .promise()
    .query(`SELECT COUNT(*) as total FROM NGUOIDUNG ${whereClause}`, queryParams);

  const [users] = await db.promise().query(
    `
    SELECT 
      MaNgDung,
      TenDangNhap,
      HoTen,
      Email,
      SDT,
      DiaChi,
      LoaiTaiKhoan,
      TrangThai,
      AnhDaiDien,
      NgayTao,
      (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaNgDung = NGUOIDUNG.MaNgDung) as SoBaiDang
    FROM NGUOIDUNG 
    ${whereClause}
    ORDER BY NgayTao DESC
    LIMIT ? OFFSET ?
  `,
    [...queryParams, Number.parseInt(limit), Number.parseInt(offset)]
  );

  users.forEach((user) => {
    if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
      user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
    }
  });

  return {
    users,
    pagination: {
      total: totalResult[0].total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(totalResult[0].total / limit),
    },
  };
};

const updateUser = async (id, { LoaiTaiKhoan, TrangThai }) => {
  const [existingUser] = await db.promise().query("SELECT MaNgDung FROM NGUOIDUNG WHERE MaNgDung = ?", [id]);
  if (existingUser.length === 0) {
    const err = new Error("Không tìm thấy người dùng");
    err.status = 404;
    throw err;
  }

  await db
    .promise()
    .query("UPDATE NGUOIDUNG SET LoaiTaiKhoan = ?, TrangThai = ? WHERE MaNgDung = ?", [LoaiTaiKhoan, TrangThai, id]);

  return { LoaiTaiKhoan, TrangThai };
};

module.exports = {
  getStats,
  getUsers,
  updateUser,
};
