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
        (dts.dts_tongtienhang - COALESCE(dts.dts_tonggiamgiashop, 0)) AS "TienShop",
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

  // 2. Tạo phiếu tất toán và sinh N+1 mã QR
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
      const tongTienTatToan = tongSan + tongShop;

      // Sinh mã PTT
      const pttRes = await client.query(`SELECT ptt_ma FROM phieu_tat_toan ORDER BY ptt_ma DESC LIMIT 1`);
      let newPttMa = 'PTT0000001';
      if (pttRes.rows.length > 0) {
        const num = parseInt(pttRes.rows[0].ptt_ma.replace('PTT', ''), 10);
        newPttMa = 'PTT' + (num + 1).toString().padStart(7, '0');
      }

      // Lưu phiếu tất toán
      await client.query(
        `INSERT INTO phieu_tat_toan (ptt_ma, kho_ma, ptt_tong_tien_san, ptt_tong_tien_shop, ptt_trang_thai_thanh_toan)
         VALUES ($1, $2, $3, $4, 'CHO_THANH_TOAN')`,
        [newPttMa, kho_ma, tongSan, tongShop]
      );

      // Lưu chi tiết
      for (const item of data.selectedOrders) {
        await client.query(`
          INSERT INTO chitiet_tat_toan (ptt_ma, dts_ma, ctt_tien_san, ctt_tien_shop) 
          VALUES ($1, $2, $3, $4)
        `, [newPttMa, item.DTS_Ma, item.PhiSan, item.TienShop]);
      }

      // TẠO MÃ QR CHO SÀN
      const qrSan = `TT${newPttMa}S`;
      await client.query(
        `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, qr_so_tien)
         VALUES ($1, $2, 'SAN', $3)`,
        [qrSan, newPttMa, tongSan]
      );

      // TẠO MÃ QR CHO TỪNG SHOP
      for (const [gh_ma, shopData] of Object.entries(shopMap)) {
        const qrShop = `TT${newPttMa}SH${gh_ma}`;
        await client.query(
          `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, gh_ma, qr_so_tien)
           VALUES ($1, $2, 'SHOP', $3, $4)`,
          [qrShop, newPttMa, gh_ma, shopData.tong_tien]
        );
      }

      await client.query('COMMIT');
      return { ptt_ma: newPttMa, tong_tien: tongTienTatToan };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 3. Xử lý Webhook của Sàn
  xuLyWebhook: async (payload) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (payload.transferType !== 'in') return { skipped: true, reason: 'not_incoming' };

      const noiDung = (payload.code || payload.content || '').toUpperCase();
      console.log(`🔎 [MODEL SÀN] Đang tìm mã QR Sàn trong chuỗi: "${noiDung}"`);
      
      // 🟢 ĐÃ SỬA: Dùng Regex \y thay cho LIKE để chặn việc nhận nhầm mã của Shop
      const qrRes = await client.query(
        `SELECT * FROM qr_thanh_toan
         WHERE qr_loai = 'SAN'
         AND $1 ~ ('\\y' || qr_ma || '\\y')
         AND qr_trang_thai = 'CHUA_THANH_TOAN'
         ORDER BY LENGTH(qr_ma) DESC LIMIT 1 FOR UPDATE`,
        [noiDung]
      );

      if (qrRes.rows.length === 0) {
        console.log(`⚠️ [MODEL SÀN] Không tìm thấy mã QR Sàn nào khớp hoặc QR đã thanh toán rồi.`);
        await client.query('COMMIT');
        return { skipped: true, reason: 'no_match' };
      }

      const qr = qrRes.rows[0];
      console.log(`✅ [MODEL SÀN] Tìm thấy QR: ${qr.qr_ma} | Cần thu: ${qr.qr_so_tien}`);

      if (Math.floor(Number(payload.transferAmount)) < Math.floor(Number(qr.qr_so_tien))) {
        console.log(`⚠️ [MODEL SÀN] Chuyển thiếu tiền!`);
        await client.query('COMMIT');
        return { skipped: true, reason: 'insufficient_amount' };
      }

      await client.query(
        `UPDATE qr_thanh_toan SET qr_trang_thai = 'DA_THANH_TOAN', qr_ma_giao_dich = $1, qr_thoi_diem_tt = now() WHERE qr_ma = $2`,
        [String(payload.id), qr.qr_ma]
      );

      const conLai = await client.query(
        `SELECT COUNT(*)::int AS so_con_lai FROM qr_thanh_toan WHERE ptt_ma = $1 AND qr_trang_thai = 'CHUA_THANH_TOAN'`,
        [qr.ptt_ma]
      );

      if (Number(conLai.rows[0].so_con_lai) === 0) {
        await client.query(
          `UPDATE phieu_tat_toan SET ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN', ptt_thoi_diem_hoan_tat = now() WHERE ptt_ma = $1`,
          [qr.ptt_ma]
        );
        console.log(`✅ CHÚC MỪNG: PHIẾU ${qr.ptt_ma} ĐÃ THU ĐỦ TIỀN TỪ TẤT CẢ CÁC BÊN!`);
      }

      await client.query('COMMIT');
      return { success: true, qr_ma: qr.qr_ma };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ [MODEL SÀN] Lỗi DB:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // 4. Xử lý Webhook của Shop
  xuLyWebhookCuaShop: async (gh_ma, payload) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (payload.transferType !== 'in') return { skipped: true, reason: 'not_incoming' };

      const noiDung = (payload.code || payload.content || '').toUpperCase();
      console.log(`🔎 [MODEL SHOP ${gh_ma}] Đang tìm mã QR trong chuỗi: "${noiDung}"`);
      
      // 🟢 ĐÃ SỬA: Dùng Regex \y thay cho LIKE
      const qrRes = await client.query(
        `SELECT * FROM qr_thanh_toan
         WHERE gh_ma = $1 
         AND $2 ~ ('\\y' || qr_ma || '\\y')
         AND qr_trang_thai = 'CHUA_THANH_TOAN'
         ORDER BY LENGTH(qr_ma) DESC LIMIT 1 FOR UPDATE`,
        [gh_ma, noiDung]
      );

      if (qrRes.rows.length === 0) {
        console.log(`⚠️ [MODEL SHOP ${gh_ma}] Không tìm thấy mã QR nào khớp với nội dung trên.`);
        await client.query('COMMIT');
        return { skipped: true, reason: 'no_match' };
      }

      const qr = qrRes.rows[0];
      console.log(`✅ [MODEL SHOP ${gh_ma}] Tìm thấy QR: ${qr.qr_ma} | Cần thu: ${qr.qr_so_tien}`);

      if (Math.floor(Number(payload.transferAmount)) < Math.floor(Number(qr.qr_so_tien))) {
        console.log(`⚠️ [MODEL SHOP ${gh_ma}] Chuyển thiếu tiền!`);
        await client.query('COMMIT');
        return { skipped: true, reason: 'insufficient_amount' };
      }

      await client.query(
        `UPDATE qr_thanh_toan SET qr_trang_thai = 'DA_THANH_TOAN', qr_ma_giao_dich = $1, qr_thoi_diem_tt = now() WHERE qr_ma = $2`,
        [String(payload.id), qr.qr_ma]
      );

      const conLai = await client.query(
        `SELECT COUNT(*)::int AS so_con_lai FROM qr_thanh_toan WHERE ptt_ma = $1 AND qr_trang_thai = 'CHUA_THANH_TOAN'`,
        [qr.ptt_ma]
      );

      if (Number(conLai.rows[0].so_con_lai) === 0) {
        await client.query(
          `UPDATE phieu_tat_toan SET ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN', ptt_thoi_diem_hoan_tat = now() WHERE ptt_ma = $1`,
          [qr.ptt_ma]
        );
        console.log(`✅ CHÚC MỪNG: PHIẾU ${qr.ptt_ma} ĐÃ THU ĐỦ TIỀN TỪ TẤT CẢ CÁC BÊN!`);
      }

      await client.query('COMMIT');
      return { success: true, qr_ma: qr.qr_ma };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ [MODEL SHOP ${gh_ma}] Lỗi DB:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  // 5. Dọn dẹp phiếu quá hạn
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
    xuLyWebhookCuaDVVC: async (dvvc_ma, payload) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (payload.transferType !== 'in') return { skipped: true };

      const noiDung = (payload.code || payload.content || '').toUpperCase();
      
      // Tìm mã QR của Phiếu chi (VD: CCD0000001)
      const qrRes = await client.query(
        `SELECT q.*, p.dvvc_ma FROM qr_chi_dvvc q
         JOIN phieu_chi_dvvc p ON q.pcd_ma = p.pcd_ma
         WHERE p.dvvc_ma = $1 
         AND $2 ~ ('\\y' || q.qr_ma || '\\y')
         AND q.qr_trang_thai = 'CHUA_THANH_TOAN'
         LIMIT 1 FOR UPDATE`,
        [dvvc_ma, noiDung]
      );

      if (qrRes.rows.length === 0) {
        await client.query('COMMIT');
        return { skipped: true, reason: 'no_match' };
      }

      const qr = qrRes.rows[0];
      
      // Đánh dấu QR đã thanh toán
      await client.query(
        `UPDATE qr_chi_dvvc SET qr_trang_thai = 'DA_THANH_TOAN', qr_thoi_diem_tt = now() WHERE qr_ma = $1`,
        [qr.qr_ma]
      );

      // Đánh dấu Phiếu chi hoàn tất
      await client.query(
        `UPDATE phieu_chi_dvvc SET pcd_trang_thai = 'DA_THANH_TOAN', pcd_ngay_hoan_tat = now() WHERE pcd_ma = $1`,
        [qr.pcd_ma]
      );

      await client.query('COMMIT');
      return { success: true, pcd_ma: qr.pcd_ma };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = TatToanModel;