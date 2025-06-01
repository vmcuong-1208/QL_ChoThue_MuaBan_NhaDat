"use client"

import { useState, useEffect, useRef } from "react"
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../styles/ChatBot.css"

const API_URL = "http://localhost:5000/api"

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo của hệ thống bất động sản. Tôi có thể giúp bạn:\n\n• Trả lời các câu hỏi thường gặp\n• Tìm kiếm bất động sản theo yêu cầu\n• Hướng dẫn sử dụng hệ thống\n\nBạn cần hỗ trợ gì?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [propertyTypes, setPropertyTypes] = useState([])
  const [provinces, setProvinces] = useState([])
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  // FAQ Knowledge Base
  const faqData = {
    // Đăng ký và đăng nhập
    "đăng ký":
      "Để đăng ký tài khoản:\n1. Truy cập trang đăng nhập/đăng ký\n2. Điền đầy đủ thông tin: Họ tên, Email, Số điện thoại, Mật khẩu\n3. Xác nhận mật khẩu\n4. Nhấn 'Đăng ký'\n\nMật khẩu cần có ít nhất 8 ký tự và đáp ứng các tiêu chí bảo mật.",
    "đăng nhập":
      "Để đăng nhập:\n1. Truy cập trang đăng nhập\n2. Nhập email và mật khẩu\n3. Nhấn 'Đăng nhập'\n\nNếu quên mật khẩu, vui lòng liên hệ hỗ trợ.",
    "quên mật khẩu":
      "Hiện tại tính năng reset mật khẩu đang được phát triển. Vui lòng liên hệ admin qua trang 'Liên hệ' để được hỗ trợ reset mật khẩu.",

    // Đăng tin
    "đăng tin":
      "Để đăng tin bất động sản:\n1. Đăng nhập vào tài khoản\n2. Vào 'Quản lý bài đăng' → 'Đăng tin mới'\n3. Điền thông tin: Tiêu đề, Mô tả, Loại BĐS, Giá, Diện tích\n4. Chọn địa chỉ: Tỉnh/Thành → Quận/Huyện → Phường/Xã\n5. Upload hình ảnh (tối đa 10 ảnh, 5MB/ảnh)\n6. Nhấn 'Đăng tin'",
    "chỉnh sửa bài đăng":
      "Để chỉnh sửa bài đăng:\n1. Vào 'Quản lý bài đăng'\n2. Tìm bài đăng cần sửa\n3. Nhấn 'Chỉnh sửa'\n4. Thay đổi thông tin cần thiết\n5. Nhấn 'Cập nhật'",
    "xóa bài đăng":
      "Bạn có thể xóa bài đăng trong phần 'Quản lý bài đăng' bằng cách nhấn nút xóa. Hệ thống sẽ yêu cầu xác nhận trước khi xóa.",

    // Tìm kiếm
    "tìm kiếm":
      "Có nhiều cách tìm kiếm bất động sản:\n• Tìm kiếm cơ bản: Nhập từ khóa, chọn loại BĐS, địa điểm\n• Tìm kiếm nâng cao: Thêm bộ lọc giá, diện tích\n• Xem gợi ý cá nhân hóa (nếu đã đăng nhập)\n\nBạn có thể lọc theo loại BĐS, địa điểm, khoảng giá và diện tích.",
    "lọc kết quả":
      "Bạn có thể lọc kết quả tìm kiếm theo:\n• Loại bất động sản\n• Địa điểm (Tỉnh/Thành, Quận/Huyện, Phường/Xã)\n• Khoảng giá (từ - đến)\n• Diện tích (từ - đến)\n• Sắp xếp theo: Giá, Diện tích, Lượt xem, Ngày đăng",

    // Yêu thích
    "yêu thích":
      "Để thêm bất động sản vào yêu thích:\n1. Nhấn vào biểu tượng trái tim trên thẻ bất động sản\n2. Cần đăng nhập để sử dụng tính năng này\n\nXem danh sách yêu thích trong menu 'Yêu thích'. Bạn có thể thêm ghi chú cá nhân cho mỗi BĐS yêu thích.",

    // Tin nhắn
    "tin nhắn":
      "Để liên hệ với người bán:\n1. Vào trang chi tiết bất động sản\n2. Nhấn 'Nhắn tin cho người bán'\n3. Gửi tin nhắn trong hộp chat\n\nXem lịch sử tin nhắn trong menu 'Tin nhắn'. Hệ thống hỗ trợ chat realtime.",

    // Xác thực
    "xác thực":
      "Xác thực bài đăng giúp tăng độ uy tín:\n1. Vào 'Quản lý bài đăng'\n2. Nhấn 'Gửi xác thực'\n3. Upload tài liệu: Sổ đỏ, Video xác thực, Giấy xác nhận\n4. Gửi yêu cầu\n\nQuá trình xác thực thường mất 1-3 ngày làm việc.",

    // Hỗ trợ
    "liên hệ":
      "Bạn có thể liên hệ hỗ trợ qua:\n• Trang 'Liên hệ' trên website\n• Email: support@batdongsan.com\n• Hotline: 1900-xxxx\n• Giờ hỗ trợ: 8:00 - 22:00 (Thứ 2 - Chủ nhật)",
    "hỗ trợ":
      "Tôi có thể hỗ trợ bạn:\n• Trả lời câu hỏi về cách sử dụng hệ thống\n• Hướng dẫn đăng tin, tìm kiếm\n• Giải đáp thắc mắc về tính năng\n• Tìm kiếm bất động sản theo yêu cầu\n\nHãy cho tôi biết bạn cần hỗ trợ gì cụ thể!",

    // Additional FAQ entries
    "upload ảnh":
      "Khi đăng tin, bạn có thể upload tối đa 10 ảnh:\n• Định dạng: JPG, PNG\n• Dung lượng: Tối đa 5MB/ảnh\n• Hỗ trợ kéo thả (drag & drop)\n• Có thể xem trước và xóa ảnh\n• Ảnh đầu tiên sẽ làm ảnh đại diện",

    "google maps":
      "Để thêm bản đồ Google Maps:\n1. Truy cập Google Maps\n2. Tìm địa chỉ bất động sản\n3. Nhấn 'Chia sẻ' → 'Nhúng bản đồ'\n4. Sao chép mã iframe\n5. Dán vào trường 'Nhúng Google Maps' khi đăng tin",

    "lượt xem":
      "Lượt xem được tính khi:\n• Người dùng truy cập trang chi tiết BĐS\n• Mỗi IP chỉ tính 1 lượt xem/ngày\n• Bạn có thể xem số lượt xem trong 'Quản lý bài đăng'\n• Lượt xem cao giúp BĐS hiển thị ưu tiên hơn",

    "badge xác thực":
      "Badge xác thực xuất hiện khi:\n• Admin đã kiểm tra và xác nhận BĐS\n• Tài liệu pháp lý đầy đủ\n• Thông tin chính xác\n• Giúp tăng độ tin cậy với người mua",

    realtime:
      "Hệ thống hỗ trợ realtime cho:\n• Tin nhắn chat\n• Thông báo tin nhắn mới\n• Trạng thái online/offline\n• Cập nhật số lượt xem\n• Thông báo khi có người quan tâm BĐS",
  }

  // Quick actions
  const quickActions = [
    { text: "Hướng dẫn đăng tin", action: "guide_post" },
    { text: "Cách tìm kiếm BĐS", action: "guide_search" },
    { text: "Tìm nhà bán", action: "search_house" },
    { text: "Tìm đất bán", action: "search_land" },
    { text: "Liên hệ hỗ trợ", action: "contact" },
  ]

  useEffect(() => {
    // Load property types and provinces for search functionality
    const loadData = async () => {
      try {
        const [typesRes, provincesRes] = await Promise.all([
          axios.get(`${API_URL}/property-types`),
          axios.get(`${API_URL}/locations/provinces`),
        ])
        setPropertyTypes(typesRes.data)
        setProvinces(provincesRes.data)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = (text, sender = "user") => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const simulateTyping = () => {
    setIsTyping(true)
    setTimeout(
      () => {
        setIsTyping(false)
      },
      1000 + Math.random() * 1000,
    )
  }

  const findBestFAQMatch = (userInput) => {
    const input = userInput.toLowerCase()

    // Exact keyword matches
    for (const [keyword, answer] of Object.entries(faqData)) {
      if (input.includes(keyword)) {
        return answer
      }
    }

    // Fuzzy matching for common variations
    if (input.includes("đăng") && (input.includes("bài") || input.includes("tin"))) {
      return faqData["đăng tin"]
    }
    if (input.includes("tìm") && input.includes("kiếm")) {
      return faqData["tìm kiếm"]
    }
    if (input.includes("thích") || input.includes("lưu")) {
      return faqData["yêu thích"]
    }
    if (input.includes("nhắn") || input.includes("chat")) {
      return faqData["tin nhắn"]
    }
    if (input.includes("sửa") || input.includes("chỉnh")) {
      return faqData["chỉnh sửa bài đăng"]
    }

    return null
  }

  const extractSearchParams = (userInput) => {
    const input = userInput.toLowerCase()
    const params = {}

    // Property types with more variations
    const propertyTypeMap = {
      nhà: ["nhà", "house", "villa", "biệt thự"],
      đất: ["đất", "land", "lô đất", "mảnh đất"],
      "chung cư": ["chung cư", "apartment", "căn hộ", "condo"],
      shophouse: ["shophouse", "shop house", "nhà phố"],
      "văn phòng": ["văn phòng", "office", "tòa nhà"],
    }

    // Enhanced property type detection
    for (const [type, variations] of Object.entries(propertyTypeMap)) {
      if (variations.some((variation) => input.includes(variation))) {
        const foundType = propertyTypes.find((t) => t.TenLoai?.toLowerCase().includes(type))
        if (foundType) params.loaiBDS = foundType.MaLoai
        break
      }
    }

    // Enhanced location detection with more cities
    const locationMap = {
      "hà nội": ["hà nội", "hanoi", "hn"],
      "hồ chí minh": ["hồ chí minh", "hcm", "sài gòn", "saigon", "tp hcm"],
      "đà nẵng": ["đà nẵng", "da nang"],
      "hải phòng": ["hải phòng", "hai phong"],
      "cần thơ": ["cần thơ", "can tho"],
    }

    for (const [city, variations] of Object.entries(locationMap)) {
      if (variations.some((variation) => input.includes(variation))) {
        const foundProvince = provinces.find((p) => p.TenTinh?.toLowerCase().includes(city))
        if (foundProvince) params.tinh = foundProvince.MaTinh
        break
      }
    }

    // Enhanced price detection with more formats
    const pricePatterns = [
      /(\d+(?:\.\d+)?)\s*(tỷ|ty|billion)/gi,
      /(\d+(?:\.\d+)?)\s*(triệu|tr|million)/gi,
      /(\d+(?:\.\d+)?)\s*(nghìn|k|thousand)/gi,
    ]

    const prices = []
    pricePatterns.forEach((pattern) => {
      const matches = [...input.matchAll(pattern)]
      matches.forEach((match) => {
        const num = Number.parseFloat(match[1])
        const unit = match[2].toLowerCase()

        if (unit.includes("tỷ") || unit.includes("ty") || unit.includes("billion")) {
          prices.push(num * 1000000000)
        } else if (unit.includes("triệu") || unit.includes("tr") || unit.includes("million")) {
          prices.push(num * 1000000)
        } else if (unit.includes("nghìn") || unit.includes("k") || unit.includes("thousand")) {
          prices.push(num * 1000)
        }
      })
    })

    if (prices.length >= 2) {
      params.giaMin = Math.min(...prices)
      params.giaMax = Math.max(...prices)
    } else if (prices.length === 1) {
      if (input.includes("dưới") || input.includes("nhỏ hơn") || input.includes("tối đa")) {
        params.giaMax = prices[0]
      } else if (input.includes("trên") || input.includes("lớn hơn") || input.includes("tối thiểu")) {
        params.giaMin = prices[0]
      }
    }

    // Area detection
    const areaMatch = input.match(/(\d+(?:\.\d+)?)\s*(m2|mét vuông|m²)/gi)
    if (areaMatch) {
      const areas = areaMatch.map((a) => Number.parseFloat(a))
      if (areas.length >= 2) {
        params.dienTichMin = Math.min(...areas)
        params.dienTichMax = Math.max(...areas)
      } else if (areas.length === 1) {
        if (input.includes("dưới") || input.includes("nhỏ hơn")) {
          params.dienTichMax = areas[0]
        } else if (input.includes("trên") || input.includes("lớn hơn")) {
          params.dienTichMin = areas[0]
        }
      }
    }

    return params
  }

  const handleQuickAction = (action) => {
    switch (action) {
      case "guide_post":
        addMessage("Hướng dẫn đăng tin")
        setTimeout(() => {
          simulateTyping()
          setTimeout(() => addMessage(faqData["đăng tin"], "bot"), 1500)
        }, 500)
        break
      case "guide_search":
        addMessage("Cách tìm kiếm BĐS")
        setTimeout(() => {
          simulateTyping()
          setTimeout(() => addMessage(faqData["tìm kiếm"], "bot"), 1500)
        }, 500)
        break
      case "search_house":
        addMessage("Tìm nhà bán")
        setTimeout(() => {
          simulateTyping()
          setTimeout(() => {
            addMessage("Tôi sẽ giúp bạn tìm nhà bán. Đang chuyển đến trang tìm kiếm...", "bot")
            setTimeout(() => {
              const houseType = propertyTypes.find((t) => t.TenLoai?.toLowerCase().includes("nhà"))
              const params = new URLSearchParams()
              if (houseType) params.append("loaiBDS", houseType.MaLoai)
              navigate(`/tim-kiem?${params.toString()}`)
              setIsOpen(false)
            }, 1000)
          }, 1500)
        }, 500)
        break
      case "search_land":
        addMessage("Tìm đất bán")
        setTimeout(() => {
          simulateTyping()
          setTimeout(() => {
            addMessage("Tôi sẽ giúp bạn tìm đất bán. Đang chuyển đến trang tìm kiếm...", "bot")
            setTimeout(() => {
              const landType = propertyTypes.find((t) => t.TenLoai?.toLowerCase().includes("đất"))
              const params = new URLSearchParams()
              if (landType) params.append("loaiBDS", landType.MaLoai)
              navigate(`/tim-kiem?${params.toString()}`)
              setIsOpen(false)
            }, 1000)
          }, 1500)
        }, 500)
        break
      case "contact":
        addMessage("Liên hệ hỗ trợ")
        setTimeout(() => {
          simulateTyping()
          setTimeout(() => addMessage(faqData["liên hệ"], "bot"), 1500)
        }, 500)
        break
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = inputMessage.trim()
    addMessage(userMessage)
    setInputMessage("")

    try {
      setTimeout(() => {
        simulateTyping()

        setTimeout(async () => {
          // Enhanced search handling with better parameter extraction
          if (
            userMessage.toLowerCase().includes("tìm") ||
            userMessage.toLowerCase().includes("search") ||
            userMessage.toLowerCase().includes("cần") ||
            userMessage.toLowerCase().includes("muốn mua") ||
            userMessage.toLowerCase().includes("muốn thuê")
          ) {
            const searchParams = extractSearchParams(userMessage)

            if (Object.keys(searchParams).length > 0) {
              let responseText = "Tôi đã phân tích yêu cầu của bạn:\n\n"

              if (searchParams.loaiBDS) {
                const propertyType = propertyTypes.find((t) => t.MaLoai === searchParams.loaiBDS)
                responseText += `• Loại BĐS: ${propertyType?.TenLoai}\n`
              }

              if (searchParams.tinh) {
                const province = provinces.find((p) => p.MaTinh === searchParams.tinh)
                responseText += `• Địa điểm: ${province?.TenTinh}\n`
              }

              if (searchParams.giaMin || searchParams.giaMax) {
                responseText += `• Khoảng giá: ${searchParams.giaMin ? (searchParams.giaMin / 1000000000).toFixed(1) + " tỷ" : "Không giới hạn"} - ${searchParams.giaMax ? (searchParams.giaMax / 1000000000).toFixed(1) + " tỷ" : "Không giới hạn"}\n`
              }

              responseText += "\nĐang chuyển đến trang kết quả tìm kiếm..."

              addMessage(responseText, "bot")

              setTimeout(() => {
                const queryString = new URLSearchParams(searchParams).toString()
                navigate(`/tim-kiem?${queryString}`)
                setIsOpen(false)
              }, 2000)
              return
            } else {
              addMessage("Tôi sẽ giúp bạn tìm kiếm bất động sản. Đang chuyển đến trang tìm kiếm nâng cao...", "bot")
              setTimeout(() => {
                navigate("/tim-kiem")
                setIsOpen(false)
              }, 1500)
              return
            }
          }

          // Enhanced FAQ matching
          const faqAnswer = findBestFAQMatch(userMessage)
          if (faqAnswer) {
            addMessage(faqAnswer, "bot")

            // Add follow-up suggestions
            setTimeout(() => {
              addMessage(
                "Bạn có cần hỗ trợ thêm gì khác không? Tôi có thể giúp bạn:\n• Tìm kiếm bất động sản\n• Hướng dẫn đăng tin\n• Giải đáp thắc mắc khác",
                "bot",
              )
            }, 1000)
            return
          }

          // Enhanced default response with suggestions
          addMessage(
            "Tôi hiểu bạn đang cần hỗ trợ. Dưới đây là những gì tôi có thể giúp bạn:\n\n" +
              "🏠 **Tìm kiếm BĐS:**\n" +
              "• 'Tìm nhà bán ở Hà Nội dưới 5 tỷ'\n" +
              "• 'Cần đất 100m2 ở Đà Nẵng'\n\n" +
              "📝 **Hướng dẫn sử dụng:**\n" +
              "• Cách đăng tin\n" +
              "• Cách tìm kiếm\n" +
              "• Quản lý yêu thích\n\n" +
              "💬 **Hỗ trợ khác:**\n" +
              "• Xác thực bài đăng\n" +
              "• Sử dụng tin nhắn\n" +
              "• Liên hệ admin\n\n" +
              "Hãy thử hỏi cụ thể hơn nhé!",
            "bot",
          )
        }, 1500)
      }, 500)
    } catch (error) {
      console.error("Chatbot error:", error)
      addMessage("Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.", "bot")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mở trợ lý ảo"
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-avatar">
              <FaRobot />
            </div>
            <div className="chatbot-info">
              <h3>Trợ lý ảo BĐS</h3>
              <span className="chatbot-status">Đang hoạt động</span>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Đóng chat">
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-message ${message.sender === "bot" ? "bot" : "user"}`}>
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="chatbot-quick-actions">
            {quickActions.map((action, index) => (
              <button key={index} className="quick-action-btn" onClick={() => handleQuickAction(action.action)}>
                {action.text}
              </button>
            ))}
          </div>

          <div className="chatbot-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              rows="1"
              className="chatbot-textarea"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="chatbot-send"
              aria-label="Gửi tin nhắn"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot
