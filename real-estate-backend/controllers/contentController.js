const contentService = require("../services/contentService");

// ==========================================
// 1. STATS
// ==========================================
exports.getContentStats = async (req, res) => {
  try {
    const stats = await contentService.getContentStats();
    res.json(stats);
  } catch (err) {
    console.error("Lỗi lấy thống kê nội dung:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy thống kê nội dung" });
  }
};

// ==========================================
// 2. BANNER CONTROLLER
// ==========================================
exports.getAllBanners = async (req, res) => {
  try {
    const adminOnly = req.query.admin === "true" || (req.user && req.user.LoaiTaiKhoan?.toLowerCase() === "admin");
    const viTri = req.query.viTri || null;
    const banners = await contentService.getAllBanners({ adminOnly, viTri });
    res.json(banners);
  } catch (err) {
    console.error("Lỗi lấy danh sách banner:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy danh sách banner" });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const banner = await contentService.getBannerById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message || "Lỗi lấy thông tin banner" });
  }
};

exports.createBanner = async (req, res) => {
  try {
    let hinhAnh = req.body.HinhAnh;
    if (req.file) {
      hinhAnh = `/uploads/content/${req.file.filename}`;
    }

    if (!hinhAnh) {
      return res.status(400).json({ message: "Vui lòng tải lên hoặc cung cấp đường dẫn hình ảnh banner!" });
    }

    const newBanner = await contentService.createBanner({
      ...req.body,
      HinhAnh: hinhAnh,
    });
    res.status(201).json({ message: "Thêm banner thành công!", data: newBanner });
  } catch (err) {
    console.error("Lỗi tạo banner:", err);
    res.status(400).json({ message: err.message || "Lỗi thêm banner" });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.file) {
      updateData.HinhAnh = `/uploads/content/${req.file.filename}`;
    }

    const updated = await contentService.updateBanner(req.params.id, updateData);
    res.json({ message: "Cập nhật banner thành công!", data: updated });
  } catch (err) {
    console.error("Lỗi cập nhật banner:", err);
    res.status(400).json({ message: err.message || "Lỗi cập nhật banner" });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const result = await contentService.deleteBanner(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("Lỗi xóa banner:", err);
    res.status(400).json({ message: err.message || "Lỗi xóa banner" });
  }
};

exports.toggleBannerStatus = async (req, res) => {
  try {
    const result = await contentService.toggleBannerStatus(req.params.id);
    res.json({ message: "Cập nhật trạng thái banner thành công!", data: result });
  } catch (err) {
    res.status(400).json({ message: err.message || "Lỗi đổi trạng thái banner" });
  }
};

// ==========================================
// 3. TIN TỨC CONTROLLER
// ==========================================
exports.getAllNews = async (req, res) => {
  try {
    const { page, limit, danhMuc, trangThai, search, noiBat } = req.query;
    const adminOnly = req.query.admin === "true" || (req.user && req.user.LoaiTaiKhoan?.toLowerCase() === "admin");

    const result = await contentService.getAllNews({
      page: page || 1,
      limit: limit || 10,
      danhMuc: danhMuc || null,
      trangThai: trangThai || null,
      search: search || "",
      noiBatOnly: noiBat === "true",
      adminOnly,
    });
    res.json(result);
  } catch (err) {
    console.error("Lỗi lấy danh sách tin tức:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy danh sách tin tức" });
  }
};

exports.getNewsDetail = async (req, res) => {
  try {
    const item = await contentService.getNewsByIdOrSlug(req.params.idOrSlug);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    // Tự động tăng lượt xem nếu client yêu cầu hoặc không phải admin
    if (req.query.countView === "true") {
      contentService.incrementNewsViews(item.MaTinTuc).catch(() => {});
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message || "Lỗi lấy chi tiết bài viết" });
  }
};

exports.createNews = async (req, res) => {
  try {
    let hinhAnh = req.body.HinhAnh;
    if (req.file) {
      hinhAnh = `/uploads/content/${req.file.filename}`;
    }

    const newArticle = await contentService.createNews({
      ...req.body,
      HinhAnh: hinhAnh,
    });
    res.status(201).json({ message: "Thêm bài viết mới thành công!", data: newArticle });
  } catch (err) {
    console.error("Lỗi tạo bài viết:", err);
    res.status(400).json({ message: err.message || "Lỗi thêm bài viết" });
  }
};

exports.updateNews = async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.file) {
      updateData.HinhAnh = `/uploads/content/${req.file.filename}`;
    }

    const updated = await contentService.updateNews(req.params.id, updateData);
    res.json({ message: "Cập nhật bài viết thành công!", data: updated });
  } catch (err) {
    console.error("Lỗi cập nhật bài viết:", err);
    res.status(400).json({ message: err.message || "Lỗi cập nhật bài viết" });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const result = await contentService.deleteNews(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("Lỗi xóa bài viết:", err);
    res.status(400).json({ message: err.message || "Lỗi xóa bài viết" });
  }
};

exports.toggleNewsStatus = async (req, res) => {
  try {
    const result = await contentService.toggleNewsStatus(req.params.id);
    res.json({ message: "Cập nhật trạng thái bài viết thành công!", data: result });
  } catch (err) {
    res.status(400).json({ message: err.message || "Lỗi đổi trạng thái bài viết" });
  }
};

// ==========================================
// 4. TRANG GIỚI THIỆU CONTROLLER
// ==========================================
exports.getAbout = async (req, res) => {
  try {
    const about = await contentService.getAboutContent();
    res.json(about);
  } catch (err) {
    console.error("Lỗi lấy thông tin giới thiệu:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy thông tin trang giới thiệu" });
  }
};

exports.updateAbout = async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.file) {
      updateData.HinhAnh = `/uploads/content/${req.file.filename}`;
    }

    const updated = await contentService.updateAboutContent(updateData);
    res.json({ message: "Cập nhật trang giới thiệu và liên hệ thành công!", data: updated });
  } catch (err) {
    console.error("Lỗi cập nhật trang giới thiệu:", err);
    res.status(400).json({ message: err.message || "Lỗi cập nhật thông tin giới thiệu" });
  }
};
