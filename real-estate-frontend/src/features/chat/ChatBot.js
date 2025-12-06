"use client";

import { useState, useEffect, useRef } from "react";
import { FaRobot, FaTimes, FaPaperPlane, FaCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../services/api";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo của hệ thống bất động sản. Tôi có thể giúp bạn:\n\n• Trả lời các câu hỏi thường gặp\n• Tìm kiếm bất động sản theo yêu cầu\n• Hướng dẫn sử dụng hệ thống\n\nBạn cần hỗ trợ gì?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  // FAQ Knowledge Base (giữ nguyên)
  const faqData = {
    "đăng ký":
      "Để đăng ký tài khoản:\n1. Truy cập trang đăng nhập/đăng ký\n2. Điền đầy đủ thông tin: Họ tên, Email, Số điện thoại, Mật khẩu\n3. Xác nhận mật khẩu\n4. Nhấn 'Đăng ký'\n\nMật khẩu cần có ít nhất 8 ký tự và đáp ứng các tiêu chí bảo mật.",
    "đăng nhập":
      "Để đăng nhập:\n1. Truy cập trang đăng nhập\n2. Nhập email và mật khẩu\n3. Nhấn 'Đăng nhập'\n\nBạn cũng có thể đăng nhập bằng Google hoặc sử dụng tính năng quên mật khẩu nếu cần.",
    "quên mật khẩu":
      "Để đặt lại mật khẩu:\n1. Nhấn 'Quên mật khẩu?' ở trang đăng nhập\n2. Nhập email của bạn\n3. Kiểm tra email để nhận mã OTP\n4. Nhập mã OTP để xác thực\n5. Đặt mật khẩu mới\n\nMã OTP có hiệu lực trong 10 phút.",
    "đăng tin":
      "Để đăng tin bất động sản:\n1. Đăng nhập vào tài khoản\n2. Vào 'Quản lý bài đăng' → 'Đăng tin mới'\n3. Điền thông tin: Tiêu đề, Mô tả, Loại BĐS, Giá, Diện tích\n4. Chọn địa chỉ: Tỉnh/Thành → Quận/Huyện → Phường/Xã\n5. Upload hình ảnh (tối đa 10 ảnh, 5MB/ảnh)\n6. Nhấn 'Đăng tin'",
    "tìm kiếm":
      "Có nhiều cách tìm kiếm bất động sản:\n• Tìm kiếm cơ bản: Nhập từ khóa, chọn loại BĐS, địa điểm\n• Tìm kiếm nâng cao: Thêm bộ lọc giá, diện tích\n• Xem gợi ý cá nhân hóa (nếu đã đăng nhập)\n\nBạn có thể lọc theo loại BĐS, địa điểm, khoảng giá và diện tích.",
    "yêu thích":
      "Để thêm bất động sản vào yêu thích:\n1. Nhấn vào biểu tượng trái tim trên thẻ bất động sản\n2. Cần đăng nhập để sử dụng tính năng này\n\nXem danh sách yêu thích trong menu 'Yêu thích'. Bạn có thể thêm ghi chú cá nhân cho mỗi BĐS yêu thích.",
    "liên hệ":
      "Bạn có thể liên hệ hỗ trợ qua:\n• Trang 'Liên hệ' trên website\n• Email: support@batdongsan.com\n• Hotline: 1900-xxxx\n• Giờ hỗ trợ: 8:00 - 22:00 (Thứ 2 - Chủ nhật)",
  };

  // Quick actions
  const quickActions = [
    { text: "🏠 Hướng dẫn đăng tin", action: "guide_post" },
    { text: "🔍 Cách tìm kiếm", action: "guide_search" },
    { text: "📞 Liên hệ hỗ trợ", action: "contact" },
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesRes, provincesRes] = await Promise.all([
          axios.get(`${API_URL}/property-types`),
          axios.get(`${API_URL}/locations/provinces`),
        ]);
        setPropertyTypes(typesRes.data);
        setProvinces(provincesRes.data);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset về 1 dòng
    textarea.style.height = "0px";

    // Tính toán chiều cao thực tế
    const scrollHeight = textarea.scrollHeight;

    // Set height với min 40px, max 120px
    const newHeight = Math.max(40, Math.min(scrollHeight, 120));
    textarea.style.height = `${newHeight}px`;
  }, [inputMessage]);

  const addMessage = (text, sender = "user") => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const findBestFAQMatch = (userInput) => {
    const input = userInput.toLowerCase();
    for (const [keyword, answer] of Object.entries(faqData)) {
      if (input.includes(keyword)) {
        return answer;
      }
    }
    return null;
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "guide_post":
        addMessage("Hướng dẫn đăng tin");
        setTimeout(() => {
          simulateTyping();
          setTimeout(() => addMessage(faqData["đăng tin"], "bot"), 1500);
        }, 500);
        break;
      case "guide_search":
        addMessage("Cách tìm kiếm BĐS");
        setTimeout(() => {
          simulateTyping();
          setTimeout(() => addMessage(faqData["tìm kiếm"], "bot"), 1500);
        }, 500);
        break;
      case "contact":
        addMessage("Liên hệ hỗ trợ");
        setTimeout(() => {
          simulateTyping();
          setTimeout(() => addMessage(faqData["liên hệ"], "bot"), 1500);
        }, 500);
        break;
      default:
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage(userMessage);
    setInputMessage("");

    setTimeout(() => {
      simulateTyping();
      setTimeout(() => {
        const faqAnswer = findBestFAQMatch(userMessage);
        if (faqAnswer) {
          addMessage(faqAnswer, "bot");
        } else {
          addMessage(
            "Tôi hiểu bạn đang cần hỗ trợ. Hãy thử hỏi về:\n\n" +
              "• Cách đăng tin\n" +
              "• Cách tìm kiếm\n" +
              "• Quản lý yêu thích\n" +
              "• Liên hệ hỗ trợ",
            "bot"
          );
        }
      }, 1500);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 flex items-center justify-center transition-all duration-300 shadow-2xl bottom-6 right-6 hover:scale-110 ${
          isOpen
            ? "w-14 h-14 bg-red-500 hover:bg-red-600"
            : "w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 animate-pulse"
        } rounded-full`}
        aria-label={isOpen ? "Đóng chat" : "Mở trợ lý ảo"}
      >
        {isOpen ? (
          <FaTimes className="text-2xl text-white" />
        ) : (
          <FaRobot className="text-3xl text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed z-40 flex flex-col w-full max-w-md overflow-hidden transition-all duration-300 bg-white shadow-2xl bottom-24 right-6 rounded-2xl animate-slideInUp max-h-[calc(100vh-180px)]">
          {/* Header */}
          <div className="relative flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full blur-2xl"></div>
            </div>

            <div className="relative flex items-center justify-center flex-shrink-0 w-12 h-12 bg-white rounded-full bg-opacity-20 backdrop-blur-sm">
              <FaRobot className="text-2xl text-white" />
            </div>

            <div className="relative flex-1">
              <h3 className="text-base font-bold">Trợ lý ảo BĐS</h3>
              <div className="flex items-center gap-1.5 text-xs text-blue-100">
                <FaCircle className="text-[8px] text-green-400 animate-pulse" />
                <span>Đang hoạt động</span>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50 custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "bot" ? "justify-start" : "justify-end"
                } animate-fadeInUp`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-md transition-all duration-300 hover:shadow-lg ${
                    message.sender === "bot"
                      ? "bg-white text-gray-800 rounded-tl-none"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.text}
                  </p>
                  <span
                    className={`block mt-1.5 text-[10px] ${
                      message.sender === "bot"
                        ? "text-gray-500"
                        : "text-blue-100"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="px-4 py-3 bg-white rounded-tl-none shadow-md rounded-2xl">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 transition-all duration-300 bg-white border border-blue-200 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:scale-105 hover:shadow-md"
              >
                {action.text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-gray-200">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              rows="1"
              className="flex-1 px-4 py-2.5 text-sm text-gray-800 transition-all duration-200 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[40px] max-h-[120px] overflow-y-auto leading-relaxed custom-scrollbar"
              style={{ height: "auto" }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                inputMessage.trim()
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-110 shadow-md hover:shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              aria-label="Gửi tin nhắn"
            >
              <FaPaperPlane
                className={`text-sm ${
                  inputMessage.trim() ? "text-white" : "text-gray-500"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ChatBot;
