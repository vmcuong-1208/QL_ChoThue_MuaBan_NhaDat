const searchService = require("../services/searchService");

const search = async (req, res) => {
  try {
    const results = await searchService.searchProperties(req.query);
    res.json(results);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  search,
};
