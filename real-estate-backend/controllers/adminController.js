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

module.exports = {
  getStats,
  getUsers,
  updateUser,
};
