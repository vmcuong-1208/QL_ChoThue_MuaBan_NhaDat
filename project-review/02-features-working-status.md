# DANH SÁCH CÁC TÍNH NĂNG ĐANG HOẠT ĐỘNG (WORKING FEATURES)

Dựa trên việc kiểm tra toàn diện mã nguồn Client và Server, các phân hệ nghiệp vụ sau đã được triển khai hoàn chỉnh về mặt logic và có thể vận hành khi môi trường được đáp ứng đủ (MySQL + cấu hình Env):

---

## 1. Phân hệ Xác thực & Quản lý Tài khoản (Authentication & Users)
- **Đăng ký / Đăng nhập thường**:
  - Mã hóa mật khẩu bằng `bcrypt`.
  - Cấp phát JWT token cho các yêu cầu kế tiếp.
  - Hỗ trợ gửi mã OTP qua email xác nhận thông qua `nodemailer`.
  - Quên mật khẩu / Đặt lại mật khẩu qua email token/OTP.
- **Xác thực Google OAuth2**:
  - Đã tích hợp luồng Passport Google OAuth phía backend và callback frontend (`GoogleAuthSuccess.js`).
- **Phân quyền người dùng (RBAC)**:
  - Phân loại tài khoản: Người dùng thường, Môi giới (Broker), Admin.
  - Phân quyền trang qua `ProtectedRoute.js`.
- **Hồ sơ cá nhân & Trang Môi giới**:
  - Chỉnh sửa thông tin cá nhân, avatar.
  - Xem trang hồ sơ công khai của môi giới kèm các tin đăng liên quan (`BrokerProfile.js`).

---

## 2. Phân hệ Bất động sản (Properties Management)
- **Đăng tin & Cập nhật tin BĐS (`PostForm.js`, `routes/properties.js`)**:
  - Cho phép nhập đầy đủ thông tin: Tiêu đề, mô tả, mức giá, diện tích, số phòng, pháp lý, loại BĐS.
  - Upload nhiều ảnh (`multer` lưu trữ vào `uploads/properties/`) và hỗ trợ video mô tả.
  - Chọn tọa độ địa lý trực tiếp trên bản đồ hoặc nhập tọa độ VN-2000 / WGS-84 (`GPSLocationPicker.js`, `CoordinateInput.js`).
- **Danh sách & Chi tiết tin BĐS**:
  - Hiển thị danh sách thẻ tin, phân trang, sắp xếp theo giá/thời gian.
  - Trang chi tiết tin đăng (`PropertyDetail.js`): slider ảnh, xem video, thông tin môi giới, thông tin quy hoạch khu vực.
  - Quản lý tin cá nhân (`Post.js`): Xem trạng thái tin (chờ duyệt, đã duyệt, từ chối), chỉnh sửa, xóa tin.

---

## 3. Phân hệ Bản đồ & Không gian Quy hoạch (GIS & Maps)
- **Tích hợp Google Maps**:
  - Hiển thị vị trí các bất động sản trên bản đồ số (`GoogleMapComponent.js`).
  - Lọc nhanh BĐS theo bán kính và vùng nhìn thấy trên bản đồ.
- **Hiển thị lớp Quy hoạch xây dựng/đất đai**:
  - Tải và kết xuất các lớp ranh giới địa chính 63 tỉnh/thành (`public/data/`).
  - Đọc và hiển thị lớp dữ liệu quy hoạch GeoJSON/KML (`PlanningOverlay.js`, `public/quyhoach/`).
  - Kiểm tra điểm BĐS nằm trong vùng quy hoạch nào bằng thuật toán `turf.booleanPointInPolygon` (`useGISLogic.js`).
- **Tiện ích xung quanh & Tìm đường**:
  - Tích hợp dịch vụ tra cứu địa điểm xung quanh (trường học, bệnh viện, chợ) qua OSM/Overpass API (`NearbyPlacesPanel.js`, `overpassService.js`).
  - Tìm đường và tính toán lộ trình di chuyển (`DirectionsPanel.js`, `osmRoutingService.js`).

---

## 4. Phân hệ Tương tác & Giao tiếp (Chat & Socket.io)
- **Nhắn tin thời gian thực (Real-time Messaging)**:
  - Kết nối WebSocket qua Socket.io giữa người mua và người bán/môi giới (`socket.js`, `SocketContext.js`, `MessageCenter.js`).
  - Lưu trữ lịch sử tin nhắn trong cơ sở dữ liệu (`routes/messages.js`).
  - Hỗ trợ gửi tệp/ảnh đính kèm trong hộp thoại chat (`uploadMessage.js`).
- **Chatbot hỗ trợ tự động**:
  - Hộp chat trợ lý tự động (`ChatBot.js`, tích hợp `@botpress/webchat` hoặc bot định sẵn) xuất hiện tại trang chủ.
- **Danh sách BĐS Yêu thích (Wishlist)**:
  - Thêm, xóa, xem danh sách tin lưu trữ yêu thích gắn liền với tài khoản (`routes/favorites.js`, `Favorites.js`).

---

## 5. Phân hệ Thanh toán & Gói dịch vụ (Payment Gateway)
- **Thanh toán MoMo**:
  - Khởi tạo giao dịch thanh toán MoMo Sandbox (`routes/momo-payment.js`).
  - Hỗ trợ tạo mã QR hoặc redirect sang cổng MoMo.
  - Xử lý phản hồi thanh toán qua IPN callback (`/api/momo-payment/callback`) và chuyển hướng giao diện người dùng (`MoMoCallback.js`, `PaymentSuccess.js`).

---

## 6. Phân hệ Quản trị (Admin Panel)
- **Bảng điều khiển quản trị (`AdminPanel.js`, `routes/admin.js`)**:
  - Thống kê tổng số tin đăng, tổng người dùng, giao dịch thanh toán.
  - Duyệt hoặc từ chối bài đăng BĐS mới.
  - Quản lý tài khoản người dùng: khóa/mở tài khoản, phân quyền (`UserManager.js`).
  - Duyệt hồ sơ xác minh danh tính môi giới (`VerificationManager.js`).
  - Quản lý danh mục loại bất động sản (`PropertyTypeManager.js`).
