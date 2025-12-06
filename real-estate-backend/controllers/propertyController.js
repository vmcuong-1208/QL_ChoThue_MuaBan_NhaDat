const propertyService = require("../services/propertyService");

/**
 * Lấy danh sách bất động sản (phân trang và bộ lọc)
 */
const getAllProperties = async (req, res) => {
  try {
    const result = await propertyService.getAllProperties(req.query);
    res.json(result);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bất động sản:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Tìm kiếm bất động sản
 */
const searchProperties = async (req, res) => {
  try {
    const result = await propertyService.searchProperties(req.query);
    res.json(result);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm bất động sản:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Lấy bài đăng của người dùng đang đăng nhập
 */
const getUserProperties = async (req, res) => {
  try {
    const userId = req.user.id || req.user.MaNgDung;
    const properties = await propertyService.getUserProperties(userId);
    res.json(properties);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bất động sản của người dùng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Lấy bài đăng theo ID
 */
const getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await propertyService.getPropertyById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    res.json(property);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin bất động sản:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Tăng lượt xem bài đăng
 */
const incrementViews = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const viewerId = req.body.viewerId || null;

    const result = await propertyService.incrementViews(propertyId, viewerId);

    if (result.notFound) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    res.json({
      message: result.message,
      SoLuotXem: result.SoLuotXem,
    });
  } catch (error) {
    console.error("Lỗi khi tăng lượt xem:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Đăng bài mới
 */
const createProperty = async (req, res) => {
  try {
    const userId = req.user.id || req.user.MaNgDung;

    // Giới hạn số bài đăng cho tài khoản thường
    if (
      req.user.LoaiTaiKhoan &&
      req.user.LoaiTaiKhoan.toLowerCase() === "thường"
    ) {
      const existingPostsCount = await propertyService.getUserPostCount(userId);
      if (existingPostsCount >= 1) {
        return res.status(403).json({
          message:
            "Tài khoản thường chỉ được đăng tối đa 1 tin. Vui lòng nâng cấp tài khoản để đăng thêm tin.",
        });
      }
    }

    const hinhAnh =
      req.files && req.files["HinhAnh"]
        ? req.files["HinhAnh"].map(
            (file) => `/uploads/properties/${file.filename}`
          )
        : [];

    const hinhAnhGiayTo =
      req.files && req.files["HinhAnhGiayTo"]
        ? req.files["HinhAnhGiayTo"].map(
            (file) => `/uploads/documents/${file.filename}`
          )
        : [];

    const videoThuaDat =
      req.files && req.files["VideoThuaDat"] && req.files["VideoThuaDat"].length > 0
        ? `/uploads/videos/${req.files["VideoThuaDat"][0].filename}`
        : null;

    const propertyId = await propertyService.createProperty({
      userId,
      propertyData: req.body,
      hinhAnh,
      hinhAnhGiayTo,
      videoThuaDat,
    });

    res.status(201).json({
      message: "Đăng tin thành công",
      property: {
        MaTTND: propertyId,
        ...req.body,
        HinhAnh: hinhAnh,
        HinhAnhGiayTo: hinhAnhGiayTo,
        VideoThuaDat: videoThuaDat,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo bài đăng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Cập nhật bài đăng
 */
const updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user.id || req.user.MaNgDung;

    const { HinhAnhCu, HinhAnhGiaytoCu } = req.body;

    // Parse hình ảnh cũ an toàn
    let hinhAnh = [];
    if (HinhAnhCu) {
      try {
        hinhAnh = Array.isArray(HinhAnhCu) ? HinhAnhCu : JSON.parse(HinhAnhCu);
      } catch {
        hinhAnh = [];
      }
    }

    if (
      req.files &&
      req.files["HinhAnh"] &&
      req.files["HinhAnh"].length > 0
    ) {
      const newImages = req.files["HinhAnh"].map(
        (file) => `/uploads/properties/${file.filename}`
      );
      hinhAnh = [...hinhAnh, ...newImages];
    }

    // Parse hình ảnh giấy tờ cũ an toàn
    let hinhAnhGiayTo = [];
    if (HinhAnhGiaytoCu) {
      try {
        hinhAnhGiayTo = Array.isArray(HinhAnhGiaytoCu)
          ? HinhAnhGiaytoCu
          : JSON.parse(HinhAnhGiaytoCu);
      } catch {
        hinhAnhGiayTo = [];
      }
    }

    if (
      req.files &&
      req.files["HinhAnhGiayTo"] &&
      req.files["HinhAnhGiayTo"].length > 0
    ) {
      const newDocImages = req.files["HinhAnhGiayTo"].map(
        (file) => `/uploads/documents/${file.filename}`
      );
      hinhAnhGiayTo = [...hinhAnhGiayTo, ...newDocImages];
    }

    const newVideoPath =
      req.files &&
      req.files["VideoThuaDat"] &&
      req.files["VideoThuaDat"].length > 0
        ? `/uploads/videos/${req.files["VideoThuaDat"][0].filename}`
        : null;

    const result = await propertyService.updateProperty({
      propertyId,
      userId,
      propertyData: req.body,
      hinhAnh,
      hinhAnhGiayTo,
      newVideoPath,
    });

    if (result.notFound) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    if (result.forbidden) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chỉnh sửa bài đăng này" });
    }

    res.json({
      message: "Cập nhật bài đăng thành công",
      property: {
        MaTTND: propertyId,
        ...req.body,
        HinhAnh: hinhAnh,
        HinhAnhGiayTo: hinhAnhGiayTo,
        VideoThuaDat: result.videoThuaDat,
      },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài đăng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Xóa bài đăng
 */
const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user.id || req.user.MaNgDung;

    const result = await propertyService.deleteProperty({ propertyId, userId });

    if (result.notFound) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    if (result.forbidden) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài đăng này" });
    }

    res.json({ message: "Xóa bài đăng thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa bài đăng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getAllProperties,
  searchProperties,
  getUserProperties,
  getPropertyById,
  incrementViews,
  createProperty,
  updateProperty,
  deleteProperty,
};
