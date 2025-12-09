const brokerAnalyticsService = require("../services/brokerAnalyticsService");

/**
 * Lấy dữ liệu thống kê hoạt động tin đăng của Môi giới
 */
exports.getBrokerAnalytics = async (req, res) => {
  try {
    const brokerId = req.user.MaNgDung;
    const analytics = await brokerAnalyticsService.getBrokerAnalytics(brokerId);
    res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    console.error("Lỗi lấy dữ liệu thống kê môi giới:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Lỗi máy chủ khi lấy dữ liệu thống kê",
    });
  }
};
