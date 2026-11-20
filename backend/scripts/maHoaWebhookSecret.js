// backend/scripts/maHoaWebhookSecret.js
//
// Mã hoá các webhook secret CŨ đang lưu plaintext trong DB.
// An toàn: mặc định chỉ XEM TRƯỚC, không ghi gì.
//
//   cd backend
//   node scripts/maHoaWebhookSecret.js           # xem trước
//   node scripts/maHoaWebhookSecret.js --apply   # ghi thật
//
// Yêu cầu: đã đặt SEPAY_ENC_KEY trong backend/.env (32 bytes base64).
'use strict';

const pool = require('../src/config/db'); // db.js tự nạp .env
const { encrypt } = require('../src/config/secretCrypto');

// Bảng nào đang lưu secret dạng plaintext
const CAC_BANG = [
  { ten: 'thongtinnhantien_gianhang', cot: 'sepay_webhook_secret' },
  { ten: 'thongtinnhantien_dvvc', cot: 'sepay_webhook_secret' },
  { ten: 'thongtinnhantien_stmdt', cot: 'sepay_webhook_secret' },
];

const apply = process.argv.includes('--apply');

(async () => {
  if (!process.env.SEPAY_ENC_KEY) {
    console.error('❌ Thiếu SEPAY_ENC_KEY trong backend/.env — không thể mã hoá.');
    console.error('   Tạo khoá: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
    process.exitCode = 1;
    return;
  }

  console.log(apply ? '🚀 CHẾ ĐỘ GHI THẬT (--apply)' : '👀 CHẾ ĐỘ XEM TRƯỚC (thêm --apply để ghi)');

  for (const bang of CAC_BANG) {
    const { ten, cot } = bang;

    const res = await pool.query(
      `SELECT ${cot} AS secret FROM ${ten}
        WHERE ${cot} IS NOT NULL
          AND ${cot} <> ''
          AND ${cot} NOT LIKE 'v1.%'`
    );

    const giaTri = [...new Set(res.rows.map((r) => r.secret))];
    console.log(`\n📦 ${ten}: ${res.rowCount} dòng plaintext (${giaTri.length} giá trị khác nhau)`);

    if (!apply) continue;

    for (const plain of giaTri) {
      const enc = encrypt(plain);
      if (!enc || enc === plain) continue;

      const kq = await pool.query(
        `UPDATE ${ten} SET ${cot} = $1 WHERE ${cot} = $2`,
        [enc, plain]
      );
      console.log(`   ✅ mã hoá ${kq.rowCount} dòng`);
    }
  }

  if (!apply) console.log('\nℹ️  Chưa ghi gì. Chạy lại với --apply để mã hoá thật.');
  await pool.end();
})().catch(async (error) => {
  console.error('❌ Lỗi:', error.message);
  await pool.end();
  process.exitCode = 1;
});
