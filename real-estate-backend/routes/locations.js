const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");

// Lấy danh sách tỉnh/thành phố
router.get("/provinces", locationController.getProvinces);

// Lấy danh sách quận/huyện theo tỉnh/thành phố
router.get("/districts/:provinceId", locationController.getDistricts);

// Lấy danh sách phường/xã theo quận/huyện
router.get("/wards/:districtId", locationController.getWards);

module.exports = router;
