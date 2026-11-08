// src/controllers/quanlykho/webhookSepayController.js
const crypto = require('crypto');
const pool = require('../../config/db');
const TatToanModel = require('../../models/quanlykho/tatToanModel');

const WebhookSepayController = {
  // 🟢 Hàm dành cho SÀN
  handle: async (req, res) => {
    try {
      console.log(`\n--- 🔔 NHẬN WEBHOOK TỪ SÀN ---`);
      
      if (!Buffer.isBuffer(req.body)) {
        console.log('❌ req.body không phải Buffer');
        return res.status(500).json({ success: false, message: 'Body not raw' });
      }

      const rawBody = req.body.toString('utf8');
      const signature = req.headers['x-sepay-signature'] || '';
      const timestamp = req.headers['x-sepay-timestamp'] || '';
      const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET; 

      if (!webhookSecret) {
        console.log('❌ Chưa cấu hình SEPAY_WEBHOOK_SECRET');
        return res.status(500).json({ success: false, message: 'Server misconfigured' });
      }

      const cleanSignature = signature.replace(/^sha256=/, '').trim();
      const dataToSign = `${timestamp}.${rawBody}`;
      const expected = crypto.createHmac('sha256', webhookSecret.trim()).update(dataToSign).digest('hex');

      const sigBuf = Buffer.from(cleanSignature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.log(`❌ Chữ ký Sàn không khớp. Nhận: ${cleanSignature}, Tính: ${expected}`);
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }

      console.log(`✅ Xác thực HMAC Sàn thành công!`);
      
      const payload = JSON.parse(rawBody);
      console.log(`👉 Nội dung CK Sàn: "${payload.code || payload.content}" | Số tiền: ${payload.transferAmount}`);
      
      const result = await TatToanModel.xuLyWebhook(payload);
      
      // 🟢 IN KẾT QUẢ TỪ DATABASE RA
      console.log(`👉 Kết quả DB (Sàn):`, result);

      return res.status(200).json({ success: true, ...result });

    } catch (error) {
      console.error(`❌ Lỗi xử lý webhook Sàn:`, error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🟢 Hàm dành cho SHOP
  handleShopWebhook: async (req, res) => {
    try {
      const { gh_ma } = req.params;
      console.log(`\n--- 🔔 NHẬN WEBHOOK TỪ SHOP: ${gh_ma} ---`);

      if (!Buffer.isBuffer(req.body)) {
        return res.status(500).json({ success: false, message: 'Body not raw' });
      }

      const rawBody = req.body.toString('utf8');
      const signature = req.headers['x-sepay-signature'] || '';
      const timestamp = req.headers['x-sepay-timestamp'] || '';

      const shopRes = await pool.query(
        `SELECT sepay_webhook_secret FROM thongtinnhantien_gianhang WHERE gh_ma = $1`,
        [gh_ma]
      );

      if (shopRes.rows.length === 0) {
        console.log(`❌ Không tìm thấy Shop ${gh_ma} trong DB`);
        return res.status(404).json({ success: false, message: 'Shop không tồn tại' });
      }
      
      const webhookSecret = shopRes.rows[0].sepay_webhook_secret;
      if (!webhookSecret) {
        console.log(`❌ Shop ${gh_ma} chưa cấu hình Secret`);
        return res.status(400).json({ success: false, message: 'Shop chưa cấu hình Secret' });
      }

      const cleanSignature = signature.replace(/^sha256=/, '').trim();
      const dataToSign = `${timestamp}.${rawBody}`;
      const expected = crypto.createHmac('sha256', webhookSecret.trim()).update(dataToSign).digest('hex');

      const sigBuf = Buffer.from(cleanSignature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.log(`❌ Chữ ký Shop ${gh_ma} không khớp.`);
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }

      console.log(`✅ Xác thực HMAC Shop ${gh_ma} thành công!`);

      const payload = JSON.parse(rawBody);
      console.log(`👉 Nội dung CK Shop: "${payload.code || payload.content}" | Số tiền: ${payload.transferAmount}`);
      
      const result = await TatToanModel.xuLyWebhookCuaShop(gh_ma, payload);
      
      // 🟢 IN KẾT QUẢ TỪ DATABASE RA
      console.log(`👉 Kết quả DB (Shop ${gh_ma}):`, result);
      
      return res.status(200).json({ success: true, ...result });

    } catch (error) {
      console.error(`❌ Lỗi xử lý webhook Shop:`, error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
    // 🟢 Hàm dành cho ĐVVC
  handleDvvcWebhook: async (req, res) => {
    try {
      const { dvvc_ma } = req.params;
      console.log(`\n--- 🔔 NHẬN WEBHOOK TỪ ĐVVC: ${dvvc_ma} ---`);

      if (!Buffer.isBuffer(req.body)) return res.status(500).json({ success: false });

      const rawBody = req.body.toString('utf8');
      const signature = req.headers['x-sepay-signature'] || '';
      const timestamp = req.headers['x-sepay-timestamp'] || '';

      const shopRes = await pool.query(
        `SELECT sepay_webhook_secret FROM thongtinnhantien_dvvc WHERE dvvc_ma = $1`,
        [dvvc_ma]
      );

      if (shopRes.rows.length === 0 || !shopRes.rows[0].sepay_webhook_secret) {
        return res.status(400).json({ success: false, message: 'ĐVVC chưa cấu hình Secret' });
      }
      
      const webhookSecret = shopRes.rows[0].sepay_webhook_secret;
      const cleanSignature = signature.replace(/^sha256=/, '').trim();
      const expected = crypto.createHmac('sha256', webhookSecret.trim()).update(`${timestamp}.${rawBody}`).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(cleanSignature, 'hex'), Buffer.from(expected, 'hex'))) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }

      const payload = JSON.parse(rawBody);
      const result = await TatToanModel.xuLyWebhookCuaDVVC(dvvc_ma, payload);
      return res.status(200).json({ success: true, ...result });

    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = WebhookSepayController;