const locationService = require("../services/locationService");

const getProvinces = async (req, res) => {
  try {
    const results = await locationService.getProvinces();
    res.json(results);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getDistricts = async (req, res) => {
  try {
    const { provinceId } = req.params;
    const results = await locationService.getDistrictsByProvinceId(provinceId);
    res.json(results);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách quận/huyện:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getWards = async (req, res) => {
  try {
    const { districtId } = req.params;
    const results = await locationService.getWardsByDistrictId(districtId);
    res.json(results);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phường/xã:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getProvinces,
  getDistricts,
  getWards,
};
