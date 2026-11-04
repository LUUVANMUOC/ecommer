// src/config/sepayConfig.js
const isSandbox = (process.env.SEPAY_ENV || 'sandbox') === 'sandbox';

module.exports = {
  isSandbox,
  // Domain API đối soát
  apiBaseUrl: isSandbox
    ? 'https://userapi-sandbox.sepay.vn'
    : 'https://userapi.sepay.vn',
  apiToken: process.env.SEPAY_API_TOKEN || '',
  // HMAC secret để xác thực webhook
  webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || '',
  // Tiền tố mã QR (dùng trong nội dung chuyển khoản)
  qrPrefix: 'TT',
};