const brokerReviewService = require("../services/brokerReviewService");

/**
 * Lấy danh sách đánh giá của môi giới
 */
exports.getBrokerReviews = async (req, res) => {
  try {
    const { brokerId } = req.params;
    const { star, page, limit } = req.query;

    const data = await brokerReviewService.getBrokerReviews(brokerId, {
      star,
      page,
      limit,
    });

    res.json(data);
  } catch (err) {
    console.error("Lỗi lấy danh sách đánh giá môi giới:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy danh sách đánh giá" });
  }
};

/**
 * Kiểm tra xem khách hàng hiện tại có đủ điều kiện đánh giá không
 */
exports.checkEligibility = async (req, res) => {
  try {
    const customerId = req.user ? req.user.MaNgDung : null;
    const { brokerId } = req.params;

    const result = await brokerReviewService.checkEligibility(customerId, brokerId);
    res.json(result);
  } catch (err) {
    console.error("Lỗi kiểm tra điều kiện đánh giá:", err);
    res.status(500).json({ message: err.message || "Lỗi kiểm tra điều kiện" });
  }
};

/**
 * Khách hàng gửi hoặc cập nhật đánh giá
 */
exports.submitReview = async (req, res) => {
  try {
    const customerId = req.user.MaNgDung;
    const io = req.app.get("io");

    const result = await brokerReviewService.createOrUpdateReview(
      {
        ...req.body,
        MaKhachHang: customerId,
      },
      io
    );

    res.status(201).json({
      message: result.isUpdate
        ? "Cập nhật đánh giá thành công!"
        : "Gửi đánh giá môi giới thành công! Cảm ơn bạn đã đóng góp ý kiến.",
      data: result,
    });
  } catch (err) {
    console.error("Lỗi gửi đánh giá môi giới:", err);
    res.status(400).json({ message: err.message || "Lỗi gửi đánh giá" });
  }
};

/**
 * Xóa đánh giá
 */
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const userRole = req.user.LoaiTaiKhoan;
    const { id } = req.params;

    const result = await brokerReviewService.deleteReview(id, userId, userRole);
    res.json(result);
  } catch (err) {
    console.error("Lỗi xóa đánh giá:", err);
    res.status(400).json({ message: err.message || "Lỗi xóa đánh giá" });
  }
};
