"use client"

import { useState, useEffect, useRef } from "react"
import { FaTimes, FaPaperPlane, FaSpinner } from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import io from "socket.io-client"
import "../styles/ChatBox.css"

const API_URL = "http://localhost:5000/api"
const SOCKET_URL = "http://localhost:5000"
const SERVER_URL = "http://localhost:5000"

// Thêm prop embedded vào danh sách props
const ChatBox = ({ sellerId, propertyId, propertyTitle, sellerName, sellerAvatar, onClose, embedded = false }) => {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [sellerIsOnline, setSellerIsOnline] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const [error, setError] = useState(null)

  // Kết nối socket khi component mount
  useEffect(() => {
    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    // Đăng ký người dùng hiện tại với socket
    if (currentUser) {
      newSocket.emit("register", { userId: currentUser.MaNgDung })
    }

    // Lắng nghe sự kiện online
    newSocket.on("user_status", (data) => {
      if (data.userId === sellerId) {
        setSellerIsOnline(data.status === "online")
      }
    })

    // Lắng nghe tin nhắn mới
    newSocket.on("new_message", (message) => {
      // Chỉ hiển thị tin nhắn liên quan đến bất động sản hiện tại
      if (
        ((message.MaNgMua === currentUser?.MaNgDung && message.MaNgBan === sellerId) ||
          (message.MaNgBan === currentUser?.MaNgDung && message.MaNgMua === sellerId)) &&
        (message.MaTTND === propertyId || (!message.MaTTND && !propertyId))
      ) {
        setMessages((prevMessages) => [...prevMessages, message])
      }
    })

    // Lắng nghe sự kiện đang gõ
    newSocket.on("typing", (data) => {
      if (data.senderId === sellerId && data.receiverId === currentUser?.MaNgDung) {
        setIsTyping(data.isTyping)
      }
    })

    // Cleanup khi unmount
    return () => {
      newSocket.disconnect()
    }
  }, [currentUser, sellerId, propertyId])

  // Lấy lịch sử tin nhắn
  const fetchMessages = async () => {
    if (!currentUser || !sellerId || isNaN(Number(sellerId))) {
      console.error("Invalid parameters for fetching messages:", {
        currentUser: currentUser?.MaNgDung,
        sellerId,
        isValidSellerId: !isNaN(Number(sellerId)),
      })
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      console.log(
        `Đang lấy tin nhắn giữa người dùng hiện tại (${currentUser.MaNgDung}) và người bán ID: ${sellerId}, cho bất động sản ID: ${propertyId || "không có"}`,
      )

      const url = `${API_URL}/messages/${sellerId}${propertyId ? `?propertyId=${propertyId}` : ""}`
      console.log("Request URL:", url)

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Raw messages response:", response)
      console.log(`Nhận được ${response.data.length} tin nhắn`)

      if (Array.isArray(response.data)) {
        setMessages(response.data)
      } else {
        console.error("Invalid messages response format:", response.data)
        setError("Định dạng phản hồi tin nhắn không hợp lệ")
      }

      setLoading(false)
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error)
      if (error.response) {
        console.error("Error response:", error.response.data)
        console.error("Error status:", error.response.status)
      }
      setError("Không thể tải tin nhắn. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [currentUser, sellerId, propertyId])

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    try {
      setSending(true)
      const token = localStorage.getItem("token")
      const messageData = {
        MaNgBan: sellerId,
        MaTTND: propertyId, // Đảm bảo truyền propertyId đúng cách
        NoiDung: newMessage,
      }

      console.log("Đang gửi tin nhắn mới:", messageData)

      const response = await axios.post(`${API_URL}/messages`, messageData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Gửi tin nhắn thành công:", response.data)

      if (response.data) {
        setNewMessage("")

        // Gửi tin nhắn qua socket
        if (socket) {
          console.log("Phát tin nhắn qua socket:", response.data)
          socket.emit("send_message", response.data)
        } else {
          console.warn("Socket chưa kết nối, không thể gửi tin nhắn")
          // Nếu socket không hoạt động, mới thêm tin nhắn trực tiếp
          setMessages([...messages, response.data])
        }
      } else {
        console.error("Invalid response format when sending message:", response)
        setError("Định dạng phản hồi không hợp lệ")
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error)
      if (error.response) {
        console.error("Error response:", error.response.data)
        console.error("Error status:", error.response.status)
      }
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.")
    } finally {
      setSending(false)
    }
  }

  // Xử lý sự kiện đang gõ
  const handleTyping = () => {
    if (!socket || !currentUser) return

    socket.emit("typing", {
      senderId: currentUser.MaNgDung,
      receiverId: sellerId,
      isTyping: true,
    })

    // Clear timeout cũ nếu có
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout mới
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        senderId: currentUser.MaNgDung,
        receiverId: sellerId,
        isTyping: false,
      })
    }, 2000)
  }

  // Định dạng thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!currentUser) {
    return (
      <div className={`chat-box ${embedded ? "embedded" : ""}`}>
        <div className="chat-header">
          <h3>Nhắn tin</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="chat-login-required">
          <p>Vui lòng đăng nhập để sử dụng tính năng nhắn tin.</p>
          <a href="/auth" className="login-button">
            Đăng nhập ngay
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-box ${embedded ? "embedded" : ""}`}>
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">
            <img
              src={sellerAvatar || "/placeholder.svg?height=40&width=40"}
              alt={sellerName}
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=40&width=40"
              }}
            />
            <span className={`status-indicator ${sellerIsOnline ? "online" : "offline"}`}></span>
          </div>
          <div className="chat-user-details">
            <h3>{sellerName}</h3>
            <span className="user-status">{sellerIsOnline ? "Đang trực tuyến" : "Ngoại tuyến"}</span>
          </div>
        </div>
        {!embedded && (
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        )}
      </div>

      <div className="chat-property-info">
        <p>Về bất động sản: {propertyTitle}</p>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">
            <FaSpinner className="spinner" />
            <p>Đang tải tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="chat-error">
                <p>{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    fetchMessages() // You'll need to extract fetchMessages to a named function
                  }}
                  className="retry-button"
                >
                  Thử lại
                </button>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.MaNgMua === currentUser.MaNgDung ? "sent" : "received"}`}>
                <div className="message-content">
                  <p>{message.NoiDung}</p>
                  <span className="message-time">{formatTime(message.NgayGui)}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleTyping}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
        </button>
      </form>
    </div>
  )
}

export default ChatBox
