# DANH SÁCH LỖI VÀ VẤN ĐỀ KỸ THUẬT CẦN KHẮC PHỤC

> **CẬP NHẬT TRẠNG THÁI**: Toàn bộ các vấn đề kỹ thuật dưới đây **ĐÃ ĐƯỢC XỬ LÝ TRIỆT ĐỂ**. Chi tiết kiểm thử và giải pháp thực tế được lưu tại [06-resolution-log.md](file:///B:/DACN%20(1)/DACS-BDSTC/project-review/06-resolution-log.md).

---

## 1. Lỗi Nghiêm Trọng / Chặn Thực Thi (Blocking Issues)

### 🔴 Lỗi 1: Backend bị Crash ngay khi khởi động nếu thiếu `GOOGLE_CLIENT_ID`
- **Vị trí**: `real-estate-backend/config/passport.js` (dòng 5–11), được gọi từ `server.js` (dòng 12).
- **Hiện tượng**:
  Khi chạy `node server.js` nếu biến môi trường `GOOGLE_CLIENT_ID` hoặc `GOOGLE_CLIENT_SECRET` để trống hoặc chưa cấu hình trong `.env`, thư viện `passport-google-oauth20` sẽ ném ngoại lệ chưa được bắt:
  ```text
  Error: OAuth2Strategy requires a clientID option
  ```
  Lỗi này làm tiến trình Node.js sập ngay lập tức, ngăn cản toàn bộ backend khởi động (dù nhà phát triển chỉ muốn test các tính năng không dùng Google Login).
- **Giải pháp đã thực hiện**: [ĐÃ KHẮC PHỤC] Đã bổ sung điều kiện kiểm tra an toàn trong `passport.js` và route `auth.js`. Nếu thiếu key, server chỉ cảnh báo warning và tạm dừng login Google mà không làm sập ứng dụng.

---

### 🔴 Lỗi 2: Tên file có khoảng trắng bất thường tại Backend Utils
- **Vị trí**: `real-estate-backend/utils/coordinateConverter .js` (có khoảng trắng trước phần mở rộng `.js`).
- **Hiện tượng**:
  Tên file chứa ký tự khoảng trắng thừa (`"coordinateConverter .js"`). Điều này gây lỗi trên các môi trường CI/CD, hệ điều hành Linux/Docker hoặc khi thực hiện lệnh `require("./utils/coordinateConverter")`.
- **Giải pháp đã thực hiện**: [ĐÃ KHẮC PHỤC] Đã đổi tên chuẩn thành `coordinateConverter.js`.

---

### 🔴 Lỗi 3: Xung đột cấu hình `package.json` và `node_modules` ở thư mục gốc
- **Vị trí**: `B:\DACN (1)\DACS-BDSTC\package.json` và `node_modules/` tại Root.
- **Hiện tượng**:
  File `package.json` ở root khai báo `"name": "real-estate-frontend"`, dùng phiên bản React 18, trong khi thư mục con `real-estate-frontend` thực tế lại sử dụng React 19 và Tailwind.
  Khi nhà phát triển mở terminal ở thư mục gốc và chạy lệnh `npm start` hoặc `npm install`, hệ thống sẽ cài đặt và chạy phiên bản rác ở root, gây xung đột phiên bản dependencies cực kỳ khó chịu.
- **Giải pháp đã thực hiện**: [ĐÃ KHẮC PHỤC] Đã xóa toàn bộ `node_modules/` và `package-lock.json` thừa ở root. Viết lại `package.json` ở root thành bộ điều khiển thông minh (`npm run start:backend`, `npm run start:frontend`, `npm run install:all`).

---

## 2. Lỗi và Rủi ro Cấu hình (Configuration & Security Issues)

### 🟠 Lỗi 4: Lộ thông tin nhạy cảm và phụ thuộc cứng MySQL Localhost
- **Vị trí**: `real-estate-backend/.env`
- **Hiện tượng**:
  File `.env` chứa thông tin kết nối DB cứng (`root@localhost:3306`, tên DB `datn_bdstc`). Nếu dịch vụ MySQL chưa chạy hoặc chưa import database từ `querydb.txt`, backend sẽ liên tục bắn lỗi `ECONNREFUSED`.
- **Giải pháp đã thực hiện**: [ĐÃ KHẮC PHỤC] Đã tạo `database_init.sql` chuẩn, cung cấp đầy đủ file `.env.example`, đồng thời trong `config/db.js` đã bắt lỗi `ECONNREFUSED` và in ra thông báo chỉ dẫn debug chi tiết.

---

### 🟠 Lỗi 5: Sai lệch kiến trúc Dependencies ở Frontend
- **Vị trí**: `real-estate-frontend/package.json`
- **Hiện tượng**:
  Frontend khai báo các thư viện chạy phía server hoặc không phù hợp:
  - `bcrypt`: Thư viện C++ Native Binding chuyên dùng hash mật khẩu phía Node.js, không chạy được trên browser.
  - `jsonwebtoken`: Thư viện ký token phía backend (ở frontend chỉ cần `jwt-decode`).
  - `adm-zip`: Thư viện zip của Node.js (dùng cho các file script ETL).
  - Khai báo đồng thời `@tailwindcss/vite` (v4) cùng với `tailwindcss` (v3) và `react-scripts` (Webpack), gây cảnh báo xung đột cấu hình build.
- **Giải pháp đã thực hiện**: [ĐÃ KHẮC PHỤC] Đã gỡ bỏ toàn bộ `bcrypt`, `jsonwebtoken`, `adm-zip`, `@tailwindcss/vite` khỏi `real-estate-frontend/package.json`.

---

## 3. Lỗi Tiềm Ẩn Trong Code (Code Quality & Runtime Warnings)

### 🟡 Lỗi 6: Các script ETL Node.js nằm sai vị trí trong Frontend `src/`
- **Vị trí**: `real-estate-frontend/src/scripts/` (`extract_provinces.js`, `parseKmlToJson.js`, `processAllQuyHoach.js`, `split_geojson_by_province.js`).
- **Hiện tượng**:
  Thư mục `src/` của React dùng để chứa mã nguồn do Webpack biên dịch. Nhưng 4 file trên là các script Node.js dùng lệnh `require("fs")`, `require("path")`. Nếu vô tình bị import vào component React, Webpack 5 sẽ ném lỗi ngay: `Module not found: Error: Can't resolve 'fs'`.
- **Giải pháp đã thực hiện**: [ĐÃ KHẮC PHỤC] Đã chuyển toàn bộ 4 script ra thư mục độc lập `tools/gis-scripts/` kèm tài liệu hướng dẫn `README.md`.

---

### 🟡 Lỗi 7: Hardcode URL localhost không đồng nhất
- **Vị trí**: Rải rác trong các file frontend (`http://localhost:5000`) và backend cors (`http://localhost:3000`).
- **Hiện tượng**:
  Nhiều component gọi trực tiếp `axios.get("http://localhost:5000/api/...")` thay vì đọc từ biến môi trường `process.env.REACT_APP_API_URL`.
- **Giải pháp đã thực hiện**: [ĐÃ KHẮC PHỤC] Đã xây dựng `src/services/api.js` cấu hình Axios Instance tập trung với `baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'` và tự động đính kèm JWT Bearer token.

