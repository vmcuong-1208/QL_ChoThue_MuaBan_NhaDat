"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import ChatBot from "../chat/ChatBot"

const FloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center z-[1001] shadow-xl hover:shadow-2xl transition transform hover:scale-105 cursor-pointer focus:outline-none"
        onClick={toggleChat}
        title={isOpen ? "Đóng chat" : "Hỗ trợ trực tuyến"}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>

      {isOpen && <ChatBot />}
    </>
  )
}

export default FloatingButton
