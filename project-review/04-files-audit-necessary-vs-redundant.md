# BẢNG PHÂN LOẠI FILE: CẦN THIẾT VS KHÔNG CẦN THIẾT / THỪA THÃI

Tài liệu này rà soát toàn bộ các tệp tin trong dự án để phục vụ việc dọn dẹp, tái cấu trúc (refactoring) mà không làm ảnh hưởng đến tính toàn vẹn của ứng dụng.

---

## 1. Thư mục Gốc (Root Level)

| Đường dẫn / Tên file | Trạng thái | Đánh giá & Khuyến nghị |
|:---|:---:|:---|
| `package.json` (root) | ❌ **Thừa / Gây hại** | File rác bản sao cũ của frontend. Cần xóa hoặc viết lại thành root script điều khiển cả 2 service. |
| `package-lock.json` (root) | ❌ **Thừa** | Đi kèm với `package.json` rác ở root, cần xóa. |
| `node_modules/` (root) | ❌ **Thừa / Tốn dung lượng** | Chiếm hàng trăm MB không phục vụ đúng mục đích, cần xóa để tiết kiệm bộ nhớ. |
| `querydb.txt` | ✅ **Rất Cần Thiết** | Chứa toàn bộ cấu trúc bảng và dữ liệu mẫu MySQL (`datn_bdstc`). Khuyến nghị đổi tên thành `init-database.sql` cho đúng chuẩn. |
| `README.md` (root) | ⚠️ **Cần Cập Nhật** | Hiện tại chỉ có 34 bytes (trống rỗng). Cần bổ sung hướng dẫn cài đặt và khởi chạy. |
| `.vscode/` | 🔄 **Tùy Chọn** | Chứa cấu hình IDE làm việc nhóm của VS Code, có thể giữ lại. |

---

## 2. Phân loại Backend (`real-estate-backend`)

### A. Nhóm Tệp Cần Thiết (Essential)
- `server.js`: Khởi tạo Express app, middleware, routes, socket.io.
- `socket.js`: Xử lý phòng chat, gửi nhận tin nhắn trực tiếp qua websocket.
- `config/db.js`: Khởi tạo MySQL Connection Pool.
- `config/passport.js`: Cấu hình Google OAuth.
- `config/nodemailer.js`: Cấu hình gửi mail OTP / thông báo.
- `middleware/authenticateToken.js`: Kiểm tra Bearer JWT & quyền hạn.
- `middleware/uploadMessage.js`: Cấu hình Multer lưu file tin nhắn.
- Toàn bộ các file trong `routes/`:
  - `auth.js`, `properties.js`, `property-types.js`, `locations.js`, `users.js`, `messages.js`, `favorites.js`, `recommendations.js`, `search.js`, `admin.js`, `verification.js`, `momo-payment.js`.
- `uploads/`: Thư mục chứa dữ liệu media của người dùng tải lên.

### B. Nhóm Tệp Thừa / Cần Điều Chỉnh
- `utils/coordinateConverter .js`:
  - ⚠️ **Lỗi tên file**: Chứa khoảng trắng.
  - ❓ **Tình trạng sử dụng**: Hiện không có file route nào trong backend import file này (Frontend đã có file `coordinateConverter.js` riêng). Nếu backend không cần tính toán tọa độ, file này có thể xóa hoặc đổi tên và tích hợp khi cần.
- `.env.example`: Cần bổ sung thêm các biến mẫu đang có trong `.env` thực tế (như `GOOGLE_CLIENT_ID`, `DB_HOST`, `DB_NAME`, `SESSION_SECRET`...).

---

## 3. Phân loại Frontend (`real-estate-frontend`)

### A. Nhóm Tệp Cần Thiết (Essential)
- **Cấu hình & Điểm vào**: `src/index.js`, `src/App.js`, `src/App.css`, `src/index.css`.
- **Contexts**: `src/context/AuthContext.js`, `src/context/SocketContext.js`.
- **Custom Hooks**: `src/hooks/useGISLogic.js`, `src/hooks/usePropertyLogic.js`.
- **Services & Utils**:
  - `services/locationService.js`, `services/userService.js`.
  - `utils/coordinateConverter.js`, `utils/gisUtils.js`, `utils/kmzLoader.js`, `utils/planningDataLoader.js`, `utils/pointInPolygon.js`, `utils/provinceMapping.js`, `utils/textNormalizer.js`, `utils/nominatimService.js`, `utils/osmRoutingService.js`, `utils/overpassService.js`.
- **Components Cốt lõi** (48 components):
  - Phục vụ toàn bộ các màn hình chính: `Home`, `Navbar`, `Footer`, `Post`, `PostForm`, `PropertyDetail`, `MapPage`, `AdminPanel`, `MessageCenter`, `LoginRegister`, `Favorites`, `BrokerProfile`, `SearchResults`...
- **Dữ liệu tĩnh công khai (`public/`)**:
  - `public/data/`: File GeoJSON ranh giới 63 tỉnh thành Việt Nam (phục vụ bản đồ).
  - `public/quyhoach/`: Dữ liệu quy hoạch GIS (được `PlanningOverlay.js` tải động).

### B. Nhóm Tệp Thừa / Sai vị trí / Cần Dọn Dẹp
- `src/scripts/` (`extract_provinces.js`, `parseKmlToJson.js`, `processAllQuyHoach.js`, `split_geojson_by_province.js`):
  - ❌ **ĐÃ XỬ LÝ**: Đã chuyển toàn bộ ra thư mục độc lập `tools/gis-scripts/`.
- `src/styles/` (Toàn bộ 36 files CSS tĩnh):
  - ❌ **ĐÃ XỬ LÝ**: Đã xóa bỏ toàn bộ thư mục `src/styles/` sau khi chuyển đổi 100% các component sang **Tailwind CSS thuần**.
- Các components mồ côi / thừa không dùng đến (`PriceRangeChart.js`, `PriceSearchForm.js`, `PriceSummary.js`, `PriceTrendChart.js`, `RegionalPriceComparison.js`, `Properties.js`, `SearchBar.js`):
  - ❌ **ĐÃ XỬ LÝ**: Đã xóa bỏ hoàn toàn khỏi dự án.
- `src/logo.svg`, `src/reportWebVitals.js`, `src/setupTests.js`, `src/App.test.js`:
  - ⚠️ **Template mặc định của Create-React-App**: Nếu dự án không viết Unit Test bằng Jest và không dùng logo CRA thì có thể dọn dẹp để code gọn gàng hơn.
- `package.json` của frontend:
  - ⚠️ Cần gỡ bỏ `bcrypt`, `jsonwebtoken`, `adm-zip` vì không thuộc phạm vi mã nguồn browser (Đã gỡ bỏ).
