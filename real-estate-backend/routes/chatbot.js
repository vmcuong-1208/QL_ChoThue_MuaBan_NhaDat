const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

// Endpoint POST /api/chatbot/message
router.post("/message", chatbotController.sendMessage);

module.exports = router;
