const contactRequestService = require("../services/contactRequestService");

/**
 * Khách hàng gửi yêu cầu liên hệ / tư vấn
 */
exports.createContactRequest = async (req, res) => {
  try {
    const io = req.app.get("io");
    const userId = req.user ? req.user.MaNgDung : null;

    const result = await contactRequestService.createContactRequest(
      {
        ...req.body,
        MaNgGui: userId || req.body.MaNgGui || null,
      },
      io
    );

    res.status(201).json({
      message: "Gửi yêu cầu liên hệ thành công! Môi giới sẽ sớm liên hệ lại với bạn.",
      data: result,
    });
  } catch (err) {
    console.error("Lỗi gửi yêu cầu liên hệ:", err);
    res.status(400).json({ message: err.message || "Lỗi gửi yêu cầu liên hệ" });
  }
};

/**
 * Môi giới lấy danh sách yêu cầu liên hệ gửi đến mình
 */
exports.getBrokerRequests = async (req, res) => {
  try {
    const brokerId = req.user.MaNgDung;
    const { trangThai, search, page, limit } = req.query;

    const result = await contactRequestService.getRequestsForBroker(brokerId, {
      trangThai,
      search,
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    console.error("Lỗi lấy danh sách yêu cầu của môi giới:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy danh sách yêu cầu" });
  }
};

/**
 * Khách hàng (User thường) xem lịch sử yêu cầu đã gửi
 */
exports.getCustomerRequests = async (req, res) => {
  try {
    const customerId = req.user.MaNgDung;
    const { page, limit } = req.query;

    const result = await contactRequestService.getRequestsForCustomer(customerId, {
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    console.error("Lỗi lấy lịch sử yêu cầu của khách:", err);
    res.status(500).json({ message: err.message || "Lỗi lấy lịch sử yêu cầu" });
  }
};

/**
 * Môi giới cập nhật trạng thái yêu cầu (Đã liên hệ, Chưa xử lý, Đã hủy)
 */
exports.updateRequestStatus = async (req, res) => {
  try {
    const userId = req.user.MaNgDung;
    const userRole = req.user.LoaiTaiKhoan || "";
    const requestId = req.params.id;

    const updated = await contactRequestService.updateRequestStatus(
      requestId,
      userId,
      req.body,
      userRole
    );

    res.json({
      message: "Cập nhật trạng thái yêu cầu liên hệ thành công!",
      data: updated,
    });
  } catch (err) {
    console.error("Lỗi cập nhật trạng thái yêu cầu:", err);
    res.status(400).json({ message: err.message || "Lỗi cập nhật trạng thái yêu cầu" });
  }
};

/**
 * Thống kê yêu cầu cho môi giới
 */
exports.getBrokerStats = async (req, res) => {
  try {
    const brokerId = req.user.MaNgDung;
    const stats = await contactRequestService.getBrokerStats(brokerId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message || "Lỗi lấy thống kê yêu cầu" });
  }
};
