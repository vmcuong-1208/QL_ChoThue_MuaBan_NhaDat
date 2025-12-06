const recommendationService = require("../services/recommendationService");

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const limit = Number.parseInt(req.query.limit) || 20;

    const data = await recommendationService.getRecommendationsByUser(userId, limit);
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy gợi ý:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const saveViewHistory = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "propertyId is required",
      });
    }

    await recommendationService.saveViewHistory(userId, propertyId);

    res.json({
      success: true,
      message: "Đã lưu lịch sử xem",
    });
  } catch (error) {
    console.error("❌ Lỗi khi lưu lịch sử xem:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lưu lịch sử xem",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getRecommendations,
  saveViewHistory,
};
