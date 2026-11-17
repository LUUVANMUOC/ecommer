const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Ưu tiên dùng DATABASE_URL nếu có
const poolConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
      }
    : {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASS,
          port: process.env.DB_PORT,
          ssl: { rejectUnauthorized: false }
      };

console.log("🔥 ĐANG KẾT NỐI DB BẰNG:", process.env.DATABASE_URL ? "DATABASE_URL" : "CÁC BIẾN RỜI");

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    console.log('Kết nối PostgreSQL thành công!');
});

pool.on('error', (err) => {
    console.error('Lỗi kết nối Database:', err.message);
});

module.exports = pool;