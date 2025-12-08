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

// =========================================================================
// QUẢN LÝ TIN ĐĂNG (MODERATION, APPROVAL, REJECTION, REMOVAL & FEATURED)
// =========================================================================

const getModerationProperties = async ({ status = "all", search = "", page = 1, limit = 10 }) => {
  const parsedPage = Number.parseInt(page) || 1;
  const parsedLimit = Number.parseInt(limit) || 10;
  const offset = (parsedPage - 1) * parsedLimit;

  // 1. Thống kê KPI tóm tắt cho các tab
  const [counts] = await db.promise().query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN TrangThaiDuyet = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN TrangThaiDuyet = 'APPROVED' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN TrangThaiDuyet = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN TrangThaiDuyet = 'REMOVED' THEN 1 ELSE 0 END) as removed,
      SUM(CASE WHEN Featured = 1 THEN 1 ELSE 0 END) as featured
    FROM THONGTINNHADAT
  `);

  const summary = {
    total: Number(counts[0].total || 0),
    pending: Number(counts[0].pending || 0),
    approved: Number(counts[0].approved || 0),
    rejected: Number(counts[0].rejected || 0),
    removed: Number(counts[0].removed || 0),
    featured: Number(counts[0].featured || 0),
  };

  // 2. Xây dựng điều kiện lọc
  const conditions = [];
  const values = [];

  if (status === "featured") {
    conditions.push("tt.Featured = 1");
  } else if (status && status !== "all") {
    conditions.push("tt.TrangThaiDuyet = ?");
    values.push(status);
  }

  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    conditions.push("(tt.TieuDe LIKE ? OR tt.DiaChi LIKE ? OR nd.HoTen LIKE ? OR nd.Email LIKE ? OR nd.SDT LIKE ?)");
    values.push(term, term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  // 3. Đếm tổng kết quả theo bộ lọc
  const [countResult] = await db.promise().query(
    `SELECT COUNT(*) as total 
     FROM THONGTINNHADAT tt
     LEFT JOIN NGUOIDUNG nd ON tt.MaNgDung = nd.MaNgDung
     ${whereClause}`,
    values
  );
  const totalFiltered = countResult[0].total;

  // 4. Lấy danh sách tin
  const [properties] = await db.promise().query(
    `
    SELECT 
      tt.MaTTND,
      tt.MaNgDung,
      tt.TieuDe,
      tt.MoTa,
      tt.Gia,
      tt.DienTich,
      tt.DiaChi,
      tt.TrangThai,
      tt.TrangThaiDuyet,
      tt.Featured,
      tt.LyDoTuChoi,
      tt.NgayTao,
      tt.NgayDuyet,
      tt.TrangThaiXacThuc,
      tt.VideoThuaDat,
      tt.ToaDoVN2000,
      l.TenLoaiND,
      nd.HoTen as TenNguoiDang,
      nd.Email as EmailNguoiDang,
      nd.SDT as SDTNguoiDang,
      nd.LoaiTaiKhoan as LoaiTaiKhoanNguoiDang,
      nd.TrangThaiXacMinhMoiGioi,
      (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = tt.MaTTND LIMIT 1) as HinhAnhDaiDien
    FROM THONGTINNHADAT tt
    LEFT JOIN NGUOIDUNG nd ON tt.MaNgDung = nd.MaNgDung
    LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
    ${whereClause}
    ORDER BY 
      CASE 
        WHEN tt.TrangThaiDuyet = 'PENDING' THEN 1 
        WHEN tt.TrangThaiDuyet = 'APPROVED' THEN 2 
        WHEN tt.TrangThaiDuyet = 'REJECTED' THEN 3
        ELSE 4 
      END,
      tt.NgayTao DESC
    LIMIT ? OFFSET ?
    `,
    [...values, parsedLimit, offset]
  );

  // 5. Lấy danh sách ảnh cho mỗi tin
  for (const prop of properties) {
    const [imgs] = await db.promise().query(
      "SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ? LIMIT 10",
      [prop.MaTTND]
    );
    prop.HinhAnh = imgs.map((img) => img.DuongDanAnh);
    prop.Featured = Boolean(prop.Featured);
    prop.isFeatured = Boolean(prop.Featured);
  }

  return {
    properties,
    summary,
    pagination: {
      total: totalFiltered,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalFiltered / parsedLimit) || 1,
    },
  };
};

const getPropertyModerationDetail = async (propertyId) => {
  const [props] = await db.promise().query(
    `
    SELECT 
      tt.*,
      l.TenLoaiND,
      nd.HoTen as TenNguoiDang,
      nd.Email as EmailNguoiDang,
      nd.SDT as SDTNguoiDang,
      nd.LoaiTaiKhoan as LoaiTaiKhoanNguoiDang,
      nd.TrangThaiXacMinhMoiGioi,
      admin.HoTen as TenNguoiDuyet,
      xt.FileSoDo,
      xt.VideoXacThuc,
      xt.GhiChuNguoiBan,
      xt.GhiChuAdmin as GhiChuXacThucPhapLy
    FROM THONGTINNHADAT tt
    LEFT JOIN NGUOIDUNG nd ON tt.MaNgDung = nd.MaNgDung
    LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
    LEFT JOIN NGUOIDUNG admin ON tt.NguoiDuyet = admin.MaNgDung
    LEFT JOIN THONGTINXACTHUC xt ON tt.MaTTND = xt.MaTTND
    WHERE tt.MaTTND = ?
    `,
    [propertyId]
  );

  if (props.length === 0) {
    const err = new Error("Không tìm thấy tin đăng");
    err.status = 404;
    throw err;
  }

  const prop = props[0];
  const [imgs] = await db.promise().query(
    "SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?",
    [propertyId]
  );
  prop.HinhAnh = imgs.map((img) => img.DuongDanAnh);
  prop.Featured = Boolean(prop.Featured);
  prop.isFeatured = Boolean(prop.Featured);

  return prop;
};

const updatePropertyModerationStatus = async (propertyId, { status, lyDoTuChoi = null, adminId = null }) => {
  const validStatuses = ["DRAFT", "PENDING", "APPROVED", "REJECTED", "REMOVED", "EXPIRED"];
  const upperStatus = String(status).toUpperCase();
  if (!validStatuses.includes(upperStatus)) {
    const err = new Error(`Trạng thái không hợp lệ: ${status}`);
    err.status = 400;
    throw err;
  }

  const [existing] = await db.promise().query("SELECT MaTTND, TrangThaiDuyet FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy tin đăng");
    err.status = 404;
    throw err;
  }

  const reason = (upperStatus === "REJECTED" || upperStatus === "REMOVED") ? lyDoTuChoi : null;

  await db.promise().query(
    `UPDATE THONGTINNHADAT SET 
      TrangThaiDuyet = ?, 
      LyDoTuChoi = ?, 
      NgayDuyet = CURRENT_TIMESTAMP, 
      NguoiDuyet = ? 
    WHERE MaTTND = ?`,
    [upperStatus, reason, adminId, propertyId]
  );

  return {
    MaTTND: propertyId,
    TrangThaiDuyet: upperStatus,
    LyDoTuChoi: reason,
  };
};

const togglePropertyFeatured = async (propertyId, featured = null) => {
  const [existing] = await db.promise().query("SELECT MaTTND, Featured FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy tin đăng");
    err.status = 404;
    throw err;
  }

  const newFeatured = featured !== null ? (featured ? 1 : 0) : (existing[0].Featured ? 0 : 1);

  await db.promise().query("UPDATE THONGTINNHADAT SET Featured = ? WHERE MaTTND = ?", [newFeatured, propertyId]);

  return {
    MaTTND: propertyId,
    Featured: Boolean(newFeatured),
    isFeatured: Boolean(newFeatured),
  };
};

module.exports = {
  getStats,
  getUsers,
  updateUser,
  getModerationProperties,
  getPropertyModerationDetail,
  updatePropertyModerationStatus,
  togglePropertyFeatured,
};
