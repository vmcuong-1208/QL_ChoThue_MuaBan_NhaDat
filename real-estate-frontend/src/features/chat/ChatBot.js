"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaCircle,
  FaHome,
  FaTrashAlt,
  FaMinus,
  FaExpandAlt,
  FaCompressAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../services/api";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào bạn! 👋 Tôi là **Trợ lý AI Bất Động Sản 3MAN**.\n\nTôi có thể hỗ trợ bạn tìm kiếm nhà đất theo giá & khu vực, tư vấn pháp lý sổ đỏ, tra cứu tọa độ VN2000 hoặc hướng dẫn đăng tin. Bạn đang quan tâm vấn đề gì?",
      sender: "bot",
      timestamp: new Date(),
      suggestedProperties: [],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  // Nút gợi ý nhanh gọn
  const quickQuestions = [
    "🔍 Gợi ý BĐS đang bán mới nhất",
    "📑 Thủ tục sang tên sổ đỏ?",
    "🗺️ Tọa độ VN2000 xem thế nào?",
    "✍️ Hướng dẫn đăng tin",
  ];

  // Cuộn xuống cuối
  useEffect(() => {
    if (!isMinimized && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Co giãn textarea nhỏ gọn
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    const newHeight = Math.max(34, Math.min(textarea.scrollHeight, 80));
    textarea.style.height = `${newHeight}px`;
  }, [inputMessage]);

  const addMessage = (text, sender = "user", suggestedProperties = []) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      suggestedProperties,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendMessage = async (customText = null) => {
    const messageToSend = (customText || inputMessage).trim();
    if (!messageToSend || isTyping) return;

    addMessage(messageToSend, "user");
    if (!customText) {
      setInputMessage("");
    }

    setIsTyping(true);

    try {
      const history = messages.slice(-5).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await axios.post(`${API_URL}/chatbot/message`, {
        message: messageToSend,
        history,
      });

      const { text, suggestedProperties } = response.data;

      setTimeout(() => {
        setIsTyping(false);
        addMessage(
          text || "Xin lỗi, tôi chưa thể trả lời câu hỏi này lúc này.",
          "bot",
          suggestedProperties || []
        );
      }, 300);
    } catch (error) {
      console.error("Lỗi khi chat với AI:", error);
      setIsTyping(false);
      addMessage(
        "Hệ thống AI đang bận kết nối, bạn vui lòng thử lại sau giây lát nhé!",
        "bot"
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChatHistory = () => {
    setMessages([
      {
        id: Date.now(),
        text: "Đã làm mới hội thoại! 👋 Bạn cần tư vấn hay tìm kiếm bất động sản nào?",
        sender: "bot",
        timestamp: new Date(),
        suggestedProperties: [],
      },
    ]);
  };

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    const num = Number(price);
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + " tỷ";
    }
    return (num / 1000000).toFixed(0) + " tr";
  };

  const renderFormattedText = (text) => {
    if (!text) return "";
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <React.Fragment key={idx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-semibold text-gray-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Nút bấm tròn mở Chatbot ở góc phải dưới - kích thước gọn gàng 48px */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={`fixed z-50 flex items-center justify-center transition-all duration-300 shadow-xl bottom-5 right-5 hover:scale-105 ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-800 text-white"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30"
        } rounded-full`}
        style={{ width: "48px", height: "48px" }}
        aria-label={isOpen ? "Đóng chat" : "Mở trợ lý ảo AI"}
      >
        {isOpen ? (
          <FaTimes className="text-lg" />
        ) : (
          <div className="relative flex items-center justify-center">
            <FaRobot className="text-xl" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Cửa sổ Chatbot AI */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 border border-gray-200/90 overflow-hidden ${
            isMinimized
              ? "bottom-20 right-4 sm:right-5 w-72 h-11 rounded-xl"
              : isExpanded
              ? "bottom-20 right-4 sm:right-5 w-[92vw] sm:w-[460px] h-[580px] max-h-[84vh] rounded-2xl"
              : "bottom-18 right-4 sm:right-5 w-[88vw] sm:w-[350px] h-[460px] max-h-[72vh] rounded-2xl"
          }`}
        >
          {/* Header thu nhỏ gọn gàng */}
          <div className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xs select-none">
            <div
              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="relative w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <FaRobot className="text-xs text-white" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold leading-tight truncate">Trợ lý AI 3MAN</h3>
                {!isMinimized && (
                  <p className="text-[10px] text-blue-100 flex items-center gap-1 leading-none mt-0.5">
                    <FaCircle className="text-[5px] text-emerald-400" />
                    Tư vấn 24/7
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              {/* Nút thu nhỏ / mở rộng cửa sổ */}
              {!isMinimized && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors text-xs"
                    title={isExpanded ? "Thu nhỏ kích cỡ" : "Mở rộng kích cỡ"}
                  >
                    {isExpanded ? <FaCompressAlt className="text-[10px]" /> : <FaExpandAlt className="text-[10px]" />}
                  </button>
                  <button
                    type="button"
                    onClick={clearChatHistory}
                    className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors text-xs"
                    title="Làm mới hội thoại"
                  >
                    <FaTrashAlt className="text-[10px]" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors text-xs"
                title={isMinimized ? "Mở rộng" : "Thu gọn"}
              >
                <FaMinus className="text-[10px]" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors text-xs ml-0.5"
                title="Đóng chat"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>

          {/* Nội dung bên trong (Ẩn khi thu gọn) */}
          {!isMinimized && (
            <>
              {/* Vùng tin nhắn */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/70 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.sender === "bot" && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        <FaRobot />
                      </div>
                    )}

                    <div className={`max-w-[86%] ${m.sender === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`p-2.5 rounded-xl text-xs leading-relaxed shadow-2xs ${
                          m.sender === "user"
                            ? "bg-blue-600 text-white rounded-tr-xs"
                            : "bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs"
                        }`}
                      >
                        {renderFormattedText(m.text)}
                      </div>

                      {/* Thẻ gợi ý Bất động sản (gọn gàng) */}
                      {m.suggestedProperties && m.suggestedProperties.length > 0 && (
                        <div className="mt-1.5 space-y-1 w-full">
                          <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                            <FaHome className="text-blue-600 text-[10px]" /> Gợi ý phù hợp:
                          </p>
                          {m.suggestedProperties.map((prop) => (
                            <div
                              key={prop.MaTTND}
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/bat-dong-san/${prop.MaTTND}`);
                              }}
                              className="p-1.5 bg-white hover:bg-blue-50 border border-blue-100 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-1.5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-gray-800 truncate">
                                  {prop.TieuDe}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                  <span className="font-bold text-red-600">
                                    {formatPrice(prop.Gia)}
                                  </span>
                                  <span>•</span>
                                  <span>{prop.DienTich} m²</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-blue-600 font-semibold flex-shrink-0">
                                Xem &rarr;
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <span className="text-[9px] text-gray-400 mt-0.5 block px-0.5">
                        {new Date(m.timestamp).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Loading typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] flex-shrink-0">
                      <FaRobot />
                    </div>
                    <div className="bg-white border border-gray-200 px-2.5 py-1.5 rounded-xl rounded-tl-xs shadow-2xs flex items-center gap-1 text-[11px] text-gray-500">
                      <span>Đang suy nghĩ</span>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Câu hỏi gợi ý nhanh - cuộn ngang mỏng gọn */}
              <div className="px-2.5 py-1.5 bg-white border-t border-gray-100 flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    disabled={isTyping}
                    className="whitespace-nowrap px-2 py-0.5 text-[10px] font-medium bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full transition-colors flex-shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Khung nhập tin nhắn gọn gàng */}
              <div className="p-2 bg-white border-t border-gray-200">
                <div className="flex items-end gap-1.5 bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 rounded-lg px-2 py-1 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Hỏi AI về nhà đất, pháp lý..."
                    rows={1}
                    disabled={isTyping}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-xs text-gray-800 placeholder:text-gray-400 py-1 max-h-20"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    className={`p-1.5 rounded-md text-white transition-all flex-shrink-0 mb-0.5 ${
                      inputMessage.trim() && !isTyping
                        ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                    title="Gửi"
                  >
                    <FaPaperPlane className="text-[10px]" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;
