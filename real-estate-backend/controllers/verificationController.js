const verificationService = require("../services/verificationService");

const submitVerification = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.MaNgDung;
    const { camKetCapNhatDinhKy, ghiChuNguoiBan } = req.body;

    let fileSoDoPath = null;
    let videoXacThucPath = null;
    let fileGiayXacNhanPath = null;
    let fileQuyHoachPath = null;

    if (req.files.fileSoDo && req.files.fileSoDo.length > 0) {
      fileSoDoPath = req.files.fileSoDo.map((file) => `/uploads/verification/${file.filename}`).join(",");
    }

    if (req.files.videoXacThuc && req.files.videoXacThuc.length > 0) {
      videoXacThucPath = `/uploads/verification/${req.files.videoXacThuc[0].filename}`;
    }

    if (req.files.fileGiayXacNhan && req.files.fileGiayXacNhan.length > 0) {
      fileGiayXacNhanPath = req.files.fileGiayXacNhan.map((file) => `/uploads/verification/${file.filename}`).join(",");
    }

    if (req.files.fileQuyHoach && req.files.fileQuyHoach.length > 0) {
      fileQuyHoachPath = req.files.fileQuyHoach.map((file) => `/uploads/verification/${file.filename}`).join(",");
    }

    await verificationService.submitVerification({
      propertyId,
      userId,
      camKetCapNhatDinhKy,
      ghiChuNguoiBan,
      fileSoDoPath,
      videoXacThucPath,
      fileGiayXacNhanPath,
      fileQuyHoachPath,
    });

    res.json({ message: "Gửi yêu cầu xác thực thành công" });
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu xác thực:", error);
    if (error.status === 404 || error.status === 403) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getAdminVerificationList = async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10 } = req.query;
    const data = await verificationService.getAdminVerificationList(status, page, limit);
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách xác thực:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getAdminVerificationDetail = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const data = await verificationService.getAdminVerificationDetail(propertyId);
    if (!data) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu xác thực" });
    }
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết xác thực:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const updateVerificationStatus = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const adminId = req.user.MaNgDung;
    const { trangThai } = req.body;

    const validStatuses = ["chờ xác thực", "đã xác thực", "từ chối"];
    if (!validStatuses.includes(trangThai)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    await verificationService.updateVerificationStatus(propertyId, adminId, req.body);
    res.json({ message: "Cập nhật trạng thái xác thực thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái xác thực:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getUserVerification = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.MaNgDung;
    const data = await verificationService.getUserVerification(propertyId, userId);
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin xác thực:", error);
    if (error.status === 404 || error.status === 403) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  submitVerification,
  getAdminVerificationList,
  getAdminVerificationDetail,
  updateVerificationStatus,
  getUserVerification,
};
