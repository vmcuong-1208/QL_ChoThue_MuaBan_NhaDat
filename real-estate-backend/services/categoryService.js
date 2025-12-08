const db = require("../config/db");

// =========================================================================
// 1. QUẢN LÝ LOẠI BẤT ĐỘNG SẢN (PROPERTY TYPES)
// =========================================================================

const getAllPropertyTypes = async (includeAll = true) => {
  let where = "";
  if (!includeAll) {
    where = "WHERE TrangThai = 'hoạt động' OR TrangThai IS NULL";
  }

  const [rows] = await db.promise().query(`
    SELECT 
      l.MaLoaiND AS MaLoai,
      l.MaLoaiND,
      l.TenLoaiND AS TenLoai,
      l.TenLoaiND,
      l.MoTa,
      COALESCE(l.TrangThai, 'hoạt động') as TrangThai,
      COALESCE(l.ThuTuHienThi, 0) as ThuTuHienThi,
      (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaLoaiND = l.MaLoaiND) as SoTinDang
    FROM LOAINHADAT l
    ${where}
    ORDER BY l.ThuTuHienThi ASC, l.TenLoaiND ASC
  `);
  return rows;
};

const createPropertyType = async ({ TenLoai, MoTa = "", ThuTuHienThi = 0, TrangThai = "hoạt động" }) => {
  if (!TenLoai || !TenLoai.trim()) {
    const err = new Error("Tên loại bất động sản không được để trống.");
    err.status = 400;
    throw err;
  }

  // Check duplicate
  const [dup] = await db.promise().query("SELECT MaLoaiND FROM LOAINHADAT WHERE LOWER(TenLoaiND) = LOWER(?)", [TenLoai.trim()]);
  if (dup.length > 0) {
    const err = new Error("Loại bất động sản này đã tồn tại.");
    err.status = 400;
    throw err;
  }

  const [result] = await db.promise().query(
    "INSERT INTO LOAINHADAT (TenLoaiND, MoTa, ThuTuHienThi, TrangThai) VALUES (?, ?, ?, ?)",
    [TenLoai.trim(), MoTa, Number(ThuTuHienThi) || 0, TrangThai]
  );

  return {
    MaLoai: result.insertId,
    MaLoaiND: result.insertId,
    TenLoai: TenLoai.trim(),
    TenLoaiND: TenLoai.trim(),
    MoTa,
    ThuTuHienThi: Number(ThuTuHienThi) || 0,
    TrangThai,
    SoTinDang: 0,
  };
};

const updatePropertyType = async (id, { TenLoai, MoTa, ThuTuHienThi, TrangThai }) => {
  const [existing] = await db.promise().query("SELECT * FROM LOAINHADAT WHERE MaLoaiND = ?", [id]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy loại bất động sản.");
    err.status = 404;
    throw err;
  }

  const newTenLoai = TenLoai !== undefined ? TenLoai.trim() : existing[0].TenLoaiND;
  const newMoTa = MoTa !== undefined ? MoTa : existing[0].MoTa;
  const newThuTu = ThuTuHienThi !== undefined ? Number(ThuTuHienThi) : existing[0].ThuTuHienThi;
  const newTrangThai = TrangThai !== undefined ? TrangThai : existing[0].TrangThai;

  await db.promise().query(
    "UPDATE LOAINHADAT SET TenLoaiND = ?, MoTa = ?, ThuTuHienThi = ?, TrangThai = ? WHERE MaLoaiND = ?",
    [newTenLoai, newMoTa, newThuTu, newTrangThai, id]
  );

  return {
    MaLoai: Number(id),
    MaLoaiND: Number(id),
    TenLoai: newTenLoai,
    TenLoaiND: newTenLoai,
    MoTa: newMoTa,
    ThuTuHienThi: newThuTu,
    TrangThai: newTrangThai,
  };
};

const togglePropertyType = async (id) => {
  const [existing] = await db.promise().query("SELECT MaLoaiND, TrangThai FROM LOAINHADAT WHERE MaLoaiND = ?", [id]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy loại bất động sản.");
    err.status = 404;
    throw err;
  }

  const nextStatus = existing[0].TrangThai === "khóa" ? "hoạt động" : "khóa";
  await db.promise().query("UPDATE LOAINHADAT SET TrangThai = ? WHERE MaLoaiND = ?", [nextStatus, id]);
  return { MaLoaiND: id, TrangThai: nextStatus };
};

const deletePropertyType = async (id) => {
  const [count] = await db.promise().query("SELECT COUNT(*) as total FROM THONGTINNHADAT WHERE MaLoaiND = ?", [id]);
  if (count[0].total > 0) {
    const err = new Error(`Không thể xóa vì đang có ${count[0].total} tin đăng sử dụng loại này. Hãy chuyển sang trạng thái "Khóa".`);
    err.status = 400;
    throw err;
  }

  await db.promise().query("DELETE FROM LOAINHADAT WHERE MaLoaiND = ?", [id]);
  return true;
};

// =========================================================================
// 2. QUẢN LÝ TỈNH / THÀNH PHỐ (PROVINCES)
// =========================================================================

const getAllProvinces = async (includeAll = true) => {
  let where = "";
  if (!includeAll) {
    where = "WHERE t.TrangThai = 'hoạt động' OR t.TrangThai IS NULL";
  }

  const [rows] = await db.promise().query(`
    SELECT 
      t.MaTinh,
      t.TenTinh,
      COALESCE(t.TrangThai, 'hoạt động') as TrangThai,
      COALESCE(t.ThuTuHienThi, 0) as ThuTuHienThi,
      (SELECT COUNT(*) FROM QUANHUYEN WHERE MaTinh = t.MaTinh) as SoQuanHuyen,
      (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaTinh = t.MaTinh) as SoTinDang
    FROM TINHTHANH t
    ${where}
    ORDER BY t.ThuTuHienThi ASC, t.TenTinh ASC
  `);
  return rows;
};

const createProvince = async ({ MaTinh, TenTinh, ThuTuHienThi = 0, TrangThai = "hoạt động" }) => {
  if (!MaTinh || !MaTinh.trim() || !TenTinh || !TenTinh.trim()) {
    const err = new Error("Mã tỉnh và Tên tỉnh không được để trống.");
    err.status = 400;
    throw err;
  }

  const [dup] = await db.promise().query("SELECT MaTinh FROM TINHTHANH WHERE MaTinh = ?", [MaTinh.trim()]);
  if (dup.length > 0) {
    const err = new Error(`Mã tỉnh "${MaTinh}" đã tồn tại trên hệ thống.`);
    err.status = 400;
    throw err;
  }

  await db.promise().query(
    "INSERT INTO TINHTHANH (MaTinh, TenTinh, ThuTuHienThi, TrangThai) VALUES (?, ?, ?, ?)",
    [MaTinh.trim(), TenTinh.trim(), Number(ThuTuHienThi) || 0, TrangThai]
  );

  return {
    MaTinh: MaTinh.trim(),
    TenTinh: TenTinh.trim(),
    ThuTuHienThi: Number(ThuTuHienThi) || 0,
    TrangThai,
    SoQuanHuyen: 0,
    SoTinDang: 0,
  };
};

const updateProvince = async (code, { TenTinh, ThuTuHienThi, TrangThai }) => {
  const [existing] = await db.promise().query("SELECT * FROM TINHTHANH WHERE MaTinh = ?", [code]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy tỉnh/thành phố.");
    err.status = 404;
    throw err;
  }

  const newTen = TenTinh !== undefined ? TenTinh.trim() : existing[0].TenTinh;
  const newThuTu = ThuTuHienThi !== undefined ? Number(ThuTuHienThi) : existing[0].ThuTuHienThi;
  const newTrangThai = TrangThai !== undefined ? TrangThai : existing[0].TrangThai;

  await db.promise().query(
    "UPDATE TINHTHANH SET TenTinh = ?, ThuTuHienThi = ?, TrangThai = ? WHERE MaTinh = ?",
    [newTen, newThuTu, newTrangThai, code]
  );

  return { MaTinh: code, TenTinh: newTen, ThuTuHienThi: newThuTu, TrangThai: newTrangThai };
};

const toggleProvince = async (code) => {
  const [existing] = await db.promise().query("SELECT MaTinh, TrangThai FROM TINHTHANH WHERE MaTinh = ?", [code]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy tỉnh/thành phố.");
    err.status = 404;
    throw err;
  }

  const nextStatus = existing[0].TrangThai === "khóa" ? "hoạt động" : "khóa";
  await db.promise().query("UPDATE TINHTHANH SET TrangThai = ? WHERE MaTinh = ?", [nextStatus, code]);
  return { MaTinh: code, TrangThai: nextStatus };
};

const deleteProvince = async (code) => {
  const [districts] = await db.promise().query("SELECT COUNT(*) as count FROM QUANHUYEN WHERE MaTinh = ?", [code]);
  if (districts[0].count > 0) {
    const err = new Error(`Không thể xóa vì tỉnh này đang chứa ${districts[0].count} quận/huyện. Hãy chuyển sang trạng thái "Khóa".`);
    err.status = 400;
    throw err;
  }

  const [props] = await db.promise().query("SELECT COUNT(*) as count FROM THONGTINNHADAT WHERE MaTinh = ?", [code]);
  if (props[0].count > 0) {
    const err = new Error(`Không thể xóa vì tỉnh này đang có ${props[0].count} tin đăng liên kết.`);
    err.status = 400;
    throw err;
  }

  await db.promise().query("DELETE FROM TINHTHANH WHERE MaTinh = ?", [code]);
  return true;
};

// =========================================================================
// 3. QUẢN LÝ QUẬN / HUYỆN (DISTRICTS)
// =========================================================================

const getAllDistricts = async ({ provinceCode = "", search = "", includeAll = true }) => {
  const conditions = [];
  const values = [];

  if (provinceCode && provinceCode !== "all") {
    conditions.push("q.MaTinh = ?");
    values.push(provinceCode);
  }

  if (!includeAll) {
    conditions.push("(q.TrangThai = 'hoạt động' OR q.TrangThai IS NULL)");
  }

  if (search && search.trim() !== "") {
    conditions.push("(q.TenHuyen LIKE ? OR q.MaHuyen LIKE ? OR t.TenTinh LIKE ?)");
    const s = `%${search.trim()}%`;
    values.push(s, s, s);
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const [rows] = await db.promise().query(`
    SELECT 
      q.MaHuyen,
      q.TenHuyen,
      q.MaTinh,
      COALESCE(q.TrangThai, 'hoạt động') as TrangThai,
      t.TenTinh,
      (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaHuyen = q.MaHuyen) as SoTinDang
    FROM QUANHUYEN q
    LEFT JOIN TINHTHANH t ON q.MaTinh = t.MaTinh
    ${where}
    ORDER BY q.MaTinh ASC, q.TenHuyen ASC
  `, values);

  return rows;
};

const createDistrict = async ({ MaHuyen, TenHuyen, MaTinh, TrangThai = "hoạt động" }) => {
  if (!MaHuyen || !MaHuyen.trim() || !TenHuyen || !TenHuyen.trim() || !MaTinh) {
    const err = new Error("Vui lòng nhập đầy đủ Mã quận/huyện, Tên và Tỉnh/Thành.");
    err.status = 400;
    throw err;
  }

  const [dup] = await db.promise().query("SELECT MaHuyen FROM QUANHUYEN WHERE MaHuyen = ?", [MaHuyen.trim()]);
  if (dup.length > 0) {
    const err = new Error(`Mã quận/huyện "${MaHuyen}" đã tồn tại.`);
    err.status = 400;
    throw err;
  }

  await db.promise().query(
    "INSERT INTO QUANHUYEN (MaHuyen, TenHuyen, MaTinh, TrangThai) VALUES (?, ?, ?, ?)",
    [MaHuyen.trim(), TenHuyen.trim(), MaTinh, TrangThai]
  );

  const [t] = await db.promise().query("SELECT TenTinh FROM TINHTHANH WHERE MaTinh = ?", [MaTinh]);

  return {
    MaHuyen: MaHuyen.trim(),
    TenHuyen: TenHuyen.trim(),
    MaTinh,
    TenTinh: t[0]?.TenTinh || "",
    TrangThai,
    SoTinDang: 0,
  };
};

const updateDistrict = async (code, { TenHuyen, MaTinh, TrangThai }) => {
  const [existing] = await db.promise().query("SELECT * FROM QUANHUYEN WHERE MaHuyen = ?", [code]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy quận/huyện.");
    err.status = 404;
    throw err;
  }

  const newTen = TenHuyen !== undefined ? TenHuyen.trim() : existing[0].TenHuyen;
  const newTinh = MaTinh !== undefined ? MaTinh : existing[0].MaTinh;
  const newTrangThai = TrangThai !== undefined ? TrangThai : existing[0].TrangThai;

  await db.promise().query(
    "UPDATE QUANHUYEN SET TenHuyen = ?, MaTinh = ?, TrangThai = ? WHERE MaHuyen = ?",
    [newTen, newTinh, newTrangThai, code]
  );

  const [t] = await db.promise().query("SELECT TenTinh FROM TINHTHANH WHERE MaTinh = ?", [newTinh]);

  return { MaHuyen: code, TenHuyen: newTen, MaTinh: newTinh, TenTinh: t[0]?.TenTinh || "", TrangThai: newTrangThai };
};

const toggleDistrict = async (code) => {
  const [existing] = await db.promise().query("SELECT MaHuyen, TrangThai FROM QUANHUYEN WHERE MaHuyen = ?", [code]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy quận/huyện.");
    err.status = 404;
    throw err;
  }

  const nextStatus = existing[0].TrangThai === "khóa" ? "hoạt động" : "khóa";
  await db.promise().query("UPDATE QUANHUYEN SET TrangThai = ? WHERE MaHuyen = ?", [nextStatus, code]);
  return { MaHuyen: code, TrangThai: nextStatus };
};

const deleteDistrict = async (code) => {
  const [props] = await db.promise().query("SELECT COUNT(*) as count FROM THONGTINNHADAT WHERE MaHuyen = ?", [code]);
  if (props[0].count > 0) {
    const err = new Error(`Không thể xóa vì quận/huyện này đang có ${props[0].count} tin đăng liên kết.`);
    err.status = 400;
    throw err;
  }

  await db.promise().query("DELETE FROM QUANHUYEN WHERE MaHuyen = ?", [code]);
  return true;
};

// =========================================================================
// 4. QUẢN LÝ DỰ ÁN BẤT ĐỘNG SẢN (PROJECTS)
// =========================================================================

const getAllProjects = async ({ provinceCode = "", districtCode = "", status = "all", search = "" }) => {
  const conditions = [];
  const values = [];

  if (provinceCode && provinceCode !== "all") {
    conditions.push("d.MaTinh = ?");
    values.push(provinceCode);
  }

  if (districtCode && districtCode !== "all") {
    conditions.push("d.MaHuyen = ?");
    values.push(districtCode);
  }

  if (status && status !== "all") {
    conditions.push("d.TrangThai = ?");
    values.push(status);
  }

  if (search && search.trim() !== "") {
    const s = `%${search.trim()}%`;
    conditions.push("(d.TenDuAn LIKE ? OR d.ChuDauTu LIKE ? OR d.DiaChi LIKE ?)");
    values.push(s, s, s);
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const [rows] = await db.promise().query(`
    SELECT 
      d.MaDuAn,
      d.TenDuAn,
      d.ChuDauTu,
      d.DiaChi,
      d.MaTinh,
      d.MaHuyen,
      d.MoTa,
      d.HinhAnh,
      d.TrangThai,
      d.NgayTao,
      t.TenTinh,
      q.TenHuyen,
      (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaDuAn = d.MaDuAn) as SoTinDang
    FROM DUAN d
    LEFT JOIN TINHTHANH t ON d.MaTinh = t.MaTinh
    LEFT JOIN QUANHUYEN q ON d.MaHuyen = q.MaHuyen
    ${where}
    ORDER BY d.NgayTao DESC
  `, values);

  return rows;
};

const getProjectById = async (id) => {
  const [rows] = await db.promise().query(`
    SELECT 
      d.*,
      t.TenTinh,
      q.TenHuyen,
      (SELECT COUNT(*) FROM THONGTINNHADAT WHERE MaDuAn = d.MaDuAn) as SoTinDang
    FROM DUAN d
    LEFT JOIN TINHTHANH t ON d.MaTinh = t.MaTinh
    LEFT JOIN QUANHUYEN q ON d.MaHuyen = q.MaHuyen
    WHERE d.MaDuAn = ?
  `, [id]);

  if (rows.length === 0) {
    const err = new Error("Không tìm thấy dự án.");
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const createProject = async ({ TenDuAn, ChuDauTu, DiaChi, MaTinh, MaHuyen, MoTa, HinhAnh, TrangThai = "đang mở bán" }) => {
  if (!TenDuAn || !TenDuAn.trim()) {
    const err = new Error("Tên dự án không được để trống.");
    err.status = 400;
    throw err;
  }

  const [result] = await db.promise().query(
    `INSERT INTO DUAN (TenDuAn, ChuDauTu, DiaChi, MaTinh, MaHuyen, MoTa, HinhAnh, TrangThai)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      TenDuAn.trim(),
      ChuDauTu || null,
      DiaChi || null,
      MaTinh || null,
      MaHuyen || null,
      MoTa || null,
      HinhAnh || null,
      TrangThai,
    ]
  );

  return getProjectById(result.insertId);
};

const updateProject = async (id, { TenDuAn, ChuDauTu, DiaChi, MaTinh, MaHuyen, MoTa, HinhAnh, TrangThai }) => {
  const [existing] = await db.promise().query("SELECT * FROM DUAN WHERE MaDuAn = ?", [id]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy dự án.");
    err.status = 404;
    throw err;
  }

  const ex = existing[0];
  await db.promise().query(
    `UPDATE DUAN SET 
      TenDuAn = ?,
      ChuDauTu = ?,
      DiaChi = ?,
      MaTinh = ?,
      MaHuyen = ?,
      MoTa = ?,
      HinhAnh = ?,
      TrangThai = ?
    WHERE MaDuAn = ?`,
    [
      TenDuAn !== undefined ? TenDuAn.trim() : ex.TenDuAn,
      ChuDauTu !== undefined ? ChuDauTu : ex.ChuDauTu,
      DiaChi !== undefined ? DiaChi : ex.DiaChi,
      MaTinh !== undefined ? MaTinh : ex.MaTinh,
      MaHuyen !== undefined ? MaHuyen : ex.MaHuyen,
      MoTa !== undefined ? MoTa : ex.MoTa,
      HinhAnh !== undefined ? HinhAnh : ex.HinhAnh,
      TrangThai !== undefined ? TrangThai : ex.TrangThai,
      id,
    ]
  );

  return getProjectById(id);
};

const toggleProject = async (id) => {
  const [existing] = await db.promise().query("SELECT MaDuAn, TrangThai FROM DUAN WHERE MaDuAn = ?", [id]);
  if (existing.length === 0) {
    const err = new Error("Không tìm thấy dự án.");
    err.status = 404;
    throw err;
  }

  const nextStatus = existing[0].TrangThai === "khóa" ? "đang mở bán" : "khóa";
  await db.promise().query("UPDATE DUAN SET TrangThai = ? WHERE MaDuAn = ?", [nextStatus, id]);
  return { MaDuAn: id, TrangThai: nextStatus };
};

const deleteProject = async (id) => {
  const [props] = await db.promise().query("SELECT COUNT(*) as count FROM THONGTINNHADAT WHERE MaDuAn = ?", [id]);
  if (props[0].count > 0) {
    const err = new Error(`Không thể xóa vì dự án này đang có ${props[0].count} tin đăng liên kết.`);
    err.status = 400;
    throw err;
  }

  await db.promise().query("DELETE FROM DUAN WHERE MaDuAn = ?", [id]);
  return true;
};

module.exports = {
  // Types
  getAllPropertyTypes,
  createPropertyType,
  updatePropertyType,
  togglePropertyType,
  deletePropertyType,
  // Provinces
  getAllProvinces,
  createProvince,
  updateProvince,
  toggleProvince,
  deleteProvince,
  // Districts
  getAllDistricts,
  createDistrict,
  updateDistrict,
  toggleDistrict,
  deleteDistrict,
  // Projects
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  toggleProject,
  deleteProject,
};