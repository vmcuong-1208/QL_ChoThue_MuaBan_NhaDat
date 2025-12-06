const db = require("../config/db");

const submitVerification = async ({
  propertyId,
  userId,
  camKetCapNhatDinhKy,
  ghiChuNguoiBan,
  fileSoDoPath,
  videoXacThucPath,
  fileGiayXacNhanPath,
  fileQuyHoachPath,
}) => {
  const [property] = await db.promise().query("SELECT MaNgDung FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId]);

  if (property.length === 0) {
    const err = new Error("Không tìm thấy bài đăng");
    err.status = 404;
    throw err;
  }

  if (property[0].MaNgDung !== userId) {
    const err = new Error("Bạn không có quyền xác thực bài đăng này");
    err.status = 403;
    throw err;
  }

  const [existingVerification] = await db
    .promise()
    .query("SELECT MaXacThuc FROM THONGTINXACTHUC WHERE MaTTND = ?", [propertyId]);

  if (existingVerification.length > 0) {
    await db.promise().query(
      `
      UPDATE THONGTINXACTHUC SET
        CamKetCapNhatDinhKy = ?,
        GhiChuNguoiBan = ?,
        FileSoDo = COALESCE(?, FileSoDo),
        VideoXacThuc = COALESCE(?, VideoXacThuc),
        FileGiayXacNhan = COALESCE(?, FileGiayXacNhan),
        FileQuyHoach = COALESCE(?, FileQuyHoach),
        NgayGui = CURRENT_TIMESTAMP,
        CoSoDoSoHong = FALSE,
        DaCungCapBanChup = FALSE,
        DungDiaChi = FALSE,
        BDSTonTaiDungDiaChi = FALSE,
        DungHinhAnhDacDiem = FALSE,
        DaDoiChieuVoiSoDo = FALSE,
        CoGiayXacNhanKhongTraanhChap = FALSE,
        DaKiemTraQuyHoach = FALSE
      WHERE MaTTND = ?
    `,
      [
        camKetCapNhatDinhKy === "true" || camKetCapNhatDinhKy === true,
        ghiChuNguoiBan,
        fileSoDoPath,
        videoXacThucPath,
        fileGiayXacNhanPath,
        fileQuyHoachPath,
        propertyId,
      ]
    );
  } else {
    await db.promise().query(
      `
      INSERT INTO THONGTINXACTHUC (
        MaTTND, CamKetCapNhatDinhKy, GhiChuNguoiBan, 
        FileSoDo, VideoXacThuc, FileGiayXacNhan, FileQuyHoach
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        propertyId,
        camKetCapNhatDinhKy === "true" || camKetCapNhatDinhKy === true,
        ghiChuNguoiBan,
        fileSoDoPath,
        videoXacThucPath,
        fileGiayXacNhanPath,
        fileQuyHoachPath,
      ]
    );
  }

  await db
    .promise()
    .query("UPDATE THONGTINNHADAT SET TrangThaiXacThuc = 'chờ xác thực' WHERE MaTTND = ?", [propertyId]);

  return true;
};

const getAdminVerificationList = async (status = "all", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let whereClause = "";
  const queryParams = [];

  if (status !== "all") {
    whereClause = "WHERE tt.TrangThaiXacThuc = ?";
    queryParams.push(status);
  }

  const [verifications] = await db.promise().query(
    `
    SELECT 
      tt.MaTTND,
      tt.TieuDe,
      tt.DiaChi,
      tt.Gia,
      tt.TrangThaiXacThuc,
      nd.HoTen as TenNguoiBan,
      nd.Email as EmailNguoiBan,
      xt.NgayGui,
      xt.NgayXacThuc,
      xt.GhiChuNguoiBan,
      xt.GhiChuAdmin,
      (SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = tt.MaTTND LIMIT 1) as HinhAnh
    FROM THONGTINNHADAT tt
    LEFT JOIN THONGTINXACTHUC xt ON tt.MaTTND = xt.MaTTND
    LEFT JOIN NGUOIDUNG nd ON tt.MaNgDung = nd.MaNgDung
    ${whereClause}
    ORDER BY 
      CASE 
        WHEN tt.TrangThaiXacThuc = 'chờ xác thực' THEN 1
        WHEN tt.TrangThaiXacThuc = 'đã xác thực' THEN 2
        WHEN tt.TrangThaiXacThuc = 'từ chối' THEN 3
        ELSE 4
      END,
      xt.NgayGui DESC
    LIMIT ? OFFSET ?
  `,
    [...queryParams, Number.parseInt(limit), Number.parseInt(offset)]
  );

  const [countResult] = await db.promise().query(
    `
    SELECT COUNT(*) as total
    FROM THONGTINNHADAT tt
    LEFT JOIN THONGTINXACTHUC xt ON tt.MaTTND = xt.MaTTND
    ${whereClause}
  `,
    queryParams
  );

  return {
    verifications,
    pagination: {
      total: countResult[0].total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  };
};

const getAdminVerificationDetail = async (propertyId) => {
  const [verification] = await db.promise().query(
    `
    SELECT 
      xt.*,
      tt.TieuDe,
      tt.DiaChi,
      tt.Gia,
      tt.TrangThaiXacThuc,
      nd.HoTen as TenNguoiBan,
      nd.Email as EmailNguoiBan,
      nd.SDT as SDTNguoiBan
    FROM THONGTINXACTHUC xt
    JOIN THONGTINNHADAT tt ON xt.MaTTND = tt.MaTTND
    JOIN NGUOIDUNG nd ON tt.MaNgDung = nd.MaNgDung
    WHERE xt.MaTTND = ?
  `,
    [propertyId]
  );

  return verification.length > 0 ? verification[0] : null;
};

const updateVerificationStatus = async (propertyId, adminId, data) => {
  const {
    trangThai,
    ghiChuAdmin,
    coSoDoSoHong,
    daCungCapBanChup,
    dungDiaChi,
    bdsTonTaiDungDiaChi,
    dungHinhAnhDacDiem,
    daDoiChieuVoiSoDo,
    coGiayXacNhanKhongTraanhChap,
    daKiemTraQuyHoach,
  } = data;

  await db.promise().query("UPDATE THONGTINNHADAT SET TrangThaiXacThuc = ? WHERE MaTTND = ?", [trangThai, propertyId]);

  await db.promise().query(
    `
    UPDATE THONGTINXACTHUC SET
      NgayXacThuc = CURRENT_TIMESTAMP,
      NguoiXacThuc = ?,
      GhiChuAdmin = ?,
      CoSoDoSoHong = ?,
      DaCungCapBanChup = ?,
      DungDiaChi = ?,
      BDSTonTaiDungDiaChi = ?,
      DungHinhAnhDacDiem = ?,
      DaDoiChieuVoiSoDo = ?,
      CoGiayXacNhanKhongTraanhChap = ?,
      DaKiemTraQuyHoach = ?
    WHERE MaTTND = ?
  `,
    [
      adminId,
      ghiChuAdmin,
      coSoDoSoHong || false,
      daCungCapBanChup || false,
      dungDiaChi || false,
      bdsTonTaiDungDiaChi || false,
      dungHinhAnhDacDiem || false,
      daDoiChieuVoiSoDo || false,
      coGiayXacNhanKhongTraanhChap || false,
      daKiemTraQuyHoach || false,
      propertyId,
    ]
  );

  return true;
};

const getUserVerification = async (propertyId, userId) => {
  const [property] = await db
    .promise()
    .query("SELECT MaNgDung, TrangThaiXacThuc FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId]);

  if (property.length === 0) {
    const err = new Error("Không tìm thấy bài đăng");
    err.status = 404;
    throw err;
  }

  if (property[0].MaNgDung !== userId) {
    const err = new Error("Bạn không có quyền xem thông tin này");
    err.status = 403;
    throw err;
  }

  const [verification] = await db.promise().query("SELECT * FROM THONGTINXACTHUC WHERE MaTTND = ?", [propertyId]);

  return {
    trangThaiXacThuc: property[0].TrangThaiXacThuc,
    thongTinXacThuc: verification[0] || null,
  };
};

module.exports = {
  submitVerification,
  getAdminVerificationList,
  getAdminVerificationDetail,
  updateVerificationStatus,
  getUserVerification,
};
