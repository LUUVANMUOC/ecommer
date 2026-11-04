// src/controllers/quanlykho/webhookSepayController.js
const crypto = require('crypto');
const { webhookSecret } = require('../../config/sepayConfig');
const TatToanModel = require('../../models/quanlykho/tatToanModel');

const WebhookSepayController = {
  handle: async (req, res) => {
    try {
      console.log('\n--- 🔔 NHẬN WEBHOOK TỪ SEPAY ---');

      if (!Buffer.isBuffer(req.body)) {
        console.log('❌ req.body không phải Buffer – kiểm tra lại express.raw() trong server.js');
        return res.status(500).json({ success: false, message: 'Body not raw' });
      }

      const rawBody = req.body.toString('utf8');
      const signature = req.headers['x-sepay-signature'] || '';
      const timestamp = req.headers['x-sepay-timestamp'] || '';

      console.log('👉 Timestamp:', timestamp);
      console.log('👉 Raw Body:', rawBody);
      console.log('👉 Signature nhận:', signature);

      if (!webhookSecret) {
        console.log('⚠️ Chưa cấu hình SEPAY_WEBHOOK_SECRET');
        return res.status(500).json({ success: false, message: 'Server misconfigured' });
      }

      // Làm sạch chữ ký: bỏ tiền tố "sha256=" nếu có
      const cleanSignature = signature.replace(/^sha256=/, '').trim();

      // ✅ TÍNH HMAC THEO ĐÚNG CÔNG THỨC CỦA SEPAY: HMAC(secret, timestamp + "." + rawBody)
      const dataToSign = `${timestamp}.${rawBody}`;
      const expected = crypto
        .createHmac('sha256', webhookSecret.trim())
        .update(dataToSign)
        .digest('hex');

      console.log('👉 Signature tính toán:', expected);

      const sigBuf = Buffer.from(cleanSignature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.log('❌ Chữ ký không khớp');
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }

      console.log('✅ Xác thực HMAC thành công!');

      // Parse payload và xử lý nghiệp vụ
      const payload = JSON.parse(rawBody);
      console.log('👉 Nội dung CK:', payload.content, '| Số tiền:', payload.transferAmount);

      const result = await TatToanModel.xuLyWebhook(payload);
      console.log('👉 Kết quả DB:', result);

      return res.status(200).json({ success: true, ...result });

    } catch (error) {
      console.error('❌ Lỗi xử lý webhook:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = WebhookSepayController;