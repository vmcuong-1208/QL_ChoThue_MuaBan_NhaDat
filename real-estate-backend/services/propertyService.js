const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// Helper to remove a file relative to backend root
const safelyDeleteFile = (filePath) => {
  if (!filePath) return;
  try {
    const relativePath = filePath.replace(/^[/\\]+/, "");
    const fullPath = path.join(__dirname, "..", relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error(`Lỗi khi xóa file (${filePath}):`, err.message);
  }
};

/**
 * Lấy tất cả bài đăng (có lọc và phân trang)
 */
const getAllProperties = async (filters) => {
  const {
    page = 1,
    limit = 10,
    loaiBDS,
    trangThai,
    giaTu,
    giaDen,
    dienTichTu,
    dienTichDen,
    maTinh,
    maHuyen,
  } = filters;

  const parsedPage = Number.parseInt(page) || 1;
  const parsedLimit = Number.parseInt(limit) || 10;
  const offset = (parsedPage - 1) * parsedLimit;

  const values = [];
  const filterConditions = [];

  if (loaiBDS) {
    filterConditions.push("MaLoaiND = ?");
    values.push(loaiBDS);
  }
  if (trangThai) {
    filterConditions.push("TrangThai = ?");
    values.push(trangThai);
  }
  if (giaTu) {
    filterConditions.push("Gia >= ?");
    values.push(Number(giaTu));
  }
  if (giaDen) {
    filterConditions.push("Gia <= ?");
    values.push(Number(giaDen));
  }
  if (dienTichTu) {
    filterConditions.push("DienTich >= ?");
    values.push(Number(dienTichTu));
  }
  if (dienTichDen) {
    filterConditions.push("DienTich <= ?");
    values.push(Number(dienTichDen));
  }
  if (maTinh) {
    filterConditions.push("MaTinh = ?");
    values.push(maTinh);
  }
  if (maHuyen) {
    filterConditions.push("MaHuyen = ?");
    values.push(maHuyen);
  }
  if (filters.MaNgDung) {
    filterConditions.push("tt.MaNgDung = ?");
    values.push(filters.MaNgDung);
  }
  if (
    filters.featured === "true" ||
    filters.featured === true ||
    filters.featured === "1" ||
    filters.featured === 1
  ) {
    filterConditions.push("tt.Featured = 1");
  }

  // Lọc theo trạng thái duyệt: Mặc định người dùng ngoài chỉ xem tin APPROVED
  if (filters.trangThaiDuyet) {
    filterConditions.push("tt.TrangThaiDuyet = ?");
    values.push(filters.trangThaiDuyet);
  } else if (!filters.includeAllModeration) {
    filterConditions.push(
      "(tt.TrangThaiDuyet = 'APPROVED' OR tt.TrangThaiDuyet IS NULL)",
    );
  }

  const filterQuery =
    filterConditions.length > 0
      ? "WHERE " + filterConditions.join(" AND ")
      : "";

  const sql = `SELECT tt.*, 
           (SELECT DuongDanAnh 
            FROM HINHANHBDS 
            WHERE MaTTND = tt.MaTTND 
            LIMIT 1) AS HinhAnh
    FROM THONGTINNHADAT tt
    ${filterQuery}
    ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.NgayTao DESC
    LIMIT ? OFFSET ?`;

  const queryValues = [...values, parsedLimit, offset];
  const [properties] = await db.promise().query(sql, queryValues);

  // Lấy danh sách tất cả hình ảnh cho mỗi bài đăng
  for (const property of properties) {
    const [images] = await db
      .promise()
      .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [
        property.MaTTND,
      ]);
    property.HinhAnh = images.map((img) => img.DuongDanAnh);
    property.Featured = Boolean(property.Featured);
    property.isFeatured = Boolean(property.Featured);
  }

  // Tổng số bản ghi
  const countSql = `SELECT COUNT(*) AS total FROM THONGTINNHADAT tt ${filterQuery}`;
  const [countRows] = await db.promise().query(countSql, values);
  const total = countRows[0] ? countRows[0].total : 0;

  return {
    properties,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Tìm kiếm bài đăng theo từ khóa, lọc và sắp xếp
 */
const searchProperties = async (searchParams) => {
  const {
    keyword = "",
    loaiBDS = "",
    tinh = "",
    huyen = "",
    trangThai = "",
    giaMin = "",
    giaMax = "",
    dienTichMin = "",
    dienTichMax = "",
    page = 1,
    limit = 12,
    sort = "default",
  } = searchParams;

  const parsedPage = Number.parseInt(page) || 1;
  const parsedLimit = Number.parseInt(limit) || 12;
  const offset = (parsedPage - 1) * parsedLimit;
  const values = [];
  const conditions = [];

  if (keyword) {
    conditions.push("(tt.TieuDe LIKE ? OR tt.MoTa LIKE ? OR tt.DiaChi LIKE ?)");
    const keywordPattern = `%${keyword}%`;
    values.push(keywordPattern, keywordPattern, keywordPattern);
  }

  if (loaiBDS) {
    conditions.push("tt.MaLoaiND = ?");
    values.push(loaiBDS);
  }

  if (tinh) {
    conditions.push("tt.MaTinh = ?");
    values.push(tinh);
  }

  if (huyen) {
    conditions.push("tt.MaHuyen = ?");
    values.push(huyen);
  }

  if (giaMin) {
    conditions.push("tt.Gia >= ?");
    values.push(Number.parseInt(giaMin));
  }

  if (giaMax) {
    conditions.push("tt.Gia <= ?");
    values.push(Number.parseInt(giaMax));
  }

  if (dienTichMin) {
    conditions.push("tt.DienTich >= ?");
    values.push(Number.parseInt(dienTichMin));
  }

  if (dienTichMax) {
    conditions.push("tt.DienTich <= ?");
    values.push(Number.parseInt(dienTichMax));
  }

  // Lọc theo Nhu cầu (TrangThai: 'đang bán' hoặc 'cho thuê')
  if (trangThai) {
    conditions.push("LOWER(tt.TrangThai) = LOWER(?)");
    values.push(trangThai);
  } else {
    // Mặc định chỉ hiển thị tin đang hoạt động (cả bán và cho thuê)
    conditions.push(
      "(LOWER(tt.TrangThai) = 'đang bán' OR LOWER(tt.TrangThai) = 'cho thuê')",
    );
  }

  // Chỉ hiển thị tin đã được Admin phê duyệt
  conditions.push(
    "(tt.TrangThaiDuyet = 'APPROVED' OR tt.TrangThaiDuyet IS NULL)",
  );

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Sắp xếp
  let orderClause = "ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.NgayTao DESC";
  switch (sort) {
    case "price-asc":
      orderClause = "ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.Gia ASC";
      break;
    case "price-desc":
      orderClause = "ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.Gia DESC";
      break;
    case "area-asc":
      orderClause = "ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.DienTich ASC";
      break;
    case "area-desc":
      orderClause = "ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.DienTich DESC";
      break;
    case "views-desc":
      orderClause = "ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.SoLuotXem DESC";
      break;
    case "newest":
    default:
      orderClause = "ORDER BY (tt.Featured = 1 AND (tt.FeaturedEndDate IS NULL OR tt.FeaturedEndDate >= NOW())) DESC, tt.NgayTao DESC";
      break;
  }

  const searchQuery = `SELECT tt.*, 
           l.TenLoaiND as LoaiBDS,
           (SELECT DuongDanAnh 
            FROM HINHANHBDS 
            WHERE MaTTND = tt.MaTTND 
            LIMIT 1) AS HinhAnh
    FROM THONGTINNHADAT tt
    LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?`;

  const searchValues = [...values, parsedLimit, offset];
  const [properties] = await db.promise().query(searchQuery, searchValues);

  // Lấy hình ảnh cho mỗi bài đăng
  for (const property of properties) {
    const [images] = await db
      .promise()
      .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [
        property.MaTTND,
      ]);
    property.HinhAnh = images.map((img) => img.DuongDanAnh);
    property.Featured = Boolean(property.Featured);
    property.isFeatured = Boolean(property.Featured);
  }

  // Đếm tổng số kết quả
  const countQuery = `SELECT COUNT(*) AS total 
    FROM THONGTINNHADAT tt
    LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
    ${whereClause}`;
  const [countResult] = await db.promise().query(countQuery, values);
  const total = countResult[0] ? countResult[0].total : 0;

  return {
    properties,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Lấy danh sách bài đăng theo mã người dùng
 */
const getUserProperties = async (userId) => {
  const [properties] = await db
    .promise()
    .query(
      `SELECT * FROM THONGTINNHADAT WHERE MaNgDung = ? ORDER BY NgayTao DESC`,
      [userId],
    );

  for (const property of properties) {
    const [images] = await db
      .promise()
      .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [
        property.MaTTND,
      ]);
    property.HinhAnh = images.map((img) => img.DuongDanAnh);
  }

  return properties;
};

/**
 * Lấy chi tiết bài đăng theo ID
 */
const getPropertyById = async (propertyId) => {
  const [properties] = await db.promise().query(
    `SELECT p.*, l.TenLoaiND as LoaiBDS 
     FROM THONGTINNHADAT p
     LEFT JOIN LOAINHADAT l ON p.MaLoaiND = l.MaLoaiND
     WHERE p.MaTTND = ?`,
    [propertyId],
  );

  if (!properties || properties.length === 0) {
    return null;
  }

  const property = properties[0];

  const [images] = await db
    .promise()
    .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId]);
  property.HinhAnh = images.map((img) => img.DuongDanAnh);

  const [documentImages] = await db
    .promise()
    .query(`SELECT DuongDanAnh FROM HINHANHGIAYTO WHERE MaTTND = ?`, [
      propertyId,
    ]);
  property.HinhAnhGiayTo = documentImages.map((img) => img.DuongDanAnh);

  return property;
};

/**
 * Tăng số lượt xem của bài đăng
 */
const incrementViews = async (propertyId, viewerId) => {
  const [properties] = await db
    .promise()
    .query(`SELECT * FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId]);
  const property = properties[0];

  if (!property) {
    return { notFound: true };
  }

  if (viewerId && viewerId === property.MaNgDung) {
    return {
      skipped: true,
      message: "Không tăng lượt xem vì người xem là chủ sở hữu",
      SoLuotXem: property.SoLuotXem,
    };
  }

  await db
    .promise()
    .query(
      `UPDATE THONGTINNHADAT SET SoLuotXem = SoLuotXem + 1 WHERE MaTTND = ?`,
      [propertyId],
    );

  return {
    success: true,
    message: "Tăng lượt xem thành công",
    SoLuotXem: property.SoLuotXem + 1,
  };
};

/**
 * Lấy số lượng bài đăng của người dùng
 */
const getUserPostCount = async (userId) => {
  const [existingPosts] = await db
    .promise()
    .query(`SELECT COUNT(*) as count FROM THONGTINNHADAT WHERE MaNgDung = ?`, [
      userId,
    ]);
  return existingPosts[0] ? existingPosts[0].count : 0;
};

/**
 * Tạo bài đăng mới
 */
const createProperty = async ({
  userId,
  propertyData,
  hinhAnh = [],
  hinhAnhGiayTo = [],
  videoThuaDat = null,
}) => {
  const {
    TieuDe,
    MoTa,
    MaLoaiND,
    Gia,
    DienTich,
    DiaChi,
    MaTinh,
    MaHuyen,
    MaXa,
    TrangThai,
    ToaDoVN2000,
    GPS_Lat,
    GPS_Lng,
    TienDatCoc,
    ThoiHanThue,
    TienDien,
    TienNuoc,
    PhiDichVu,
    NoiThat,
    TienIch,
    MaDuAn,
  } = propertyData;

  const [result] = await db.promise().query(
    `INSERT INTO THONGTINNHADAT (
      MaNgDung, TieuDe, MoTa, MaLoaiND, Gia, DienTich, DiaChi, 
      MaTinh, MaHuyen, MaXa, TrangThai, TrangThaiDuyet, MaDuAn,
      ToaDoVN2000, GPS_Lat, GPS_Lng, VideoThuaDat,
      TienDatCoc, ThoiHanThue, TienDien, TienNuoc, PhiDichVu, NoiThat, TienIch,
      SoLuotXem, NgayTao
    ) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
    [
      userId,
      TieuDe,
      MoTa,
      MaLoaiND,
      Gia,
      DienTich,
      DiaChi,
      MaTinh,
      MaHuyen,
      MaXa,
      TrangThai,
      MaDuAn || null,
      ToaDoVN2000 || null,
      GPS_Lat || null,
      GPS_Lng || null,
      videoThuaDat,
      TienDatCoc ? parseFloat(TienDatCoc) : 0,
      ThoiHanThue || null,
      TienDien || null,
      TienNuoc || null,
      PhiDichVu || null,
      NoiThat || null,
      TienIch || null,
    ],
  );

  const propertyId = result.insertId;

  for (const imagePath of hinhAnh) {
    await db
      .promise()
      .query(`INSERT INTO HINHANHBDS (MaTTND, DuongDanAnh) VALUES (?, ?)`, [
        propertyId,
        imagePath,
      ]);
  }

  for (const imagePath of hinhAnhGiayTo) {
    await db
      .promise()
      .query(`INSERT INTO HINHANHGIAYTO (MaTTND, DuongDanAnh) VALUES (?, ?)`, [
        propertyId,
        imagePath,
      ]);
  }

  return propertyId;
};

/**
 * Cập nhật bài đăng
 */
const updateProperty = async ({
  propertyId,
  userId,
  propertyData,
  hinhAnh,
  hinhAnhGiayTo,
  newVideoPath,
}) => {
  const [properties] = await db
    .promise()
    .query(`SELECT * FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId]);
  const property = properties[0];

  if (!property) {
    return { notFound: true };
  }

  if (property.MaNgDung !== userId) {
    return { forbidden: true };
  }

  const {
    TieuDe,
    MoTa,
    MaLoaiND,
    Gia,
    DienTich,
    DiaChi,
    MaTinh,
    MaHuyen,
    MaXa,
    TrangThai,
    ToaDoVN2000,
    GPS_Lat,
    GPS_Lng,
    TienDatCoc,
    ThoiHanThue,
    TienDien,
    TienNuoc,
    PhiDichVu,
    NoiThat,
    TienIch,
    MaDuAn,
  } = propertyData;

  let videoThuaDat = property.VideoThuaDat;
  if (newVideoPath) {
    // Xóa video cũ nếu có
    if (property.VideoThuaDat) {
      safelyDeleteFile(property.VideoThuaDat);
    }
    videoThuaDat = newVideoPath;
  }

  await db.promise().query(
    `UPDATE THONGTINNHADAT SET 
      TieuDe = ?, MoTa = ?, MaLoaiND = ?, Gia = ?, DienTich = ?, 
      DiaChi = ?, MaTinh = ?, MaHuyen = ?, MaXa = ?, TrangThai = ?,
      ToaDoVN2000 = ?, GPS_Lat = ?, GPS_Lng = ?, VideoThuaDat = ?,
      TienDatCoc = ?, ThoiHanThue = ?, TienDien = ?, TienNuoc = ?, PhiDichVu = ?, NoiThat = ?, TienIch = ?,
      MaDuAn = ?
    WHERE MaTTND = ?`,
    [
      TieuDe,
      MoTa,
      MaLoaiND,
      Gia,
      DienTich,
      DiaChi,
      MaTinh,
      MaHuyen,
      MaXa,
      TrangThai,
      ToaDoVN2000 || null,
      GPS_Lat || null,
      GPS_Lng || null,
      videoThuaDat,
      TienDatCoc !== undefined
        ? TienDatCoc
          ? parseFloat(TienDatCoc)
          : 0
        : property.TienDatCoc,
      ThoiHanThue !== undefined ? ThoiHanThue : property.ThoiHanThue,
      TienDien !== undefined ? TienDien : property.TienDien,
      TienNuoc !== undefined ? TienNuoc : property.TienNuoc,
      PhiDichVu !== undefined ? PhiDichVu : property.PhiDichVu,
      NoiThat !== undefined ? NoiThat : property.NoiThat,
      TienIch !== undefined ? TienIch : property.TienIch,
      MaDuAn !== undefined ? MaDuAn || null : property.MaDuAn,
      propertyId,
    ],
  );

  // Cập nhật danh sách hình ảnh
  await db
    .promise()
    .query(`DELETE FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId]);
  for (const imagePath of hinhAnh) {
    await db
      .promise()
      .query(`INSERT INTO HINHANHBDS (MaTTND, DuongDanAnh) VALUES (?, ?)`, [
        propertyId,
        imagePath,
      ]);
  }

  // Cập nhật hình ảnh giấy tờ
  await db
    .promise()
    .query(`DELETE FROM HINHANHGIAYTO WHERE MaTTND = ?`, [propertyId]);
  for (const imagePath of hinhAnhGiayTo) {
    await db
      .promise()
      .query(`INSERT INTO HINHANHGIAYTO (MaTTND, DuongDanAnh) VALUES (?, ?)`, [
        propertyId,
        imagePath,
      ]);
  }

  return {
    success: true,
    videoThuaDat,
  };
};

/**
 * Xóa bài đăng và file hình ảnh/video liên quan
 */
const deleteProperty = async ({ propertyId, userId }) => {
  const [properties] = await db
    .promise()
    .query(`SELECT * FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId]);
  const property = properties[0];

  if (!property) {
    return { notFound: true };
  }

  if (property.MaNgDung !== userId) {
    return { forbidden: true };
  }

  // Xóa ảnh từ đĩa và CSDL
  const [images] = await db
    .promise()
    .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId]);
  for (const { DuongDanAnh } of images) {
    safelyDeleteFile(DuongDanAnh);
  }
  await db
    .promise()
    .query(`DELETE FROM HINHANHBDS WHERE MaTTND = ?`, [propertyId]);

  // Xóa ảnh giấy tờ từ đĩa và CSDL
  const [documentImages] = await db
    .promise()
    .query(`SELECT DuongDanAnh FROM HINHANHGIAYTO WHERE MaTTND = ?`, [
      propertyId,
    ]);
  for (const { DuongDanAnh } of documentImages) {
    safelyDeleteFile(DuongDanAnh);
  }
  await db
    .promise()
    .query(`DELETE FROM HINHANHGIAYTO WHERE MaTTND = ?`, [propertyId]);

  // Xóa video từ đĩa
  if (property.VideoThuaDat) {
    safelyDeleteFile(property.VideoThuaDat);
  }

  // Xóa bản ghi bài đăng
  await db
    .promise()
    .query(`DELETE FROM THONGTINNHADAT WHERE MaTTND = ?`, [propertyId]);

  return { success: true };
};

module.exports = {
  getAllProperties,
  searchProperties,
  getUserProperties,
  getPropertyById,
  incrementViews,
  getUserPostCount,
  createProperty,
  updateProperty,
  deleteProperty,
};
