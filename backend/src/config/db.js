// src/config/db.js
const { Pool } = require('pg');
const path = require('path');

// Đảm bảo load đúng file .env ở thư mục gốc backend
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Thêm log để kiểm tra biến môi trường đã được nạp chưa
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS có tồn tại không?:", !!process.env.DB_PASS);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME, // Lưu ý: trong .env của bạn là DB_NAME
    password: process.env.DB_PASS, // Lưu ý: trong .env của bạn là DB_PASS
    port: process.env.DB_PORT,
});

pool.on('connect', () => {
    console.log('Kết nối PostgreSQL thành công!');
});

pool.on('error', (err) => {
    console.error('Lỗi kết nối Database:', err.message);
});

// SỬA LẠI DÒNG NÀY: Export thẳng instance pool ra ngoài
// Thay vì chỉ export hàm query, ta export cả object pool để có thể dùng pool.connect()
module.exports = pool; 