const propertyReportService = require("../services/propertyReportService");

/**
 * Khách hàng gửi báo cáo vi phạm
 */
exports.createReport = async (req, res) => {
  try {
    const io = req.app.get("io");
    const userId = req.user ? req.user.MaNgDung : null;

    const result = await propertyReportService.createReport(
      {
        ...req.body,
        MaNgBaoCao: userId || req.body.MaNgBaoCao || null,
      },
      io
    );

    res.status(201).json({
      message: "Gửi báo cáo vi phạm thành công! Ban quản trị sẽ sớm xem xét và xử lý.",
      data: result,
    });
  } catch (err) {
    console.error("Lỗi gửi báo cáo vi phạm:", err);
    res.status(400).json({ message: err.message || "Lỗi gửi báo cáo vi phạm" });
  }
};

/**
 * Admin lấy danh sách báo cáo vi phạm
 */
exports.getReports = async (req, res) => {
  try {
    const { trangThai, search, page, limit } = req.query;

    const data = await propertyReportService.getReports({
      trangThai,
      search,
      page,
      limit,
    });

    res.json(data);
  } catch (err) {
    console.error("Lỗi lấy danh sách báo cáo vi phạm:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy danh sách báo cáo" });
  }
};

/**
 * Admin cập nhật trạng thái xử lý báo cáo
 */
exports.updateReportStatus = async (req, res) => {
  try {
    const adminId = req.user.MaNgDung;
    const { id } = req.params;
    const io = req.app.get("io");

    const result = await propertyReportService.updateReportStatus(
      id,
      req.body,
      adminId,
      io
    );

    res.json({
      message: "Cập nhật trạng thái xử lý báo cáo thành công!",
      data: result,
    });
  } catch (err) {
    console.error("Lỗi cập nhật trạng thái báo cáo:", err);
    res.status(400).json({ message: err.message || "Lỗi cập nhật trạng thái báo cáo" });
  }
};

/**
 * Lấy danh sách các lý do báo cáo chuẩn
 */
exports.getReasons = (req, res) => {
  res.json({ reasons: propertyReportService.VALID_REASONS });
};

/**
 * Lấy lịch sử báo cáo của người dùng
 */
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const reports = await propertyReportService.getMyReports(userId);
    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    console.error("Lỗi lấy lịch sử báo cáo của người dùng:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy lịch sử báo cáo" });
  }
};
