const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// Tìm kiếm bất động sản
router.get("/", searchController.search);

module.exports = router;
