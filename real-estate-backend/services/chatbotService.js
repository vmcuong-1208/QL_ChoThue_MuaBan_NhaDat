const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

// Khởi tạo Gemini
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Tìm kiếm các bất động sản liên quan trong database để đưa vào context AI
 */
const searchRelevantProperties = async (userMessage) => {
  try {
    const text = userMessage.toLowerCase();
    
    // Tự động phân loại nhu cầu thuê hay mua
    const isRental = text.includes("thuê") || text.includes("cho thuê") || text.includes("phòng trọ");
    const trangThai = isRental ? "cho thuê" : "đang bán";

    // Truy vấn tối đa 5 BĐS mới nhất và phù hợp
    const [rows] = await db.promise().query(
      `SELECT p.MaTTND, p.TieuDe, p.Gia, p.DienTich, p.DiaChi, l.TenLoaiND as LoaiBDS, p.TrangThai
       FROM THONGTINNHADAT p
       LEFT JOIN LOAINHADAT l ON p.MaLoaiND = l.MaLoaiND
       WHERE p.TrangThai = ?
       ORDER BY p.NgayTao DESC
       LIMIT 6`,
      [trangThai]
    );

    return rows || [];
  } catch (error) {
    console.error("Lỗi khi tìm BĐS liên quan cho AI:", error);
    return [];
  }
};

/**
 * Xử lý tin nhắn người dùng và trả về phản hồi từ AI
 */
const chatWithAI = async ({ message, history = [] }) => {
  const gemini = getGeminiClient();

  // Tìm các BĐS liên quan từ database để nạp vào prompt
  const matchedProperties = await searchRelevantProperties(message);

  let propertiesContext = "";
  if (matchedProperties.length > 0) {
    propertiesContext = `\nDANH SÁCH BẤT ĐỘNG SẢN THỰC TẾ TRÊN HỆ THỐNG ĐỂ BẠN THAM KHẢO VÀ GỢI Ý CHO KHÁCH (nếu khách hỏi tìm mua/thuê):\n` +
      matchedProperties.map((p, idx) => {
        const giaText = p.Gia >= 1000000000
          ? `${(p.Gia / 1000000000).toFixed(1)} tỷ`
          : `${(p.Gia / 1000000).toFixed(0)} triệu`;
        return `${idx + 1}. [Mã #${p.MaTTND}] ${p.TieuDe} - Loại: ${p.LoaiBDS || 'BĐS'} - Giá: ${giaText} - Diện tích: ${p.DienTich} m² - Địa chỉ: ${p.DiaChi} (Link chi tiết: /bat-dong-san/${p.MaTTND})`;
      }).join("\n");
  }

  // Nếu chưa có API KEY, dùng Fallback chuyên nghiệp thông minh
  if (!gemini) {
    return {
      text: generateFallbackResponse(message, matchedProperties),
      suggestedProperties: matchedProperties.slice(0, 3),
      isFallback: true,
    };
  }

  try {
    // Sử dụng model gemini-1.5-flash hoặc gemini-2.0-flash
    const model = gemini.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Bạn là "Trợ lý AI Bất Động Sản 3MAN" - một chuyên viên tư vấn bất động sản thông minh, chuyên nghiệp, thân thiện và am hiểu luật pháp tại Việt Nam.

Nhiệm vụ của bạn:
1. Tư vấn mua bán, thuê bất động sản, phân tích giá cả và tiềm năng khu vực.
2. Giải đáp thắc mắc về pháp lý nhà đất: sổ đỏ, sổ hồng, công chứng, hợp đồng cọc, sang tên, và tọa độ VN2000 / ranh giới thửa đất.
3. Hướng dẫn sử dụng các tính năng website:
   - Cách đăng tin bài mới: Vào "Quản lý bài đăng" -> "Đăng tin mới", nhập thông tin và tọa độ VN2000.
   - Bản đồ số & quy hoạch: Vào trang "Bản đồ" (/ban-do) để xem bản đồ vệ tinh, tra cứu quy hoạch và ranh giới.
   - Dò khoảng cách & chỉ đường: Trong chi tiết bài đăng, có sẵn công cụ dò khoảng cách và mở Google Maps dẫn đường.
4. Khi khách hỏi tìm nhà/đất/phòng trọ, hãy gợi ý các bất động sản phù hợp trong danh sách dữ liệu được cung cấp dưới đây, kèm theo link dạng: /bat-dong-san/{MaTTND}.

Phong cách trả lời:
- Luôn trả lời bằng tiếng Việt lịch sự, tự nhiên, ngắn gọn, súc tích (khoảng 2-4 đoạn hoặc có gạch đầu dòng rõ ràng).
- Thân thiện, tôn trọng khách hàng, có icon emoji sinh động.
- Nếu không chắc chắn về pháp lý phức tạp, hãy khuyên khách hàng kiểm tra tại văn phòng công chứng hoặc cơ quan tài nguyên môi trường.

${propertiesContext}`
    });

    // Chuyển đổi lịch sử chat cho Gemini format
    const chat = model.startChat({
      history: history.slice(-6).map((h) => ({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return {
      text: responseText,
      suggestedProperties: matchedProperties.slice(0, 3),
      isFallback: false,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Nếu gọi Gemini gặp lỗi (quota, key không hợp lệ...), trả về fallback an toàn
    return {
      text: generateFallbackResponse(message, matchedProperties),
      suggestedProperties: matchedProperties.slice(0, 3),
      isFallback: true,
      error: error.message,
    };
  }
};

/**
 * Trình phản hồi thông minh dự phòng (Khi chưa cấu hình API Key hoặc quá tải)
 */
const generateFallbackResponse = (message, properties = []) => {
  const text = message.toLowerCase();

  if (text.includes("chào") || text.includes("hello") || text.includes("hi")) {
    return "Xin chào bạn! 👋 Tôi là Trợ lý AI Bất Động Sản 3MAN. Tôi có thể hỗ trợ bạn tìm nhà đất, tư vấn thủ tục pháp lý sổ đỏ, tra cứu tọa độ VN2000 hoặc hướng dẫn đăng tin. Bạn đang quan tâm đến vấn đề gì?";
  }

  if (text.includes("vn2000") || text.includes("tọa độ") || text.includes("ranh giới")) {
    return "📍 **Về Tọa độ VN2000 & Ranh giới thửa đất:**\n\n• Hệ tọa độ VN2000 là hệ quy chiếu quốc gia thể hiện trên trích lục sổ đỏ/sổ hồng (các cột X, Y).\n• Khi đăng tin, bạn nhập các điểm góc X, Y vào mục VN2000, hệ thống sẽ tự động vẽ khung viền thửa đất màu đỏ trên bản đồ vệ tinh.\n• Người mua có thể dò khoảng cách từ vị trí của họ đến thửa đất và mở Google Maps chỉ đường turn-by-turn!";
  }

  if (text.includes("sổ đỏ") || text.includes("sổ hồng") || text.includes("pháp lý") || text.includes("công chứng")) {
    return "📑 **Thủ tục pháp lý & Sang tên nhà đất:**\n\n1. **Đặt cọc**: Lập hợp đồng cọc rõ ràng các điều khoản cam kết không tranh chấp, không quy hoạch giải tỏa.\n2. **Công chứng**: Cả hai bên mang CMND/CCCD, Sổ hộ khẩu (hoặc xác nhận cư trú), Giấy xác nhận độc thân hoặc Đăng ký kết hôn, bản gốc Sổ đỏ/Sổ hồng.\n3. **Kê khai thuế**: Nộp thuế TNCN (2%) và lệ phí trước bạ (0.5%) tại Chi cục Thuế.\n4. **Đăng bộ sang tên**: Nhận sổ mới tại Văn phòng Đăng ký đất đai.";
  }

  if (text.includes("đăng tin") || text.includes("đăng bài")) {
    return "🏠 **Hướng dẫn đăng tin bất động sản:**\n\n1. Đăng nhập tài khoản của bạn trên hệ thống.\n2. Chọn **Đăng tin** trên thanh menu.\n3. Điền thông tin giá bán/cho thuê, diện tích, địa chỉ.\n4. Nhập tọa độ VN2000 (nếu có sổ đỏ) hoặc ghim tọa độ GPS.\n5. Tải ảnh thực tế và ảnh sổ đỏ/giấy tờ rồi nhấn **Đăng tin**.";
  }

  if (text.includes("tìm") || text.includes("mua") || text.includes("thuê") || text.includes("giá")) {
    if (properties.length > 0) {
      let reply = "Dưới đây là một số bất động sản mới nhất trên hệ thống phù hợp với nhu cầu của bạn:\n\n";
      properties.slice(0, 3).forEach((p, idx) => {
        const giaText = p.Gia >= 1000000000
          ? `${(p.Gia / 1000000000).toFixed(1)} tỷ`
          : `${(p.Gia / 1000000).toFixed(0)} triệu`;
        reply += `${idx + 1}. **${p.TieuDe}**\n   - Giá: ${giaText} • Diện tích: ${p.DienTich} m²\n   - Địa chỉ: ${p.DiaChi}\n\n`;
      });
      reply += "👉 Bạn có thể bấm vào mục **Tìm kiếm** hoặc **Bản đồ** trên thanh menu để xem chi tiết và lọc kỹ hơn nhé!";
      return reply;
    }
  }

  return "Cảm ơn câu hỏi của bạn! Tôi có thể tư vấn chuyên sâu về:\n\n• 🏠 **Tìm kiếm nhà đất / phòng trọ**: Gợi ý BĐS theo tầm giá và khu vực.\n• 📑 **Pháp lý BĐS**: Thủ tục đặt cọc, công chứng mua bán, sang tên sổ đỏ.\n• 🗺️ **Bản đồ & Tọa độ VN2000**: Cách đọc tọa độ trên sổ và xem chỉ đường.\n• ✍️ **Hỗ trợ đăng tin**: Quy trình đăng tin và xác thực giấy tờ.\n\n*(💡 Mẹo: Thêm GEMINI_API_KEY vào .env để kích hoạt chế độ suy luận AI toàn diện)*";
};

module.exports = {
  chatWithAI,
};
