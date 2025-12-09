const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    let isAuthorized = true;

    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isAuthorized = decoded.LoaiTaiKhoan === "admin" || decoded.MaNgDung === Number(id);
      } catch (err) {
        console.error("Token verification failed:", err);
      }
    }

    const user = await userService.getUserById(id, isAuthorized);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.AnhDaiDien && !user.AnhDaiDien.startsWith("http")) {
      user.AnhDaiDien = `http://localhost:5000${user.AnhDaiDien.startsWith("/") ? "" : "/"}${user.AnhDaiDien}`;
    }

    res.json(user);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getVerifiedBrokers = async (req, res) => {
  try {
    const limit = req.query.limit || 8;
    const brokers = await userService.getVerifiedBrokers(limit);
    res.json(brokers);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách môi giới:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getUserById,
  getVerifiedBrokers,
};
