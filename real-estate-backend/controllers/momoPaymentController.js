const momoPaymentService = require("../services/momoPaymentService");

const createPayment = async (req, res) => {
  try {
    const { amount, orderInfo, upgradeType = "broker" } = req.body;
    const userId = req.user.id || req.user.MaNgDung;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    const result = await momoPaymentService.createPayment({
      userId,
      amount,
      orderInfo,
      upgradeType,
    });

    res.json(result);
  } catch (error) {
    console.error("Error creating MoMo payment:", error);
    if (error.momoResponse) {
      return res.status(400).json({
        success: false,
        message: "Tạo giao dịch MoMo thất bại",
        error: error.momoResponse,
      });
    }
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo giao dịch",
      error: error.message,
    });
  }
};

const callback = async (req, res) => {
  try {
    const { signature } = req.body;
    if (!signature) {
      return res.status(400).json({ message: "No signature provided" });
    }

    await momoPaymentService.handleCallback(req.body);
    res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("Error processing MoMo callback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id || req.user.MaNgDung;

    const transaction = await momoPaymentService.checkStatus(orderId, userId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    res.json({
      success: true,
      transaction: {
        orderId: transaction.OrderId,
        amount: transaction.Amount,
        status: transaction.TrangThai,
        createdAt: transaction.NgayTao,
        updatedAt: transaction.NgayCapNhat,
      },
    });
  } catch (error) {
    console.error("Error checking transaction status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

module.exports = {
  createPayment,
  callback,
  checkStatus,
};
