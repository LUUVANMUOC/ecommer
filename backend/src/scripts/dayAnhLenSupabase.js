// backend/src/scripts/dayAnhLenSupabase.js
// Đẩy toàn bộ ảnh cũ trong backend/public/uploads lên Supabase Storage.
//
//   node src/scripts/dayAnhLenSupabase.js --dry-run
//   node src/scripts/dayAnhLenSupabase.js
//   node src/scripts/dayAnhLenSupabase.js --force                 (ghi đè file đã có)
//   node src/scripts/dayAnhLenSupabase.js --thu-muc=san_pham      (chỉ 1 thư mục)
//   node src/scripts/dayAnhLenSupabase.js --dong-thoi=8           (số luồng song song)
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fs = require('fs');
const storage = require('../config/supabaseStorage');

// Script luôn cần Supabase, kể cả khi .env đang để driver=local
if (String(process.env.STORAGE_DRIVER || '').toLowerCase() === 'local') {
  process.env.STORAGE_DRIVER = 'supabase';
  console.log('ℹ️  .env đang để STORAGE_DRIVER=local -> script tạm dùng supabase.');
}

const THU_MUC_GOC = path.resolve(__dirname, '../../public/uploads');

const thamSo = process.argv.slice(2);
const layCo = (ten) => thamSo.includes(ten);
const layGiaTri = (ten, macDinh) => {
  const t = thamSo.find((x) => x.startsWith(`${ten}=`));
  return t ? t.slice(ten.length + 1) : macDinh;
};

const DRY = layCo('--dry-run');
const FORCE = layCo('--force');
const CHI_THU_MUC = layGiaTri('--thu-muc', '').trim();
const DONG_THOI = Math.max(1, Math.min(16, Number(layGiaTri('--dong-thoi', '6')) || 6));
const THU_MUC_QUET = CHI_THU_MUC ? path.join(THU_MUC_GOC, CHI_THU_MUC) : THU_MUC_GOC;

const lietKeFile = (thuMuc, ketQua) => {
  let ds;
  try {
    ds = fs.readdirSync(thuMuc, { withFileTypes: true });
  } catch (_) {
    return;
  }
  ds.forEach((muc) => {
    const duongDan = path.join(thuMuc, muc.name);
    if (muc.isDirectory()) lietKeFile(duongDan, ketQua);
    else if (muc.isFile()) ketQua.push(duongDan);
  });
};

const keyCua = (duongDan) => path.relative(THU_MUC_GOC, duongDan).split(path.sep).join('/');

const thongKe = { tong: 0, coSan: 0, moi: 0, loi: 0, byte: 0 };
const loiChiTiet = [];
let soDaInRa = 0;

const chay = async () => {
  const tt = storage.thongTin();
  if (!tt.bat) {
    console.error('❌ Chưa bật được Supabase Storage.');
    console.error(
      `   driver=${tt.driver} | có SUPABASE_URL=${tt.coUrl} | có SERVICE_ROLE_KEY=${tt.coKhoa}`
    );
    if (tt.loiKhoiTao) console.error(`   lý do: ${tt.loiKhoiTao}`);
    console.error(
      '   -> Kiểm tra STORAGE_DRIVER / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_BUCKET trong backend/.env'
    );
    process.exit(1);
  }

  if (!fs.existsSync(THU_MUC_QUET)) {
    console.error(`❌ Không thấy thư mục: ${THU_MUC_QUET}`);
    process.exit(1);
  }

  const ds = [];
  lietKeFile(THU_MUC_QUET, ds);
  thongKe.tong = ds.length;

  console.log(`📦 Bucket: ${tt.bucket}`);
  console.log(`📂 Quét: ${THU_MUC_QUET}`);
  console.log(`🔢 Tìm thấy ${ds.length} file | song song: ${DONG_THOI}`);
  if (DRY) console.log('🔍 DRY-RUN: chỉ liệt kê, KHÔNG upload');
  if (FORCE) console.log('♻️  --force: ghi đè cả file đã có trên bucket');
  console.log('');

  const boKiemTra = storage.taoBoKiemTra();
  let viTri = 0;

  const xuLyMot = async (duongDan) => {
    const key = keyCua(duongDan);
    let kichThuoc = 0;
    try {
      kichThuoc = fs.statSync(duongDan).size;
    } catch (_) {
      /* bỏ qua */
    }

    try {
      if (!FORCE && (await boKiemTra(key))) {
        thongKe.coSan += 1;
        return;
      }

      if (DRY) {
        thongKe.moi += 1;
        thongKe.byte += kichThuoc;
        if (soDaInRa < 20) {
          console.log(`   + ${key}`);
          soDaInRa += 1;
        } else if (soDaInRa === 20) {
          console.log('   ... (các file còn lại không in ra)');
          soDaInRa += 1;
        }
        return;
      }

      await storage.taiLen(duongDan, key);
      thongKe.moi += 1;
      thongKe.byte += kichThuoc;
    } catch (e) {
      thongKe.loi += 1;
      loiChiTiet.push({ key, loi: e.message });
      console.error(`❌ ${key}: ${e.message}`);
    }
  };

  const nguoiLam = async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chiSo = viTri;
      viTri += 1;
      if (chiSo >= ds.length) return;

      await xuLyMot(ds[chiSo]);

      const daXong = thongKe.coSan + thongKe.moi + thongKe.loi;
      if (!DRY && daXong % 100 === 0) {
        console.log(
          `⏳ ${daXong}/${ds.length} | mới: ${thongKe.moi} | có sẵn: ${thongKe.coSan} | lỗi: ${thongKe.loi}`
        );
      }
    }
  };

  const batDau = Date.now();
  await Promise.all(Array.from({ length: DONG_THOI }, nguoiLam));

  const giay = ((Date.now() - batDau) / 1000).toFixed(1);
  console.log('\n===== KẾT QUẢ =====');
  console.log(`Tổng file          : ${thongKe.tong}`);
  console.log(`Đã upload          : ${thongKe.moi}`);
  console.log(`Đã có sẵn (bỏ qua) : ${thongKe.coSan}`);
  console.log(`Lỗi                : ${thongKe.loi}`);
  console.log(`Dung lượng         : ${(thongKe.byte / 1048576).toFixed(2)} MB`);
  console.log(`Thời gian          : ${giay}s`);

  if (loiChiTiet.length) {
    console.log('\n--- 20 lỗi đầu tiên ---');
    loiChiTiet.slice(0, 20).forEach((x) => console.log(`- ${x.key}: ${x.loi}`));
    process.exitCode = 1;
  }
};

chay().catch((e) => {
  console.error('❌ Lỗi không xử lý được:', e);
  process.exit(1);
});
