const chatbotService = require("../services/chatbotService");

/**
 * Controller xử lý yêu cầu chat AI
 */
const sendMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" });
    }

    const response = await chatbotService.chatWithAI({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
    });

    res.json(response);
  } catch (error) {
    console.error("Lỗi Controller Chatbot:", error);
    res.status(500).json({
      message: "Lỗi xử lý phản hồi AI",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
};
