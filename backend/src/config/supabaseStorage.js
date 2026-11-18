// backend/src/config/supabaseStorage.js
// =====================================================================
//  LƯU TRỮ ẢNH 2 CHẾ ĐỘ: đĩa local (cache) + Supabase Storage (bền)
//  - DB vẫn lưu "/uploads/<folder>/<file>" -> KHÔNG sửa DB, KHÔNG sửa frontend
//  - Thiếu env Supabase -> tự tắt, chạy y hệt code cũ
// =====================================================================
'use strict';

const path = require('path');

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

let client = null;
let daThuKhoiTao = false;
let loiKhoiTao = null;
let daCanhBaoNgoac = false;

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

// Cắt khoảng trắng + dấu ngoặc kép dán kèm khi copy env từ dashboard
const sachGiaTri = (v) => {
  let s = String(v ?? '').trim();
  const dau = s[0];
  const cuoi = s[s.length - 1];
  if (s.length >= 2 && ((dau === '"' && cuoi === '"') || (dau === "'" && cuoi === "'"))) {
    s = s.slice(1, -1).trim();
    if (!daCanhBaoNgoac) {
      daCanhBaoNgoac = true;
      console.warn('⚠️  [STORAGE] Biến môi trường có dấu ngoặc kép ở đầu/cuối -> đã tự cắt bỏ.');
    }
  }
  return s;
};

const cauHinh = () => {
  const driver = sachGiaTri(process.env.STORAGE_DRIVER || 'auto').toLowerCase();
  return {
    driver: ['local', 'supabase', 'auto'].includes(driver) ? driver : 'auto',
    url: sachGiaTri(process.env.SUPABASE_URL || '').replace(/\/+$/, ''),
    khoa: sachGiaTri(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
    bucket: sachGiaTri(process.env.SUPABASE_BUCKET || 'uploads') || 'uploads',
    maxMb: Number(sachGiaTri(process.env.SUPABASE_MAX_MB || 0)) || 0,
    failFast: sachGiaTri(process.env.STORAGE_FAIL_FAST ?? 'true').toLowerCase() !== 'false',
  };
};

const chuanHoaKey = (key) =>
  String(key || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter((p) => p && p !== '.' && p !== '..')
    .join('/');

const doanMime = (key, mimetype) => {
  if (mimetype && mimetype !== 'application/octet-stream') return mimetype;
  return MIME[path.extname(key).toLowerCase()] || 'application/octet-stream';
};

// Khởi tạo client (gọi nhiều lần cũng chỉ chạy 1 lần)
const bat = () => {
  const c = cauHinh();
  if (c.driver === 'local') return false;
  if (client) return true;
  if (daThuKhoiTao) return false;
  daThuKhoiTao = true;

  if (!c.url || !c.khoa) {
    loiKhoiTao = 'Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY';
    if (c.driver === 'supabase') {
      console.error(`❌ [STORAGE] ${loiKhoiTao} -> ảnh chỉ lưu trên đĩa (sẽ mất khi deploy)`);
    }
    return false;
  }

  let createClient;
  try {
    ({ createClient } = require('@supabase/supabase-js'));
  } catch (_) {
    loiKhoiTao = 'Chưa cài @supabase/supabase-js (chạy: npm i @supabase/supabase-js)';
    if (c.driver === 'supabase') console.error('❌ [STORAGE] ' + loiKhoiTao);
    return false;
  }

  try {
    client = createClient(c.url, c.khoa, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    console.log(`📦 [STORAGE] Supabase Storage đã bật (bucket "${c.bucket}")`);
    return true;
  } catch (e) {
    client = null;
    loiKhoiTao = e.message;
    if (c.driver === 'supabase') console.error('❌ [STORAGE] Khởi tạo thất bại:', e.message);
    return false;
  }
};

const daBat = () => Boolean(client) || bat();

// Cho phép thử lại từ đầu (dùng cho endpoint chẩn đoán khi env vừa được sửa)
const khoiTaoLai = () => {
  client = null;
  daThuKhoiTao = false;
  loiKhoiTao = null;
  daCanhBaoNgoac = false;
};

const urlCongKhai = (key) => {
  const sach = chuanHoaKey(key);
  if (!sach) return null;
  const c = cauHinh();
  if (!c.url) return null;
  if (client) return client.storage.from(c.bucket).getPublicUrl(sach).data.publicUrl;
  return `${c.url}/storage/v1/object/public/${c.bucket}/${sach}`;
};

// Đẩy 1 file lên bucket. key: "<folder>/<filename>"
const taiLen = async (duongDanFile, key, mimetype) => {
  if (!bat()) return null;
  const c = cauHinh();
  const sach = chuanHoaKey(key);
  if (!sach) throw new Error('Key rỗng, không thể upload');

  let noiDung;
  try {
    noiDung = await require('fs').promises.readFile(duongDanFile);
  } catch (e) {
    throw new Error(`Không đọc được file ${duongDanFile}: ${e.message}`);
  }

  if (c.maxMb > 0 && noiDung.length > c.maxMb * 1024 * 1024) {
    const loi = new Error(
      `File vượt quá ${c.maxMb}MB (${(noiDung.length / 1048576).toFixed(2)}MB): ${sach}`
    );
    loi.code = 'FILE_TOO_LARGE';
    throw loi;
  }

  let loiCuoi = null;
  for (let lan = 1; lan <= 3; lan += 1) {
    const { error } = await client.storage.from(c.bucket).upload(sach, noiDung, {
      contentType: doanMime(sach, mimetype),
      upsert: true,
      cacheControl: '31536000',
    });
    if (!error) return urlCongKhai(sach);

    loiCuoi = error;
    const thongBao = String(error.message || '');
    if (/bucket not found|invalid (jwt|api ?key)|unauthorized|permission/i.test(thongBao)) break;
    await cho(400 * lan);
  }

  throw new Error(`Supabase từ chối "${sach}": ${loiCuoi ? loiCuoi.message : 'không rõ'}`);
};

const xoa = async (key) => {
  if (!bat()) return false;
  const c = cauHinh();
  const sach = chuanHoaKey(key);
  if (!sach) return false;
  const { error } = await client.storage.from(c.bucket).remove([sach]);
  if (error) {
    console.error(`⚠️  [STORAGE] Không xoá được "${sach}":`, error.message);
    return false;
  }
  return true;
};

// Ghi thử 1 file nhỏ rồi xoá ngay: dùng để biết bucket có THẬT SỰ ghi được không
const thuGhi = async () => {
  khoiTaoLai();
  if (!daBat()) {
    return { ok: false, loi: loiKhoiTao || 'Storage chưa bật (thiếu env hoặc STORAGE_DRIVER=local)' };
  }
  const c = cauHinh();
  const key = `_health/thu-ghi-${Date.now()}.txt`;
  try {
    const noiDung = Buffer.from(`self-test ${new Date().toISOString()}`, 'utf8');
    const { error } = await client.storage.from(c.bucket).upload(key, noiDung, {
      contentType: 'text/plain',
      upsert: true,
    });
    if (error) return { ok: false, key, loi: error.message };

    const { error: loiXoa } = await client.storage.from(c.bucket).remove([key]);
    return {
      ok: true,
      key,
      url: urlCongKhai(key),
      daXoa: !loiXoa,
      loiXoa: loiXoa ? loiXoa.message : null,
    };
  } catch (e) {
    return { ok: false, key, loi: e.message };
  }
};

// "/uploads/san_pham/a.jpg" -> "san_pham/a.jpg"
const keyTuLink = (link) => {
  if (!link || typeof link !== 'string' || !link.startsWith('/uploads/')) return null;
  const sach = link.split('?')[0].split('#')[0];
  return chuanHoaKey(sach.slice('/uploads/'.length)) || null;
};

// Bộ kiểm tra "đã có trên bucket" có cache theo thư mục (1 lần list/thư mục)
const taoBoKiemTra = () => {
  const cache = new Map();
  return async (key) => {
    if (!bat()) return false;
    const c = cauHinh();
    const sach = chuanHoaKey(key);
    const idx = sach.lastIndexOf('/');
    const thuMuc = idx >= 0 ? sach.slice(0, idx) : '';
    const ten = idx >= 0 ? sach.slice(idx + 1) : sach;

    if (!cache.has(thuMuc)) {
      const tap = new Set();
      let offset = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await client.storage
          .from(c.bucket)
          .list(thuMuc, { limit: 100, offset });
        if (error) throw new Error(`Không list được "${thuMuc}": ${error.message}`);
        (data || []).forEach((m) => tap.add(m.name));
        if (!data || data.length < 100) break;
        offset += data.length;
      }
      cache.set(thuMuc, tap);
    }
    return cache.get(thuMuc).has(ten);
  };
};

const thongTin = () => {
  const c = cauHinh();
  return {
    driver: c.driver,
    bat: daBat(),
    bucket: c.bucket,
    maxMb: c.maxMb,
    failFast: c.failFast,
    loiKhoiTao,
    coUrl: Boolean(c.url),
    coKhoa: Boolean(c.khoa),
    url: c.url || null,
    khoaDau: c.khoa ? `${c.khoa.slice(0, 6)}…` : null,
    khoaDai: c.khoa.length,
    node: process.version,
    pid: process.pid,
    uptimeGiay: Math.round(process.uptime()),
  };
};

module.exports = {
  cauHinh,
  bat,
  daBat,
  khoiTaoLai,
  taiLen,
  xoa,
  thuGhi,
  urlCongKhai,
  keyTuLink,
  chuanHoaKey,
  taoBoKiemTra,
  thongTin,
};
