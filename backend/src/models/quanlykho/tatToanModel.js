const pool = require('../../config/db');
const QrSepayService = require('../../services/quanlykho/qrSepayService');

const TatToanModel = {
  // 1. Lấy danh sách các đơn hàng cần tất toán
  getDuLieuTatToan: async (kho_ma) => {
    await TatToanModel.donDepPhieuQuaHan();

    const sanRes = await pool.query(`
      SELECT nh.nhg_ten, nh.nhg_ma as "NganHang_Ma", t.ttnt_stmdt_sotaikhoan, t.ttnt_stmdt_tentaikhoan
      FROM thongtinnhantien_stmdt t
      JOIN nganhang nh ON t.nganhang_ma = nh.nhg_ma
      LIMIT 1
    `);
    const thongTinSan = sanRes.rows[0] || null;

    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_tongtienhang AS "TienHang",
        dts.dts_tongtienphisan AS "PhiSan",
        (dts.dts_tongtienhang - dts.dts_tongtienphisan) AS "TienShop",
        dts.gh_ma AS "GH_Ma",
        gh.gh_ten AS "TenShop",
        nh.nhg_ma AS "NganHang_Ma",
        nh.nhg_ten AS "NganHang_Ten",
        t.ttnt_gianhang_sotaikhoan AS "SoTaiKhoan",
        t.ttnt_gianhang_tentaikhoan AS "TenTaiKhoan"
      FROM donhangtheoshop dts
      JOIN thongtingiaohang ttgh ON dts.dts_ma = ttgh.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      LEFT JOIN thongtinnhantien_gianhang t ON gh.gh_ma = t.gh_ma
      LEFT JOIN nganhang nh ON t.nh_ma = nh.nhg_ma
      WHERE dts.dvvc_ma = (SELECT dvvc_ma FROM kho WHERE kho_ma = $1)
        AND ttgh.ttgh_da_nop_tien = true
        AND dts.dts_ma NOT IN (SELECT dts_ma FROM chitiet_tat_toan)
    `;
    
    const ordersRes = await pool.query(query, [kho_ma]);
    return { thongTinSan, orders: ordersRes.rows };
  },

  // 2. Tạo phiếu tất toán và sinh mã QR
  taoPhieuVaQr: async (kho_ma, data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let tongSan = 0;
      const shopMap = {};

      data.selectedOrders.forEach(o => {
        const tienSan = Number(o.PhiSan);
        const tienShop = Number(o.TienShop);
        tongSan += tienSan;

        if (!shopMap[o.GH_Ma]) {
          shopMap[o.GH_Ma] = { tong_tien: 0 };
        }
        shopMap[o.GH_Ma].tong_tien += tienShop;
      });

      const tongShop = Object.values(shopMap).reduce((sum, s) => sum + s.tong_tien, 0);

      const pttRes = await client.query(`SELECT ptt_ma FROM phieu_tat_toan ORDER BY ptt_ma DESC LIMIT 1`);
      let newPttMa = 'PTT0000001';
      if (pttRes.rows.length > 0) {
        const num = parseInt(pttRes.rows[0].ptt_ma.replace('PTT', ''), 10);
        newPttMa = 'PTT' + (num + 1).toString().padStart(7, '0');
      }

      await client.query(
        `INSERT INTO phieu_tat_toan (ptt_ma, kho_ma, ptt_tong_tien_san, ptt_tong_tien_shop, ptt_trang_thai_thanh_toan)
         VALUES ($1, $2, $3, $4, 'CHO_THANH_TOAN')`,
        [newPttMa, kho_ma, tongSan, tongShop]
      );

      for (const item of data.selectedOrders) {
        await client.query(`
          INSERT INTO chitiet_tat_toan (ptt_ma, dts_ma, ctt_tien_san, ctt_tien_shop) 
          VALUES ($1, $2, $3, $4)
        `, [newPttMa, item.DTS_Ma, item.PhiSan, item.TienShop]);
      }

      // Tạo QR Sàn
      const qrSan = QrSepayService.buildQrCode(newPttMa, 'SAN');
      await client.query(
        `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, qr_so_tien)
         VALUES ($1, $2, 'SAN', $3)`,
        [qrSan, newPttMa, tongSan]
      );

      // Tạo QR từng Shop
      for (const [gh_ma, shopData] of Object.entries(shopMap)) {
        const qrShop = QrSepayService.buildQrCode(newPttMa, 'SHOP', gh_ma);
        await client.query(
          `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, gh_ma, qr_so_tien)
           VALUES ($1, $2, 'SHOP', $3, $4)`,
          [qrShop, newPttMa, gh_ma, shopData.tong_tien]
        );
      }

      await client.query('COMMIT');
      return { ptt_ma: newPttMa };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 3. Xử lý Webhook từ SePay
  xuLyWebhook: async (payload) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const logRes = await client.query(
        `INSERT INTO sepay_webhook_log (sepay_id, payload_raw)
         VALUES ($1, $2)
         ON CONFLICT (sepay_id) DO NOTHING
         RETURNING sepay_id`,
        [payload.id, JSON.stringify(payload)]
      );

      if (logRes.rowCount === 0) {
        await client.query('COMMIT');
        return { skipped: true, reason: 'duplicate' };
      }

      if (payload.transferType !== 'in') {
        await client.query('COMMIT');
        return { skipped: true, reason: 'not_incoming' };
      }

      const noiDung = (payload.code || payload.content || '').toUpperCase();
      
      // 🟢 TÌM MÃ QR: Ưu tiên mã dài nhất để tránh mã Sàn nuốt mã Shop
      const qrRes = await client.query(
        `SELECT * FROM qr_thanh_toan
         WHERE $1 LIKE '%' || qr_ma || '%'
         AND qr_trang_thai = 'CHUA_THANH_TOAN'
         ORDER BY LENGTH(qr_ma) DESC
         LIMIT 1
         FOR UPDATE`,
        [noiDung]
      );

      if (qrRes.rows.length === 0) {
        await client.query(`UPDATE sepay_webhook_log SET da_xu_ly = TRUE WHERE sepay_id = $1`, [payload.id]);
        await client.query('COMMIT');
        return { skipped: true, reason: 'no_match' };
      }

      const qr = qrRes.rows[0];

      // 🟢 SO SÁNH TIỀN: Dùng Math.floor() để bỏ phần thập phân, tránh lỗi 0.5đ
      const tienKhachTra = Math.floor(Number(payload.transferAmount));
      const tienCanThu = Math.floor(Number(qr.qr_so_tien));

      if (tienKhachTra < tienCanThu) {
        console.log(`⚠️ Thiếu tiền: Khách trả ${tienKhachTra}đ, cần thu ${tienCanThu}đ`);
        await client.query(`UPDATE sepay_webhook_log SET da_xu_ly = TRUE WHERE sepay_id = $1`, [payload.id]);
        await client.query('COMMIT');
        return { skipped: true, reason: 'insufficient_amount' };
      }

      // Đánh dấu QR hiện tại đã thanh toán
      await client.query(
        `UPDATE qr_thanh_toan
         SET qr_trang_thai = 'DA_THANH_TOAN',
             qr_ma_giao_dich = $1,
             qr_thoi_diem_tt = now()
         WHERE qr_ma = $2`,
        [String(payload.id), qr.qr_ma]
      );

      // Đếm số lượng QR còn lại của phiếu này
      const conLai = await client.query(
        `SELECT COUNT(*)::int AS so_con_lai
         FROM qr_thanh_toan
         WHERE ptt_ma = $1 AND qr_trang_thai = 'CHUA_THANH_TOAN'`,
        [qr.ptt_ma]
      );

      const soLuongConLai = Number(conLai.rows[0].so_con_lai);
      console.log(`👉 Nhận mã [${qr.qr_ma}] thanh toán thành công. Phiếu ${qr.ptt_ma} còn ${soLuongConLai} mã chưa trả.`);

      if (soLuongConLai === 0) {
        await client.query(
          `UPDATE phieu_tat_toan
           SET ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN',
               ptt_thoi_diem_hoan_tat = now(),
               ptt_trang_thai = 'DA_THANH_TOAN'
           WHERE ptt_ma = $1`,
          [qr.ptt_ma]
        );
        console.log(`✅ CHÚC MỪNG: Phiếu ${qr.ptt_ma} đã được thanh toán toàn bộ!`);
      }

      await client.query(`UPDATE sepay_webhook_log SET da_xu_ly = TRUE WHERE sepay_id = $1`, [payload.id]);
      await client.query('COMMIT');
      return { success: true, qr_ma: qr.qr_ma, ptt_ma: qr.ptt_ma };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 4. Tự động dọn dẹp phiếu chờ quá 2 phút
  donDepPhieuQuaHan: async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const expiredQuery = `
        SELECT ptt_ma FROM phieu_tat_toan 
        WHERE ptt_trang_thai_thanh_toan = 'CHO_THANH_TOAN' 
        AND ptt_ngay_tat_toan < NOW() - INTERVAL '2 minutes'
      `;
      const expiredRes = await client.query(expiredQuery);
      
      if (expiredRes.rows.length > 0) {
        const pttIds = expiredRes.rows.map(r => r.ptt_ma);
        
        await client.query(`DELETE FROM qr_thanh_toan WHERE ptt_ma = ANY($1)`, [pttIds]);
        await client.query(`DELETE FROM chitiet_tat_toan WHERE ptt_ma = ANY($1)`, [pttIds]);
        await client.query(`DELETE FROM phieu_tat_toan WHERE ptt_ma = ANY($1)`, [pttIds]);
        
        console.log(`🧹 [TẤT TOÁN] Đã tự động hủy ${pttIds.length} phiếu nháp quá hạn 2 phút.`);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Lỗi dọn dẹp phiếu quá hạn:', error);
    } finally {
      client.release();
    }
  },

  // 5. Hàm xác nhận thủ công
  xacNhanTatToan: async (kho_ma, data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const pttRes = await client.query(`SELECT ptt_ma FROM phieu_tat_toan ORDER BY ptt_ma DESC LIMIT 1`);
      let newPttMa = 'PTT0000001';
      if (pttRes.rows.length > 0) {
        const currentNum = parseInt(pttRes.rows[0].ptt_ma.replace('PTT', ''), 10);
        newPttMa = 'PTT' + (currentNum + 1).toString().padStart(7, '0');
      }

      await client.query(`
        INSERT INTO phieu_tat_toan (ptt_ma, kho_ma, ptt_tong_tien_san, ptt_tong_tien_shop) 
        VALUES ($1, $2, $3, $4)
      `, [newPttMa, kho_ma, data.tongSan, data.tongShop]);

      for (const item of data.chiTiet) {
        await client.query(`
          INSERT INTO chitiet_tat_toan (ptt_ma, dts_ma, ctt_tien_san, ctt_tien_shop) 
          VALUES ($1, $2, $3, $4)
        `, [newPttMa, item.dts_ma, item.tien_san, item.tien_shop]);
      }

      await client.query('COMMIT');
      return { message: "Xác nhận tất toán thành công!" };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = TatToanModel;