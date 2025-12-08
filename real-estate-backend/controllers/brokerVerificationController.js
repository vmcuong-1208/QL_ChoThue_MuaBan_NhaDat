const brokerVerificationService = require("../services/brokerVerificationService");

/**
 * Lấy trạng thái xác minh của người dùng hiện tại
 */
const getVerificationStatus = async (req, res) => {
  try {
    const maNgDung = req.user.MaNgDung;
    const data = await brokerVerificationService.getVerificationStatus(maNgDung);
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái xác minh môi giới:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Nộp hồ sơ xác minh môi giới (Upload CCCD)
 */
const submitVerification = async (req, res) => {
  try {
    const maNgDung = req.user.MaNgDung;
    const { soCCCD } = req.body;

    if (!req.files || !req.files.anhCCCDMatTruoc || !req.files.anhCCCDMatSau) {
      return res.status(400).json({
        message: "Vui lòng tải lên cả 2 mặt của CMND/CCCD (mặt trước và mặt sau)!",
      });
    }

    const anhCCCDMatTruoc = `/uploads/broker-verification/${req.files.anhCCCDMatTruoc[0].filename}`;
    const anhCCCDMatSau = `/uploads/broker-verification/${req.files.anhCCCDMatSau[0].filename}`;
    const anhChanDung = req.files.anhChanDung
      ? `/uploads/broker-verification/${req.files.anhChanDung[0].filename}`
      : null;

    const result = await brokerVerificationService.submitVerification({
      maNgDung,
      soCCCD,
      anhCCCDMatTruoc,
      anhCCCDMatSau,
      anhChanDung,
    });

    res.status(201).json({
      message: "Gửi hồ sơ xác minh thành công! Vui lòng chờ Admin phê duyệt.",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi gửi hồ sơ xác minh môi giới:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Admin: Lấy danh sách hồ sơ xác minh
 */
const getAdminVerificationList = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const data = await brokerVerificationService.getAdminVerificationList({
      status,
      search,
      page,
      limit,
    });
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách xác minh môi giới (Admin):", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Admin: Xem chi tiết một hồ sơ xác minh
 */
const getAdminVerificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await brokerVerificationService.getAdminVerificationDetail(id);
    if (!data) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ xác minh" });
    }
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết hồ sơ xác minh:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Admin: Duyệt (VERIFIED) hoặc Từ chối (REJECTED) hồ sơ
 */
const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ghiChuAdmin } = req.body;
    const adminId = req.user.MaNgDung;

    if (!status || !["VERIFIED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ. Chỉ chấp nhận PENDING, VERIFIED hoặc REJECTED.",
      });
    }

    const result = await brokerVerificationService.updateVerificationStatus({
      maXacMinh: id,
      status,
      ghiChuAdmin,
      adminId,
    });

    res.json({
      message:
        status === "VERIFIED"
          ? "Đã phê duyệt xác minh môi giới thành công!"
          : "Đã từ chối hồ sơ xác minh môi giới!",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái xác minh môi giới:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getVerificationStatus,
  submitVerification,
  getAdminVerificationList,
  getAdminVerificationDetail,
  updateVerificationStatus,
};
