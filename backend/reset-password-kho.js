// backend/reset-password-kho.js
// Chạy: node reset-password-kho.js
const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

const NEW_PASSWORD = '12345678';

(async () => {
  try {
    console.log(`🔐 Đang reset mật khẩu tất cả kho về: "${NEW_PASSWORD}"`);

    // 1. Hash 1 lần, dùng chung cho tất cả
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(NEW_PASSWORD, salt);

    // 2. Đếm trước
    const countRes = await pool.query(`SELECT COUNT(*) FROM kho`);
    const total = parseInt(countRes.rows[0].count, 10);
    console.log(`📊 Tổng số kho: ${total}`);

    if (total === 0) {
      console.log('⚠️  Không có kho nào để cập nhật.');
      return;
    }

    // 3. Update tất cả
    const result = await pool.query(
      `UPDATE kho SET kho_hashpass = $1 RETURNING kho_ma, kho_ten`,
      [hash]
    );

    console.log(`✅ Đã cập nhật ${result.rowCount} kho:`);
    result.rows.forEach((k) => {
      console.log(`   - ${k.kho_ma} | ${k.kho_ten}`);
    });

    console.log(`\n🎉 Xong! Mật khẩu mới: ${NEW_PASSWORD}`);
    console.log(`   Hash mẫu: ${hash.substring(0, 20)}...`);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();