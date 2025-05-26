"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FaSearch, FaEllipsisV, FaTrash, FaEnvelope, FaEnvelopeOpen, FaHome } from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import ChatBox from "./ChatBox"
import io from "socket.io-client"
import "../styles/MessageCenter.css"

const API_URL = "http://localhost:5000/api"
const SOCKET_URL = "http://localhost:5000"

const MessageCenter = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState({})
  const [menuOpen, setMenuOpen] = useState(null)

  // Kết nối socket khi component mount
  useEffect(() => {
    if (!currentUser) return

    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    // Đăng ký người dùng hiện tại với socket
    newSocket.emit("register", { userId: currentUser.MaNgDung })

    // Lắng nghe sự kiện online
    newSocket.on("user_status", (data) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: data.status === "online",
      }))
    })

    // Lắng nghe tin nhắn mới
    newSocket.on("new_message", (message) => {
      // Cập nhật danh sách cuộc trò chuyện khi có tin nhắn mới
      fetchConversations()
    })

    // Cleanup khi unmount
    return () => {
      newSocket.disconnect()
    }
  }, [currentUser])

  // Kiểm tra người dùng đã đăng nhập chưa
  useEffect(() => {
    if (!currentUser) {
      navigate("/auth")
    }
  }, [currentUser, navigate])

 
  // Lấy danh sách cuộc trò chuyện
  const fetchConversations = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      console.log("Đang lấy danh sách cuộc trò chuyện cho người dùng:", currentUser.MaNgDung)

      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log("Raw API response:", response)

      if (!response.data || !Array.isArray(response.data)) {
        console.error("Invalid response format:", response.data)
        setError("Định dạng phản hồi không hợp lệ")
        setLoading(false)
        return
      }

      console.log("Kết quả cuộc trò chuyện:", response.data)
      
      // If we have conversation IDs but no details, fetch the details
      if (response.data.length > 0 && !response.data[0].user) {
        const conversationsWithDetails = []

        for (const conv of response.data) {
          try {
            // Fetch user details for the other user
            const userResponse = await axios.get(`${API_URL}/users/${conv.OtherUserId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })

            // Fetch property details if available
            let propertyDetails = null
            if (conv.MaTTND) {
              const propertyResponse = await axios.get(`${API_URL}/properties/${conv.MaTTND}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              propertyDetails = propertyResponse.data
            }

            // Fetch last message
            const messagesResponse = await axios.get(
              `${API_URL}/messages/${conv.OtherUserId}${conv.MaTTND ? `?propertyId=${conv.MaTTND}` : ""}`,
              { headers: { Authorization: `Bearer ${token}` } },
            )

            const lastMessage =
              messagesResponse.data.length > 0 ? messagesResponse.data[messagesResponse.data.length - 1] : null

            // Count unread messages
            const unreadCount = messagesResponse.data.filter(
              (msg) => msg.MaNgMua === conv.OtherUserId && !msg.TrangThaiDoc,
            ).length

            conversationsWithDetails.push({
              user: userResponse.data,
              property: propertyDetails,
              lastMessage: lastMessage,
              unreadCount: unreadCount,
            })
          } catch (error) {
            console.error(`Error fetching details for conversation with user ${conv.OtherUserId}:`, error)
          }
        }

        console.log("Conversations with details:", conversationsWithDetails)
        setConversations(conversationsWithDetails)
      } else {
      setConversations(response.data)
      }
      setLoading(false)
    } catch (error) {
      console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error)
      if (error.response) {
        console.error("Error response:", error.response.data)
        console.error("Error status:", error.response.status)
      }
      setError("Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  // Lấy danh sách cuộc trò chuyện khi component mount
  useEffect(() => {
    fetchConversations()
  }, [currentUser])

  
  // Xử lý khi chọn một cuộc trò chuyện
  const handleSelectConversation = (conversation) => {
    if (!conversation) {
      console.error("No conversation selected")
      return
    }

    if (!conversation.user?.MaNgDung) {
      console.error("Invalid conversation object:", conversation)
      return
    }

    console.log("✅ Selected conversation:", conversation)
    setActiveConversation(conversation)
    setShowChat(true)
    setMenuOpen(null)

    // Đánh dấu tin nhắn đã đọc
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.user.MaNgDung, conversation.property?.MaTTND)
    }
  }

  // Đánh dấu tin nhắn đã đọc
  const markAsRead = async (userId, propertyId = null) => {
    try {
      const token = localStorage.getItem("token")
      const url = propertyId
        ? `${API_URL}/messages/read/${userId}?propertyId=${propertyId}`
        : `${API_URL}/messages/read/${userId}`

      await axios.put(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Cập nhật danh sách cuộc trò chuyện
      setConversations((prev) =>
        prev.map((conv) => {
          if (
            conv.user.MaNgDung === userId &&
            ((!propertyId && !conv.property) || (conv.property && conv.property.MaTTND === propertyId))
          ) {
            return { ...conv, unreadCount: 0 }
          }
          return conv
        }),
      )
    } catch (error) {
      console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error)
    }
  }

  // Xử lý xóa cuộc trò chuyện
  const handleDeleteConversation = async (userId, propertyId = null) => {
    try {
      const token = localStorage.getItem("token")
      const url = propertyId
        ? `${API_URL}/messages/conversation/${userId}?propertyId=${propertyId}`
        : `${API_URL}/messages/conversation/${userId}`

      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Cập nhật danh sách cuộc trò chuyện
      setConversations((prev) =>
        prev.filter(
          (conv) =>
            !(
              conv.user.MaNgDung === userId &&
              ((!propertyId && !conv.property) || (conv.property && conv.property.MaTTND === propertyId))
            ),
        ),
      )

      // Đóng chat box nếu đang mở cuộc trò chuyện bị xóa
      if (
        activeConversation &&
        activeConversation.user.MaNgDung === userId &&
        ((!propertyId && !activeConversation.property) ||
          (activeConversation.property && activeConversation.property.MaTTND === propertyId))
      ) {
        setShowChat(false)
        setActiveConversation(null)
      }

      setMenuOpen(null)
    } catch (error) {
      console.error("Lỗi khi xóa cuộc trò chuyện:", error)
      alert("Không thể xóa cuộc trò chuyện. Vui lòng thử lại sau.")
    }
  }

  // Lọc cuộc trò chuyện theo từ khóa tìm kiếm
  const filteredConversations = conversations.filter((conv) => {
    const userName = conv.user.HoTen || conv.user.Email || ""
    const propertyTitle = conv.property?.TieuDe || ""
    return (
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Định dạng thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    // Nếu tin nhắn được gửi trong ngày hôm nay, chỉ hiển thị giờ
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    // Nếu tin nhắn được gửi trong tuần này, hiển thị tên thứ
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
      return days[date.getDay()]
    }

    // Nếu tin nhắn cũ hơn, hiển thị ngày/tháng
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  // Rút gọn nội dung tin nhắn
  const truncateMessage = (message, maxLength = 30) => {
    if (!message) return ""
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + "..."
  }

  
  // Tạo key duy nhất cho mỗi cuộc trò chuyện
  const getConversationKey = (conversation) => {
    return `${conversation.user.MaNgDung}_${conversation.property?.MaTTND || "general"}`
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="message-center-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải tin nhắn...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="message-center-error">
        <p>{error}</p>
        <button onClick={fetchConversations} className="retry-button">
          Thử lại
        </button>
      </div>
    )
  }
  
  return (
    <div className="message-center-container">
      <div className="message-center-header">
        <h1>Tin nhắn</h1>
      </div>

      <div className="message-center-content">
        <div className="conversation-list-container">
          <div className="conversation-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredConversations.length === 0 ? (
            <div className="no-conversations">
              <FaEnvelope className="no-conversations-icon" />
              <p>Bạn chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            <div className="conversation-list">
              {filteredConversations.map((conversation) => (
                <div
                  key={getConversationKey(conversation)}
                  className={`conversation-item ${
                    activeConversation &&
                    activeConversation.user.MaNgDung === conversation.user.MaNgDung &&
                    (
                      (!activeConversation.property && !conversation.property) ||
                        activeConversation.property?.MaTTND === conversation.property?.MaTTND
                    )
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    <img
                      src={conversation.user.AnhDaiDien || "/placeholder.svg?height=50&width=50"}
                      alt={conversation.user.HoTen || "Người dùng"}
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=50&width=50"
                      }}
                    />
                    {onlineUsers[conversation.user.MaNgDung] && <span className="online-indicator"></span>}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h3>{conversation.user.HoTen || conversation.user.Email || "Người dùng"}</h3>
                      <span className="conversation-time">
                        {conversation.lastMessage ? formatTime(conversation.lastMessage.NgayGui) : ""}
                      </span>
                    </div>
                    {conversation.property && (
                      <div className="conversation-property">
                        <FaHome className="property-icon" />
                        <span>{conversation.property.TieuDe || `BĐS #${conversation.property.MaTTND}`}</span>
                      </div>
                    )}
                    <div className="conversation-preview">
                      <p>
                        {conversation.lastMessage
                          ? truncateMessage(conversation.lastMessage.NoiDung)
                          : "Chưa có tin nhắn"}
                      </p>
                      {conversation.unreadCount > 0 && <span className="unread-badge">{conversation.unreadCount}</span>}
                    </div>
                  </div>
                  <div className="conversation-actions">
                    <button
                      className="menu-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(
                          menuOpen === getConversationKey(conversation) ? null : getConversationKey(conversation),
                        )
                      }}
                    >
                      <FaEllipsisV />
                    </button>
                    {menuOpen === getConversationKey(conversation) && (
                      <div className="menu-dropdown">
                        <button
                          className="menu-item"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (conversation.unreadCount > 0) {
                              markAsRead(conversation.user.MaNgDung, conversation.property?.MaTTND)
                            }
                          }}
                        >
                          {conversation.unreadCount > 0 ? (
                            <>
                              <FaEnvelopeOpen /> Đánh dấu đã đọc
                            </>
                          ) : (
                            <>
                              <FaEnvelope /> Đánh dấu chưa đọc
                            </>
                          )}
                        </button>
                        <button
                          className="menu-item delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
                              handleDeleteConversation(conversation.user.MaNgDung, conversation.property?.MaTTND)
                            }
                          }}
                        >
                          <FaTrash /> Xóa cuộc trò chuyện
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          
        <div className="chat-container">
          {showChat && activeConversation ? (
            <ChatBox
              sellerId={
                activeConversation.user.MaNgDung === currentUser.MaNgDung
                  ? activeConversation.lastMessage?.MaNgMua === currentUser.MaNgDung
                      ? activeConversation.lastMessage?.MaNgBan
                      : activeConversation.lastMessage?.MaNgMua
                  : activeConversation.user.MaNgDung
              }
              propertyId={activeConversation.property?.MaTTND || null}
              propertyTitle={activeConversation.property?.TieuDe || "Cuộc trò chuyện chung"}
              sellerName={activeConversation.user.HoTen || activeConversation.user.Email || "Người dùng"}
              sellerAvatar={activeConversation.user.AnhDaiDien}
              onClose={() => {
                setShowChat(false)
                setActiveConversation(null)
              }}
              embedded={true}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <FaEnvelope className="no-chat-icon" />
                <h3>Chọn một cuộc trò chuyện để bắt đầu</h3>
                <p>Hoặc bắt đầu cuộc trò chuyện mới từ trang chi tiết bất động sản</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageCenter
