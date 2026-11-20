// backend/scripts/xoaDuLieuSuCo.js
//
// Xoá TOÀN BỘ dữ liệu phát sinh của nghiệp vụ "xử lý sự cố" để tạo lại từ đầu:
// phiếu sự cố, lịch sử trạng thái, trách nhiệm, minh chứng, khoản hoàn tiền,
// QR nhận tiền, tiền giữ hộ và thông báo liên quan.
//
// KHÔNG xoá danh mục: loaisuco, trangthaixulysuco, loaisuco_chuthe...
// KHÔNG đụng tới đơn hàng, người dùng, tài khoản nhận tiền.
//
// Cách dùng (chạy trong thư mục backend):
//   node scripts/xoaDuLieuSuCo.js                 # xem trước, KHÔNG xoá gì
//   node scripts/xoaDuLieuSuCo.js --xoa           # xoá thật (có transaction)
//   node scripts/xoaDuLieuSuCo.js --xoa --xoa-tep # xoá luôn ảnh/PDF minh chứng
//
// Tuỳ chọn:
//   --giu-thong-bao   giữ lại thông báo sự cố (mặc định xoá)
//
// Lưu ý: script tự tắt SSL khi DB ở localhost, bật SSL khi DB ở xa.
'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const XOA = process.argv.includes('--xoa');
const XOA_TEP = process.argv.includes('--xoa-tep');
const GIU_THONG_BAO = process.argv.includes('--giu-thong-bao');

const THU_MUC_TEP = path.resolve(__dirname, '../public/uploads/suco');

// Thứ tự xoá: bảng con trước, bảng cha sau (tránh vi phạm khoá ngoại).
const CAC_BANG = [
  ['qr_hoan_tien', 'QR nhận tiền của khoản hoàn tiền'],
  ['hoantien', 'Khoản hoàn tiền / bồi thường'],
  ['giu_tien_su_co', 'Tiền giữ hộ của sự cố'],
  ['chitiettrangthaisuco', 'Lịch sử trạng thái phiếu'],
  ['chiutrachnhiemsuco', 'Trách nhiệm các bên'],
  ['minhchungsuco', 'Tệp minh chứng sự cố'],
  ['yeucauxulysuco', 'Phiếu yêu cầu xử lý sự cố'],
];

const DIEU_KIEN_THONG_BAO = `
  tb_nguon_ma = 'SU_CO'
  OR tb_doituong_loai = 'SU_CO'
  OR tb_nhom = 'SU_CO'
  OR tb_link LIKE '%/su-co/%'
`;

const laLocal = (host) =>
  !host || /^(localhost|127\.0\.0\.1|::1)$/i.test(String(host));

const cauHinhDb = () => {
  const host = process.env.DB_HOST || 'localhost';
  const ssl = laLocal(host) ? false : { rejectUnauthorized: false };

  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl };
  }

  return {
    user: process.env.DB_USER,
    host,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: Number(process.env.DB_PORT || 5432),
    ssl,
  };
};

const demBang = async (client, bang, dieuKien = '') => {
  const sql = `SELECT count(*)::int AS so FROM ${bang}${dieuKien ? ` WHERE ${dieuKien}` : ''}`;
  const r = await client.query(sql);
  return r.rows[0]?.so || 0;
};

const demTep = () => {
  try {
    return fs.readdirSync(THU_MUC_TEP).filter((ten) => {
      const duongDan = path.join(THU_MUC_TEP, ten);
      return fs.statSync(duongDan).isFile();
    });
  } catch (error) {
    return [];
  }
};

const inTieuDe = () => {
  console.log('==================================================');
  console.log(' XOÁ DỮ LIỆU XỬ LÝ SỰ CỐ');
  console.log('==================================================');
};

(async () => {
  inTieuDe();
  console.log(
    XOA
      ? '🚀 CHẾ ĐỘ XOÁ THẬT (--xoa)'
      : '👀 CHẾ ĐỘ XEM TRƯỚC — chưa xoá gì. Thêm --xoa để xoá thật.'
  );
  console.log(
    GIU_THONG_BAO ? 'ℹ️  Giữ lại thông báo sự cố.' : 'ℹ️  Sẽ xoá cả thông báo sự cố.'
  );

  const client = new Client(cauHinhDb());
  await client.connect();

  try {
    console.log('\n📊 Dữ liệu hiện có:');
    for (const [bang, moTa] of CAC_BANG) {
      const so = await demBang(client, bang);
      console.log(`   ${bang.padEnd(24)} ${String(so).padStart(6)}  ${moTa}`);
    }

    if (!GIU_THONG_BAO) {
      const soTb = await demBang(client, 'thongbao', DIEU_KIEN_THONG_BAO);
      console.log(`   ${'thongbao (sự cố)'.padEnd(24)} ${String(soTb).padStart(6)}  Thông báo`);
    }

    const tep = demTep();
    console.log(`   ${'uploads/suco'.padEnd(24)} ${String(tep.length).padStart(6)}  Tệp minh chứng trên đĩa`);

    if (!XOA) {
      console.log('\nℹ️  Chưa ghi gì. Chạy lại với --xoa để xoá thật.');
      if (XOA_TEP) console.log('   (--xoa-tep chỉ có tác dụng khi có --xoa)');
      return;
    }

    console.log('\n🗑️  Đang xoá trong 1 transaction...');
    await client.query('BEGIN');

    for (const [bang, moTa] of CAC_BANG) {
      const r = await client.query(`DELETE FROM ${bang}`);
      console.log(`   ✅ ${bang.padEnd(24)} xoá ${String(r.rowCount).padStart(6)} dòng  ${moTa}`);
    }

    if (!GIU_THONG_BAO) {
      const r = await client.query(
        `DELETE FROM thongbao WHERE ${DIEU_KIEN_THONG_BAO}`
      );
      console.log(`   ✅ ${'thongbao (sự cố)'.padEnd(24)} xoá ${String(r.rowCount).padStart(6)} dòng`);
    }

    await client.query(
      `ALTER SEQUENCE IF EXISTS giu_tien_su_co_gtsc_id_seq RESTART WITH 1`
    );

    await client.query('COMMIT');
    console.log('\n✅ Đã xoá xong (đã COMMIT).');

    if (XOA_TEP) {
      let soXoa = 0;
      for (const ten of tep) {
        try {
          fs.rmSync(path.join(THU_MUC_TEP, ten), { force: true });
          soXoa += 1;
        } catch (error) {
          console.warn(`   ⚠️  Không xoá được tệp ${ten}: ${error.message}`);
        }
      }
      console.log(`🗑️  Đã xoá ${soXoa}/${tep.length} tệp minh chứng trong uploads/suco.`);
    } else if (tep.length) {
      console.log(
        `ℹ️  Còn ${tep.length} tệp minh chứng trên đĩa. Thêm --xoa-tep nếu muốn xoá luôn.`
      );
    }

    console.log('\n📊 Kiểm tra lại:');
    for (const [bang] of CAC_BANG) {
      const so = await demBang(client, bang);
      console.log(`   ${bang.padEnd(24)} ${String(so).padStart(6)}`);
    }
    if (!GIU_THONG_BAO) {
      const soTb = await demBang(client, 'thongbao', DIEU_KIEN_THONG_BAO);
      console.log(`   ${'thongbao (sự cố)'.padEnd(24)} ${String(soTb).padStart(6)}`);
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // bỏ qua
    }
    console.error('\n❌ Lỗi, đã ROLLBACK — không thay đổi dữ liệu:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error('❌ Không kết nối được DB:', error.message);
  process.exitCode = 1;
});
