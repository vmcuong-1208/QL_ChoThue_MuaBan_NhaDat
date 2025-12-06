const favoriteService = require("../services/favoriteService");

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;

    const data = await favoriteService.getFavoritesByUser(userId, page, limit);
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu thích:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách yêu thích" });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const { propertyId } = req.params;
    const { GhiChu } = req.body;

    const favoriteId = await favoriteService.addFavorite(userId, propertyId, GhiChu);
    res.status(201).json({
      message: "Đã thêm vào danh sách yêu thích",
      favoriteId,
    });
  } catch (error) {
    console.error("Lỗi khi thêm vào yêu thích:", error);
    if (error.code === "ER_DUP_ENTRY" || error.status === 400) {
      return res.status(400).json({ message: error.message || "Bất động sản đã có trong danh sách yêu thích" });
    }
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server khi thêm vào yêu thích" });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const { propertyId } = req.params;

    const success = await favoriteService.removeFavorite(userId, propertyId);
    if (!success) {
      return res.status(404).json({ message: "Không tìm thấy bất động sản trong danh sách yêu thích" });
    }

    res.json({ message: "Đã xóa khỏi danh sách yêu thích" });
  } catch (error) {
    console.error("Lỗi khi xóa khỏi yêu thích:", error);
    res.status(500).json({ message: "Lỗi server khi xóa khỏi yêu thích" });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const { propertyId } = req.params;

    const isFavorite = await favoriteService.checkFavorite(userId, propertyId);
    res.json({ isFavorite });
  } catch (error) {
    console.error("Lỗi khi kiểm tra yêu thích:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateNote = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const { propertyId } = req.params;
    const { GhiChu } = req.body;

    const success = await favoriteService.updateNote(userId, propertyId, GhiChu);
    if (!success) {
      return res.status(404).json({ message: "Không tìm thấy bất động sản trong danh sách yêu thích" });
    }

    res.json({ message: "Đã cập nhật ghi chú" });
  } catch (error) {
    console.error("Lỗi khi cập nhật ghi chú yêu thích:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  updateNote,
};
