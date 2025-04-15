const mysql = require('mysql2');
require('dotenv').config(); // Load biến môi trường từ .env

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

connection.connect(err => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ', err);
        return;
    }
    console.log('✅ Kết nối MySQL thành công!');
});

module.exports = connection;
