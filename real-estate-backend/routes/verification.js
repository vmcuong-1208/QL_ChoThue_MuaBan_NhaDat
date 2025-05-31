const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const db = require("../config/db")
const authenticateToken = require("../middleware/authenticateToken")

// Cấu hình multer cho upload file xác thực
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/verification")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "verification-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Chấp nhận ảnh và video
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true)
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh hoặc video!"), false)
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
})

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.user.LoaiTaiKhoan || req.user.LoaiTaiKhoan !== "admin") {
    return res.status(403).json({ message: "Không có quyền truy cập" })
  }
  next()
}

// Gửi yêu cầu xác thực
router.post(
  "/:propertyId",
  authenticateToken,
  upload.fields([
    { name: "fileSoDo", maxCount: 5 },
    { name: "videoXacThuc", maxCount: 1 },
    { name: "fileGiayXacNhan", maxCount: 3 },
    { name: "fileQuyHoach", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const { propertyId } = req.params
      const userId = req.user.MaNgDung

      const { camKetCapNhatDinhKy, ghiChuNguoiBan } = req.body

      console.log("Verification request for property:", propertyId, "by user:", userId)

      // Kiểm tra quyền sở hữu bài đăng
      const [property] = await db.promise().query("SELECT MaNgDung FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId])

      if (property.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy bài đăng" })
      }

      if (property[0].MaNgDung !== userId) {
        return res.status(403).json({ message: "Bạn không có quyền xác thực bài đăng này" })
      }

      // Xử lý file upload
      let fileSoDoPath = null
      let videoXacThucPath = null
      let fileGiayXacNhanPath = null
      let fileQuyHoachPath = null

      if (req.files.fileSoDo && req.files.fileSoDo.length > 0) {
        fileSoDoPath = req.files.fileSoDo.map((file) => `/uploads/verification/${file.filename}`).join(",")
      }

      if (req.files.videoXacThuc && req.files.videoXacThuc.length > 0) {
        videoXacThucPath = `/uploads/verification/${req.files.videoXacThuc[0].filename}`
      }

      if (req.files.fileGiayXacNhan && req.files.fileGiayXacNhan.length > 0) {
        fileGiayXacNhanPath = req.files.fileGiayXacNhan
          .map((file) => `/uploads/verification/${file.filename}`)
          .join(",")
      }

      if (req.files.fileQuyHoach && req.files.fileQuyHoach.length > 0) {
        fileQuyHoachPath = req.files.fileQuyHoach.map((file) => `/uploads/verification/${file.filename}`).join(",")
      }

      // Kiểm tra xem đã có yêu cầu xác thực chưa
      const [existingVerification] = await db
        .promise()
        .query("SELECT MaXacThuc FROM THONGTINXACTHUC WHERE MaTTND = ?", [propertyId])

      if (existingVerification.length > 0) {
        // Cập nhật yêu cầu xác thực hiện tại
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
          -- Reset admin checkboxes khi user gửi lại
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
            camKetCapNhatDinhKy === "true",
            ghiChuNguoiBan,
            fileSoDoPath,
            videoXacThucPath,
            fileGiayXacNhanPath,
            fileQuyHoachPath,
            propertyId,
          ],
        )
      } else {
        // Tạo yêu cầu xác thực mới
        await db.promise().query(
          `
        INSERT INTO THONGTINXACTHUC (
          MaTTND, CamKetCapNhatDinhKy, GhiChuNguoiBan, 
          FileSoDo, VideoXacThuc, FileGiayXacNhan, FileQuyHoach
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
          [
            propertyId,
            camKetCapNhatDinhKy === "true",
            ghiChuNguoiBan,
            fileSoDoPath,
            videoXacThucPath,
            fileGiayXacNhanPath,
            fileQuyHoachPath,
          ],
        )
      }

      // Cập nhật trạng thái bài đăng thành "chờ xác thực"
      await db
        .promise()
        .query("UPDATE THONGTINNHADAT SET TrangThaiXacThuc = 'chờ xác thực' WHERE MaTTND = ?", [propertyId])

      res.json({ message: "Gửi yêu cầu xác thực thành công" })
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu xác thực:", error)
      res.status(500).json({ message: "Lỗi server", error: error.message })
    }
  },
)

// Lấy danh sách yêu cầu xác thực (Admin)
router.get("/admin/list", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let whereClause = ""
    const queryParams = []

    if (status !== "all") {
      whereClause = "WHERE tt.TrangThaiXacThuc = ?"
      queryParams.push(status)
    }

    // Lấy danh sách yêu cầu xác thực
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
      [...queryParams, Number.parseInt(limit), Number.parseInt(offset)],
    )

    // Đếm tổng số
    const [countResult] = await db.promise().query(
      `
      SELECT COUNT(*) as total
      FROM THONGTINNHADAT tt
      LEFT JOIN THONGTINXACTHUC xt ON tt.MaTTND = xt.MaTTND
      ${whereClause}
    `,
      queryParams,
    )

    res.json({
      verifications,
      pagination: {
        total: countResult[0].total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách xác thực:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Lấy chi tiết yêu cầu xác thực (Admin)
router.get("/admin/:propertyId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.params

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
      [propertyId],
    )

    if (verification.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu xác thực" })
    }

    res.json(verification[0])
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết xác thực:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Cập nhật trạng thái xác thực (Admin)
router.put("/admin/:propertyId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.params
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
    } = req.body
    const adminId = req.user.MaNgDung

    console.log("Admin updating verification:", propertyId, "to status:", trangThai)

    const validStatuses = ["chờ xác thực", "đã xác thực", "từ chối"]
    if (!validStatuses.includes(trangThai)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" })
    }

    // Cập nhật trạng thái bài đăng
    await db.promise().query("UPDATE THONGTINNHADAT SET TrangThaiXacThuc = ? WHERE MaTTND = ?", [trangThai, propertyId])

    // Cập nhật thông tin xác thực
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
      ],
    )

    res.json({ message: "Cập nhật trạng thái xác thực thành công" })
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái xác thực:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Lấy thông tin xác thực của bài đăng (User)
router.get("/:propertyId", authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params
    const userId = req.user.MaNgDung

    // Kiểm tra quyền sở hữu
    const [property] = await db
      .promise()
      .query("SELECT MaNgDung, TrangThaiXacThuc FROM THONGTINNHADAT WHERE MaTTND = ?", [propertyId])

    if (property.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" })
    }

    if (property[0].MaNgDung !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xem thông tin này" })
    }

    // Lấy thông tin xác thực
    const [verification] = await db.promise().query("SELECT * FROM THONGTINXACTHUC WHERE MaTTND = ?", [propertyId])

    res.json({
      trangThaiXacThuc: property[0].TrangThaiXacThuc,
      thongTinXacThuc: verification[0] || null,
    })
  } catch (error) {
    console.error("Lỗi khi lấy thông tin xác thực:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

module.exports = router
