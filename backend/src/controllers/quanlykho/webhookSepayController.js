// src/controllers/quanlykho/webhookSepayController.js
const crypto = require('crypto');
const pool = require('../../config/db');
const TatToanModel = require('../../models/quanlykho/tatToanModel');
const { decrypt } = require('../../config/secretCrypto');

// Chống replay: request cũ hơn 5 phút bị từ chối (đúng khuyến nghị của SePay)
const MAX_LECH_GIAY = 300;

/**
 * Xác thực HMAC-SHA256 theo chuẩn SePay:
 *   X-SePay-Signature: sha256=<hex>
 *   X-SePay-Timestamp: <unix seconds>
 *   chữ ký = HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
 *
 * @returns {{ ok: boolean, reason?: string }}
 * reason CHỈ dùng để log, không trả về client.
 */
const verifyHmac = (rawBody, headers, secret) => {
  if (!secret) return { ok: false, reason: 'missing_secret' };

  const timestamp = String(headers['x-sepay-timestamp'] || '').trim();
  const signature = String(headers['x-sepay-signature'] || '').trim();

  if (!timestamp || !/^\d+$/.test(timestamp)) {
    return { ok: false, reason: 'missing_timestamp' };
  }

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > MAX_LECH_GIAY) {
    return { ok: false, reason: 'expired' };
  }

  const cleanSignature = signature.replace(/^sha256=/, '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(cleanSignature)) {
    return { ok: false, reason: 'malformed_signature' };
  }

  const expected = crypto
    .createHmac('sha256', String(secret).trim())
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const sigBuf = Buffer.from(cleanSignature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');

  const hopLe =
    sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

  return hopLe ? { ok: true } : { ok: false, reason: 'invalid_signature' };
};

// Log lý do thất bại nhưng KHÔNG log chữ ký/secret
const tuChoi = (res, ten, check) => {
  console.warn(`⚠️ [webhook ${ten}] Từ chối: ${check.reason}`);
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

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
      const check = verifyHmac(rawBody, req.headers, process.env.SEPAY_WEBHOOK_SECRET);
      if (!check.ok) return tuChoi(res, 'Sàn', check);

      console.log(`✅ Xác thực HMAC Sàn thành công!`);

      const payload = JSON.parse(rawBody);
      console.log(
        `👉 Nội dung CK Sàn: "${payload.code || payload.content}" | Số tiền: ${payload.transferAmount}`
      );

      const result = await TatToanModel.xuLyWebhook(payload);
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

      const shopRes = await pool.query(
        `SELECT sepay_webhook_secret FROM thongtinnhantien_gianhang WHERE gh_ma = $1`,
        [gh_ma]
      );

      if (shopRes.rows.length === 0) {
        console.log(`❌ Không tìm thấy Shop ${gh_ma} trong DB`);
        return res.status(404).json({ success: false, message: 'Shop không tồn tại' });
      }

      const webhookSecret = decrypt(shopRes.rows[0].sepay_webhook_secret);
      if (!webhookSecret) {
        console.log(`❌ Shop ${gh_ma} chưa cấu hình Secret`);
        return res.status(400).json({ success: false, message: 'Shop chưa cấu hình Secret' });
      }

      const check = verifyHmac(rawBody, req.headers, webhookSecret);
      if (!check.ok) return tuChoi(res, `Shop ${gh_ma}`, check);

      console.log(`✅ Xác thực HMAC Shop ${gh_ma} thành công!`);

      const payload = JSON.parse(rawBody);
      console.log(
        `👉 Nội dung CK Shop: "${payload.code || payload.content}" | Số tiền: ${payload.transferAmount}`
      );

      const result = await TatToanModel.xuLyWebhookCuaShop(gh_ma, payload);
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

      if (!Buffer.isBuffer(req.body)) {
        return res.status(500).json({ success: false, message: 'Body not raw' });
      }

      const rawBody = req.body.toString('utf8');

      const shopRes = await pool.query(
        `SELECT sepay_webhook_secret FROM thongtinnhantien_dvvc WHERE dvvc_ma = $1`,
        [dvvc_ma]
      );

      const webhookSecret =
        shopRes.rows.length > 0 ? decrypt(shopRes.rows[0].sepay_webhook_secret) : null;

      if (!webhookSecret) {
        return res.status(400).json({ success: false, message: 'ĐVVC chưa cấu hình Secret' });
      }

      const check = verifyHmac(rawBody, req.headers, webhookSecret);
      if (!check.ok) return tuChoi(res, `ĐVVC ${dvvc_ma}`, check);

      console.log(`✅ Xác thực HMAC ĐVVC ${dvvc_ma} thành công!`);

      const payload = JSON.parse(rawBody);

      const result = await TatToanModel.xuLyWebhookCuaDVVC(dvvc_ma, payload);

      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = WebhookSepayController;
