const mysql = require('mysql2');
require('dotenv').config(); // Load biến môi trường từ .env

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'datn_bdstc'
});

connection.connect(err => {
    if (err) {
        console.error('❌ Lỗi kết nối MySQL: ', err.message);
        console.warn('💡 Gợi ý: Hãy đảm bảo MySQL Server (XAMPP / MySQL Workbench) đã bật và database "' + (process.env.DB_NAME || 'datn_bdstc') + '" đã được import từ file "querydb.txt" (hoặc "init-database.sql").');
        return;
    }
    console.log('✅ Kết nối MySQL thành công!');
});

module.exports = connection;
