"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import ChatBot from "./ChatBot"

const FloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <>
      <div
        className="floating-button"
        onClick={toggleChat}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#5eb1ef",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1001,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
        title={isOpen ? "Đóng chat" : "Hỗ trợ trực tuyến"}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </div>

      {isOpen && <ChatBot />}
    </>
  )
}

export default FloatingButton
