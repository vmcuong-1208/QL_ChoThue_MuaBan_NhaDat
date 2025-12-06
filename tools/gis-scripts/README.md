# HƯỚNG DẪN SỬ DỤNG CÁC SCRIPT XỬ LÝ DỮ LIỆU GIS (OFFLINE ETL TOOLS)

Thư mục này chứa các công cụ Node.js CLI độc lập dùng để tiền xử lý và trích xuất dữ liệu ranh giới địa chính cũng như các lớp quy hoạch từ file KML/GeoJSON sang định dạng chuẩn JSON cho dự án.

> **Lưu ý**: Các công cụ này chạy bằng môi trường Node.js trên máy (CLI), không phải là code chạy trong trình duyệt web của React.

---

## 1. Danh sách các script:
1. `extract_provinces.js`: Trích xuất danh sách và ranh giới các tỉnh/thành phố từ file bản đồ lớn.
2. `parseKmlToJson.js`: Chuyển đổi định dạng file quy hoạch KML sang định dạng GeoJSON/JSON để React Google Maps có thể hiển thị.
3. `processAllQuyHoach.js`: Tự động xử lý hàng loạt các file quy hoạch từ thư mục nguồn sang thư mục `public/quyhoach/` của frontend.
4. `split_geojson_by_province.js`: Cắt nhỏ file GeoJSON toàn quốc thành từng file nhỏ theo từng tỉnh/thành để tối ưu tải động trên web.

---

## 2. Cách chạy:
Cài đặt thư viện phụ trợ nếu cần (`npm install adm-zip @turf/turf @mapbox/togeojson`) và chạy trực tiếp bằng lệnh Node:
```bash
node tools/gis-scripts/processAllQuyHoach.js
```
