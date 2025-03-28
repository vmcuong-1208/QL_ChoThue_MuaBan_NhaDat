require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình middleware
app.use(cors());
app.use(express.json()); // Đọc dữ liệu JSON từ request body

// Kết nối MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'QUANLYTHUEMUABANNHADAT'
});

// Kiểm tra kết nối
db.connect(err => {
  if (err) {
    console.error('Lỗi kết nối MySQL:', err);
  } else {
    console.log('✅ Kết nối MySQL thành công!');
  }
});

// Route kiểm tra server
app.get('/', (req, res) => {
  res.send('🚀 Backend Bất động sản đang chạy!');
});

// Lắng nghe server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
