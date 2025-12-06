# DACS-BDSTC - HỆ THỐNG THÔNG TIN BẤT ĐỘNG SẢN & QUY HOẠCH GIS

Dự án Bất động sản tích hợp bản đồ quy hoạch số, nhắn tin trực tuyến và thanh toán MoMo.

---

## 📁 Cấu trúc Dự án
- `real-estate-backend/`: Máy chủ API Node.js/Express, kết nối MySQL, Socket.IO, JWT, Passport.
- `real-estate-frontend/`: Ứng dụng Web React 19, Google Maps API, Turf.js, Tailwind CSS.
- `tools/gis-scripts/`: Bộ công cụ xử lý dữ liệu KML / GeoJSON quy hoạch offline.
- `project-review/`: Báo cáo đánh giá toàn diện, nhật ký khắc phục và audit mã nguồn.
- `database_init.sql` (hoặc `querydb.txt`): File script SQL khởi tạo cơ sở dữ liệu `datn_bdstc`.

---

## 🚀 Hướng Dẫn Cài Đặt và Khởi Chạy

### 1. Chuẩn bị Cơ sở dữ liệu (MySQL)
1. Mở MySQL Server (XAMPP / MySQL Workbench / Docker).
2. Tạo cơ sở dữ liệu tên `datn_bdstc`.
3. Import file `database_init.sql` vào cơ sở dữ liệu `datn_bdstc`.

### 2. Cài đặt Dependencies
Từ thư mục gốc dự án:
```bash
# Cài đặt cho cả backend và frontend:
npm run install:all
```
Hoặc cài đặt thủ công trong từng thư mục:
```bash
cd real-estate-backend && npm install
cd ../real-estate-frontend && npm install
```

### 3. Cấu hình Biến môi trường (.env)
- **Backend**: Kiểm tra file `real-estate-backend/.env` (tham khảo `real-estate-backend/.env.example`).
  - Cập nhật thông tin kết nối DB (`DB_USER`, `DB_PASS`, `DB_NAME`).
  - Cập nhật JWT secret, MoMo keys hoặc Google OAuth nếu có.
- **Frontend**: Kiểm tra file `real-estate-frontend/.env` (tham khảo `real-estate-frontend/.env.example`).

### 4. Khởi chạy ứng dụng
Tại thư mục gốc dự án:
- Chạy Backend (Port 5000):
  ```bash
  npm run start:backend
  ```
- Chạy Frontend (Port 3000):
  ```bash
  npm run start:frontend
  ```

Ứng dụng web sẽ sẵn sàng tại địa chỉ: `http://localhost:3000`  
Server API hoạt động tại: `http://localhost:5000`
