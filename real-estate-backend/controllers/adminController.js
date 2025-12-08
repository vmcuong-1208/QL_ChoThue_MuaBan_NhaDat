const adminService = require("../services/adminService");

const getStats = async (req, res) => {
  try {
    const data = await adminService.getStats();
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const data = await adminService.getUsers(search, page, limit);
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { LoaiTaiKhoan, TrangThai } = req.body;

    const validRoles = ["admin", "thường", "chủ đầu tư", "môi giới"];
    if (!validRoles.includes(LoaiTaiKhoan)) {
      return res.status(400).json({
        message: "Loại tài khoản không hợp lệ",
        received: LoaiTaiKhoan,
        valid: validRoles,
      });
    }

    const validStatuses = ["hoạt động", "khóa", "chờ xác thực"];
    if (!validStatuses.includes(TrangThai)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
        received: TrangThai,
        valid: validStatuses,
      });
    }

    const updated = await adminService.updateUser(id, { LoaiTaiKhoan, TrangThai });
    res.json({
      message: "Cập nhật thành công",
      updated,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật người dùng:", error);
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách tin đăng quản lý & kiểm duyệt (Admin)
 */
const getProperties = async (req, res) => {
  try {
    const { status = "all", search = "", page = 1, limit = 10 } = req.query;
    const result = await adminService.getModerationProperties({
      status,
      search,
      page,
      limit,
    });
    res.json(result);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tin đăng quản lý:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Lấy chi tiết tin đăng kiểm duyệt (Admin)
 */
const getPropertyDetail = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await adminService.getPropertyModerationDetail(propertyId);
    res.json(property);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết tin đăng kiểm duyệt:", error);
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Cập nhật trạng thái duyệt tin: APPROVED, REJECTED, REMOVED (Admin)
 */
const updatePropertyStatus = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { status, lyDoTuChoi } = req.body;
    const adminId = req.user.MaNgDung || req.user.id;

    if (!status) {
      return res.status(400).json({ message: "Vui lòng cung cấp trạng thái duyệt (status)" });
    }

    const result = await adminService.updatePropertyModerationStatus(propertyId, {
      status,
      lyDoTuChoi,
      adminId,
    });

    res.json({
      message: "Cập nhật trạng thái tin đăng thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái duyệt tin:", error);
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Bật/tắt đánh dấu tin nổi bật: Featured = true/false (Admin)
 */
const togglePropertyFeatured = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { featured } = req.body;

    const result = await adminService.togglePropertyFeatured(propertyId, featured);

    res.json({
      message: result.Featured ? "Đã đánh dấu tin nổi bật" : "Đã hủy đánh dấu nổi bật",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi bật/tắt tin nổi bật:", error);
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUser,
  getProperties,
  getPropertyDetail,
  updatePropertyStatus,
  togglePropertyFeatured,
};
