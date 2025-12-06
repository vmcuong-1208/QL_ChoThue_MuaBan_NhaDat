const db = require("../config/db");

const getProvinces = async () => {
  const [rows] = await db.promise().query("SELECT * FROM TINHTHANH ORDER BY TenTinh");
  return rows;
};

const getDistrictsByProvinceId = async (provinceId) => {
  const [rows] = await db.promise().query("SELECT * FROM QUANHUYEN WHERE MaTinh = ? ORDER BY TenHuyen", [provinceId]);
  return rows;
};

const getWardsByDistrictId = async (districtId) => {
  const [rows] = await db.promise().query("SELECT * FROM PHUONGXA WHERE MaHuyen = ? ORDER BY TenXa", [districtId]);
  return rows;
};

module.exports = {
  getProvinces,
  getDistrictsByProvinceId,
  getWardsByDistrictId,
};
