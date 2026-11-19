// backend/src/config/secretCrypto.js
//
// Mã hoá các "secret" cần đọc lại nguyên văn (webhook HMAC secret).
// Không dùng hash được: server phải có đúng chuỗi gốc để tính HMAC.
//
// - Có SEPAY_ENC_KEY (32 bytes, base64) -> lưu dạng v1.<iv>.<tag>.<cipher>
// - Chưa cấu hình key -> giữ plaintext như cũ (chỉ cảnh báo, không làm sập app)
// - Dữ liệu cũ chưa mã hoá (không bắt đầu bằng "v1.") vẫn đọc được bình thường
'use strict';

const crypto = require('crypto');

let khoaDaNap = false;
let khoa = null;
let daCanhBaoThieuKhoa = false;

const layKhoa = () => {
  if (khoaDaNap) return khoa;
  khoaDaNap = true;

  const raw = process.env.SEPAY_ENC_KEY || '';
  if (!raw) {
    return null;
  }

  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    console.warn(
      '[secretCrypto] SEPAY_ENC_KEY phải là 32 bytes dạng base64 -> bỏ qua mã hoá.'
    );
    return null;
  }

  khoa = buf;
  return khoa;
};

const canhBaoThieuKhoa = () => {
  if (daCanhBaoThieuKhoa) return;
  daCanhBaoThieuKhoa = true;
  console.warn(
    '[secretCrypto] Chưa có SEPAY_ENC_KEY -> webhook secret đang lưu PLAINTEXT. ' +
      'Thêm biến môi trường này trên server để bật mã hoá AES-256-GCM.'
  );
};

/**
 * Mã hoá secret trước khi ghi DB.
 * @returns {string|null} chuỗi đã mã hoá, hoặc null nếu đầu vào rỗng.
 */
const encrypt = (plain) => {
  if (plain === null || plain === undefined) return null;

  const text = String(plain).trim();
  if (!text) return null;

  const key = layKhoa();
  if (!key) {
    canhBaoThieuKhoa();
    return text; // fallback: chưa cấu hình key
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return [
    'v1',
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
};

/**
 * Giải mã secret đọc từ DB. Tự tương thích dữ liệu cũ dạng plaintext.
 * @returns {string|null}
 */
const decrypt = (stored) => {
  if (stored === null || stored === undefined) return null;

  const value = String(stored);
  if (!value.startsWith('v1.')) return value; // dữ liệu cũ chưa mã hoá

  try {
    const [, ivB64, tagB64, ctB64] = value.split('.');

    const key = layKhoa();
    if (!key) {
      canhBaoThieuKhoa();
      return null;
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivB64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    console.warn('[secretCrypto] Giải mã secret thất bại:', error.message);
    return null;
  }
};

/**
 * Che secret khi trả về trình duyệt: chỉ giữ 4 ký tự cuối.
 * @returns {string|null} ví dụ "••••2i2T"
 */
const mask = (secret) => {
  if (!secret) return null;
  const value = String(secret);
  return `••••${value.slice(-4)}`;
};

module.exports = { encrypt, decrypt, mask };
