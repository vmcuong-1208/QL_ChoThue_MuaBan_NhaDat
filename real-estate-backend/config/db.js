const mysql = require('mysql2');
require('dotenv').config(); // Load biến môi trường từ .env

// Sử dụng Connection Pool thay vì single connection để tự động reconnect và xử lý đa luồng an toàn
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'QUANLYTHUEMUABANNHADAT',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Lỗi kết nối MySQL: ', err.message);
        console.warn('💡 Gợi ý: Hãy đảm bảo MySQL Server (XAMPP / MySQL Workbench) đã bật và database "' + (process.env.DB_NAME || 'QUANLYTHUEMUABANNHADAT') + '" đã sẵn sàng.');
        return;
    }
    console.log('✅ Kết nối MySQL (Connection Pool) thành công!');
    connection.release();
});

module.exports = pool;
