const db = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// Hàm tạo slug thân thiện SEO từ tiêu đề tiếng Việt
const generateSlug = (str) => {
  if (!str) return "";
  let slug = str.toLowerCase().trim();
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  slug = slug.replace(/[đĐ]/g, "d");
  slug = slug.replace(/[^a-z0-9\s-]/g, "");
  slug = slug.replace(/\s+/g, "-").replace(/-+/g, "-");
  return slug;
};

// ==========================================
// 1. KPI METRICS NỘI DUNG TỔNG QUAN
// ==========================================
const getContentStats = async () => {
  const [bannerStats] = await queryAsync(`
    SELECT 
      COUNT(*) AS totalBanners,
      SUM(CASE WHEN TrangThai = 'hiển thị' THEN 1 ELSE 0 END) AS activeBanners,
      SUM(CASE WHEN TrangThai = 'ẩn' THEN 1 ELSE 0 END) AS hiddenBanners
    FROM BANNER
  `);

  const [newsStats] = await queryAsync(`
    SELECT 
      COUNT(*) AS totalNews,
      SUM(CASE WHEN TrangThai = 'xuất bản' THEN 1 ELSE 0 END) AS publishedNews,
      SUM(CASE WHEN TrangThai = 'nháp' THEN 1 ELSE 0 END) AS draftNews,
      SUM(CASE WHEN TrangThai = 'ẩn' THEN 1 ELSE 0 END) AS hiddenNews,
      COALESCE(SUM(LuotXem), 0) AS totalViews
    FROM TINTUC
  `);

  const [aboutStats] = await queryAsync(`
    SELECT NgayCapNhat FROM TRANGGIOITHIEU WHERE Id = 1
  `);

  return {
    banners: {
      total: bannerStats.totalBanners || 0,
      active: bannerStats.activeBanners || 0,
      hidden: bannerStats.hiddenBanners || 0,
    },
    news: {
      total: newsStats.totalNews || 0,
      published: newsStats.publishedNews || 0,
      draft: newsStats.draftNews || 0,
      hidden: newsStats.hiddenNews || 0,
      totalViews: newsStats.totalViews || 0,
    },
    about: {
      lastUpdated: aboutStats?.NgayCapNhat || null,
    },
  };
};

// ==========================================
// 2. QUẢN LÝ BANNER QUẢNG CÁO
// ==========================================
const getAllBanners = async (options = {}) => {
  const { adminOnly = false, viTri = null } = options;
  let sql = `SELECT * FROM BANNER WHERE 1=1`;
  const params = [];

  if (!adminOnly) {
    sql += ` AND TrangThai = 'hiển thị'`;
  }
  if (viTri) {
    sql += ` AND ViTri = ?`;
    params.push(viTri);
  }

  sql += ` ORDER BY ThuTu ASC, NgayTao DESC`;
  return await queryAsync(sql, params);
};

const getBannerById = async (id) => {
  const rows = await queryAsync(`SELECT * FROM BANNER WHERE MaBanner = ?`, [id]);
  return rows[0] || null;
};

const createBanner = async (data) => {
  const {
    TenBanner,
    HinhAnh,
    ViTri = "trang_chu",
    LienKet = "",
    ThuTu = 0,
    TrangThai = "hiển thị",
  } = data;

  if (!TenBanner || !HinhAnh) {
    throw new Error("Tên banner và hình ảnh không được để trống!");
  }

  const result = await queryAsync(
    `INSERT INTO BANNER (TenBanner, HinhAnh, ViTri, LienKet, ThuTu, TrangThai)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [TenBanner.trim(), HinhAnh.trim(), ViTri, LienKet ? LienKet.trim() : null, Number(ThuTu) || 0, TrangThai]
  );

  return await getBannerById(result.insertId);
};

const updateBanner = async (id, data) => {
  const banner = await getBannerById(id);
  if (!banner) {
    throw new Error(`Không tìm thấy banner với mã ID: ${id}`);
  }

  const {
    TenBanner = banner.TenBanner,
    HinhAnh = banner.HinhAnh,
    ViTri = banner.ViTri,
    LienKet = banner.LienKet,
    ThuTu = banner.ThuTu,
    TrangThai = banner.TrangThai,
  } = data;

  await queryAsync(
    `UPDATE BANNER 
     SET TenBanner = ?, HinhAnh = ?, ViTri = ?, LienKet = ?, ThuTu = ?, TrangThai = ?
     WHERE MaBanner = ?`,
    [
      TenBanner ? TenBanner.trim() : banner.TenBanner,
      HinhAnh ? HinhAnh.trim() : banner.HinhAnh,
      ViTri,
      LienKet !== undefined ? (LienKet ? LienKet.trim() : null) : banner.LienKet,
      Number(ThuTu) || 0,
      TrangThai,
      id,
    ]
  );

  return await getBannerById(id);
};

const deleteBanner = async (id) => {
  const banner = await getBannerById(id);
  if (!banner) {
    throw new Error(`Không tìm thấy banner với mã ID: ${id}`);
  }
  await queryAsync(`DELETE FROM BANNER WHERE MaBanner = ?`, [id]);
  return { message: "Xóa banner thành công!", deletedBanner: banner };
};

const toggleBannerStatus = async (id) => {
  const banner = await getBannerById(id);
  if (!banner) {
    throw new Error(`Không tìm thấy banner với mã ID: ${id}`);
  }
  const newStatus = banner.TrangThai === "hiển thị" ? "ẩn" : "hiển thị";
  await queryAsync(`UPDATE BANNER SET TrangThai = ? WHERE MaBanner = ?`, [newStatus, id]);
  return { MaBanner: id, TrangThai: newStatus };
};

// ==========================================
// 3. QUẢN LÝ TIN TỨC & BÀI VIẾT BĐS
// ==========================================
const getAllNews = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    danhMuc = null,
    trangThai = null,
    search = "",
    noiBatOnly = false,
    adminOnly = false,
  } = options;

  let whereClauses = [];
  const params = [];

  if (!adminOnly) {
    whereClauses.push(`TrangThai = 'xuất bản'`);
  } else if (trangThai && trangThai !== "all") {
    whereClauses.push(`TrangThai = ?`);
    params.push(trangThai);
  }

  if (danhMuc && danhMuc !== "all") {
    whereClauses.push(`DanhMuc = ?`);
    params.push(danhMuc);
  }

  if (noiBatOnly) {
    whereClauses.push(`NoiBat = 1`);
  }

  if (search && search.trim() !== "") {
    whereClauses.push(`(TieuDe LIKE ? OR TomTat LIKE ? OR TacGia LIKE ?)`);
    const kw = `%${search.trim()}%`;
    params.push(kw, kw, kw);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Đếm tổng số
  const [countResult] = await queryAsync(
    `SELECT COUNT(*) AS total FROM TINTUC ${whereSql}`,
    params
  );
  const total = countResult.total || 0;

  // Lấy dữ liệu phân trang
  const offset = (Number(page) - 1) * Number(limit);
  const dataParams = [...params, Number(limit), Number(offset)];
  const items = await queryAsync(
    `SELECT MaTinTuc, TieuDe, Slug, HinhAnh, TomTat, DanhMuc, TacGia, LuotXem, TrangThai, NoiBat, NgayDang, NgayCapNhat
     FROM TINTUC
     ${whereSql}
     ORDER BY NoiBat DESC, NgayDang DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    items,
  };
};

const getNewsByIdOrSlug = async (idOrSlug) => {
  let rows = [];
  if (!isNaN(idOrSlug)) {
    rows = await queryAsync(`SELECT * FROM TINTUC WHERE MaTinTuc = ?`, [idOrSlug]);
  } else {
    rows = await queryAsync(`SELECT * FROM TINTUC WHERE Slug = ?`, [idOrSlug]);
  }
  return rows[0] || null;
};

const createNews = async (data) => {
  const {
    TieuDe,
    Slug,
    HinhAnh = "",
    TomTat = "",
    NoiDung,
    DanhMuc = "Kinh nghiệm mua bán",
    TacGia = "Ban Biên Tập 3MAN",
    TrangThai = "xuất bản",
    NoiBat = 0,
  } = data;

  if (!TieuDe || !TieuDe.trim()) {
    throw new Error("Tiêu đề bài viết không được để trống!");
  }
  if (!NoiDung || !NoiDung.trim()) {
    throw new Error("Nội dung bài viết không được để trống!");
  }

  let finalSlug = Slug ? Slug.trim() : generateSlug(TieuDe);
  // Đảm bảo slug không trùng lặp
  const existing = await queryAsync(`SELECT MaTinTuc FROM TINTUC WHERE Slug = ?`, [finalSlug]);
  if (existing.length > 0) {
    finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
  }

  const result = await queryAsync(
    `INSERT INTO TINTUC (TieuDe, Slug, HinhAnh, TomTat, NoiDung, DanhMuc, TacGia, TrangThai, NoiBat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      TieuDe.trim(),
      finalSlug,
      HinhAnh ? HinhAnh.trim() : null,
      TomTat ? TomTat.trim() : null,
      NoiDung.trim(),
      DanhMuc || "Kinh nghiệm mua bán",
      TacGia ? TacGia.trim() : "Ban Biên Tập 3MAN",
      TrangThai || "xuất bản",
      NoiBat ? 1 : 0,
    ]
  );

  return await getNewsByIdOrSlug(result.insertId);
};

const updateNews = async (id, data) => {
  const article = await getNewsByIdOrSlug(id);
  if (!article) {
    throw new Error(`Không tìm thấy bài viết với mã ID: ${id}`);
  }

  const {
    TieuDe = article.TieuDe,
    Slug = article.Slug,
    HinhAnh = article.HinhAnh,
    TomTat = article.TomTat,
    NoiDung = article.NoiDung,
    DanhMuc = article.DanhMuc,
    TacGia = article.TacGia,
    TrangThai = article.TrangThai,
    NoiBat = article.NoiBat,
  } = data;

  let finalSlug = Slug ? Slug.trim() : generateSlug(TieuDe);
  if (finalSlug !== article.Slug) {
    const existing = await queryAsync(
      `SELECT MaTinTuc FROM TINTUC WHERE Slug = ? AND MaTinTuc != ?`,
      [finalSlug, id]
    );
    if (existing.length > 0) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }
  }

  await queryAsync(
    `UPDATE TINTUC
     SET TieuDe = ?, Slug = ?, HinhAnh = ?, TomTat = ?, NoiDung = ?, DanhMuc = ?, TacGia = ?, TrangThai = ?, NoiBat = ?
     WHERE MaTinTuc = ?`,
    [
      TieuDe.trim(),
      finalSlug,
      HinhAnh !== undefined ? (HinhAnh ? HinhAnh.trim() : null) : article.HinhAnh,
      TomTat !== undefined ? (TomTat ? TomTat.trim() : null) : article.TomTat,
      NoiDung.trim(),
      DanhMuc,
      TacGia ? TacGia.trim() : article.TacGia,
      TrangThai,
      NoiBat ? 1 : 0,
      id,
    ]
  );

  return await getNewsByIdOrSlug(id);
};

const deleteNews = async (id) => {
  const article = await getNewsByIdOrSlug(id);
  if (!article) {
    throw new Error(`Không tìm thấy bài viết với mã ID: ${id}`);
  }
  await queryAsync(`DELETE FROM TINTUC WHERE MaTinTuc = ?`, [id]);
  return { message: "Xóa bài viết thành công!", deletedArticle: article };
};

const toggleNewsStatus = async (id) => {
  const article = await getNewsByIdOrSlug(id);
  if (!article) {
    throw new Error(`Không tìm thấy bài viết với mã ID: ${id}`);
  }
  const newStatus = article.TrangThai === "xuất bản" ? "ẩn" : "xuất bản";
  await queryAsync(`UPDATE TINTUC SET TrangThai = ? WHERE MaTinTuc = ?`, [newStatus, id]);
  return { MaTinTuc: id, TrangThai: newStatus };
};

const incrementNewsViews = async (id) => {
  await queryAsync(`UPDATE TINTUC SET LuotXem = LuotXem + 1 WHERE MaTinTuc = ?`, [id]);
};

// ==========================================
// 4. QUẢN LÝ TRANG GIỚI THIỆU & LIÊN HỆ
// ==========================================
const getAboutContent = async () => {
  const rows = await queryAsync(`SELECT * FROM TRANGGIOITHIEU WHERE Id = 1`);
  if (rows.length === 0) {
    // Tạo mặc định nếu chưa có
    await queryAsync(`
      INSERT INTO TRANGGIOITHIEU (Id, TieuDe, Slogan, TenDoanhNghiep, DiaChi, SoDienThoai, Hotline, Email)
      VALUES (1, 'Về Bất Động Sản 3MAN', 'Kênh Mua Bán & Cho Thuê BĐS Uy Tín', 'CÔNG TY CP BĐS 3MAN', 'TP. Hồ Chí Minh', '0901 234 567', '1900 8888', 'support@bds3man.vn')
    `);
    const fallback = await queryAsync(`SELECT * FROM TRANGGIOITHIEU WHERE Id = 1`);
    return fallback[0];
  }
  return rows[0];
};

const updateAboutContent = async (data) => {
  const current = await getAboutContent();
  const {
    TieuDe = current.TieuDe,
    Slogan = current.Slogan,
    GioiThieu = current.GioiThieu,
    TamNhin = current.TamNhin,
    SuMenh = current.SuMenh,
    GiaTriCotLoi = current.GiaTriCotLoi,
    HinhAnh = current.HinhAnh,
    TenDoanhNghiep = current.TenDoanhNghiep,
    DiaChi = current.DiaChi,
    SoDienThoai = current.SoDienThoai,
    Hotline = current.Hotline,
    Email = current.Email,
    GioLamViec = current.GioLamViec,
    Website = current.Website,
    Fanpage = current.Fanpage,
  } = data;

  await queryAsync(
    `UPDATE TRANGGIOITHIEU
     SET TieuDe = ?, Slogan = ?, GioiThieu = ?, TamNhin = ?, SuMenh = ?, GiaTriCotLoi = ?, HinhAnh = ?,
         TenDoanhNghiep = ?, DiaChi = ?, SoDienThoai = ?, Hotline = ?, Email = ?, GioLamViec = ?, Website = ?, Fanpage = ?
     WHERE Id = 1`,
    [
      TieuDe,
      Slogan,
      GioiThieu,
      TamNhin,
      SuMenh,
      GiaTriCotLoi,
      HinhAnh,
      TenDoanhNghiep,
      DiaChi,
      SoDienThoai,
      Hotline,
      Email,
      GioLamViec,
      Website,
      Fanpage,
    ]
  );

  return await getAboutContent();
};

module.exports = {
  getContentStats,
  // Banner
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  // Tin tức
  getAllNews,
  getNewsByIdOrSlug,
  createNews,
  updateNews,
  deleteNews,
  toggleNewsStatus,
  incrementNewsViews,
  // Giới thiệu
  getAboutContent,
  updateAboutContent,
};
