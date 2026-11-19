const pool = require('../../config/db');

const TatToanModel = {
  // Lấy thông tin ngân hàng nhận tiền của ĐVVC phụ trách kho
  getThongTinDVVC: async (kho_ma) => {
    const res = await pool.query(
      `SELECT t.dvvc_ma,
              t.ttnt_dvvc_sotaikhoan,
              t.ttnt_dvvc_tentaikhoan,
              nh.nhg_ma AS nganhang_ma,
              nh.nhg_ten AS nganhang_ten
       FROM kho k
       JOIN thongtinnhantien_dvvc t ON t.dvvc_ma = k.dvvc_ma
       LEFT JOIN nganhang nh ON nh.nhg_ma = t.nganhang_ma
       WHERE k.kho_ma = $1
       LIMIT 1`,
      [kho_ma]
    );
    return res.rows[0] || null;
  },

  // Sinh mã phiếu tất toán kế tiếp (PTT0000001, PTT0000002, ...)
  sinhMaPtt: async (client) => {
    const pttRes = await client.query(
      `SELECT ptt_ma FROM phieu_tat_toan ORDER BY ptt_ma DESC LIMIT 1`
    );
    if (pttRes.rows.length === 0) return 'PTT0000001';

    const num = parseInt(pttRes.rows[0].ptt_ma.replace('PTT', ''), 10);
    if (Number.isNaN(num)) return 'PTT0000001';
    return 'PTT' + (num + 1).toString().padStart(7, '0');
  },

  // 1. Lấy danh sách các đơn hàng cần tất toán
  getDuLieuTatToan: async (kho_ma) => {
    await TatToanModel.donDepPhieuQuaHan();

    const query = `
      SELECT DISTINCT ON (dts.dts_ma)
        dts.dts_ma AS "DTS_Ma",
        dts.dts_tongtienhang AS "TienHang",
        dts.dts_tongtienphisan AS "PhiSan",
        (dts.dts_tongtienhang - COALESCE(dts.dts_tonggiamgiashop, 0)) AS "TienShop",
        COALESCE(dts.dts_tienvanchuyen, 0) AS "TienDVVC",
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
        AND NOT EXISTS (
          SELECT 1 FROM giu_tien_su_co g
          WHERE g.dts_ma = dts.dts_ma AND g.gtsc_trang_thai = 'DANG_GIU'
        )
      ORDER BY dts.dts_ma,
               ttgh.ttgh_thoidiem_nop DESC NULLS LAST,
               ttgh.ttgh_thoidiem DESC NULLS LAST
    `;

    const [sanRes, dvvcRes, ordersRes] = await Promise.all([
      pool.query(`
        SELECT nh.nhg_ten, nh.nhg_ma as "NganHang_Ma", t.ttnt_stmdt_sotaikhoan, t.ttnt_stmdt_tentaikhoan
        FROM thongtinnhantien_stmdt t
        JOIN nganhang nh ON t.nganhang_ma = nh.nhg_ma
        LIMIT 1
      `),
      pool.query(
        `SELECT t.dvvc_ma,
                t.ttnt_dvvc_sotaikhoan,
                t.ttnt_dvvc_tentaikhoan,
                nh.nhg_ma AS nganhang_ma,
                nh.nhg_ten AS nganhang_ten
         FROM kho k
         JOIN thongtinnhantien_dvvc t ON t.dvvc_ma = k.dvvc_ma
         LEFT JOIN nganhang nh ON nh.nhg_ma = t.nganhang_ma
         WHERE k.kho_ma = $1
         LIMIT 1`,
        [kho_ma]
      ),
      pool.query(query, [kho_ma]),
    ]);

    return {
      thongTinSan: sanRes.rows[0] || null,
      thongTinDVVC: dvvcRes.rows[0] || null,
      orders: ordersRes.rows,
    };
  },

  // 2. Tạo phiếu tất toán và sinh N+1 mã QR
  taoPhieuVaQr: async (kho_ma, data) => {
    const ds_dts_ma = [...new Set(
      (data?.selectedOrders || [])
        .map((o) => o.DTS_Ma || o.dts_ma)
        .filter(Boolean)
    )];

    if (ds_dts_ma.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 đơn hàng để tất toán!');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Tính lại tiền từ DB để tránh lệch số do dữ liệu phía client
      const donRes = await client.query(
        `SELECT DISTINCT ON (dts.dts_ma)
           dts.dts_ma,
           dts.gh_ma,
           COALESCE(dts.dts_tongtienhang, 0) AS tien_hang,
           COALESCE(dts.dts_tonggiamgiashop, 0) AS giam_gia_shop,
           COALESCE(dts.dts_tongtienphisan, 0) AS tien_san,
           COALESCE(dts.dts_tienvanchuyen, 0) AS tien_dvvc
         FROM donhangtheoshop dts
         JOIN thongtingiaohang ttgh ON dts.dts_ma = ttgh.dts_ma
         WHERE dts.dts_ma = ANY($2::varchar[])
           AND ttgh.ttgh_da_nop_tien = true
           AND EXISTS (
             SELECT 1 FROM kho k
             WHERE k.kho_ma = $1 AND k.dvvc_ma = dts.dvvc_ma
           )
           AND NOT EXISTS (
             SELECT 1 FROM chitiet_tat_toan c WHERE c.dts_ma = dts.dts_ma
           )
           AND NOT EXISTS (
             SELECT 1 FROM giu_tien_su_co g
             WHERE g.dts_ma = dts.dts_ma AND g.gtsc_trang_thai = 'DANG_GIU'
           )
         ORDER BY dts.dts_ma,
                  ttgh.ttgh_thoidiem_nop DESC NULLS LAST,
                  ttgh.ttgh_thoidiem DESC NULLS LAST`,
        [kho_ma, ds_dts_ma]
      );

      if (donRes.rows.length !== ds_dts_ma.length) {
        throw new Error(
          'Một số đơn không còn hợp lệ để tất toán (đã tất toán hoặc đang bị giữ tiền). Vui lòng tải lại trang.'
        );
      }

      let tongSan = 0;
      let tongDVVC = 0;
      const shopMap = new Map();

      for (const don of donRes.rows) {
        const tienSan = Number(don.tien_san);
        const tienShop = Number(don.tien_hang) - Number(don.giam_gia_shop);
        const tienDVVC = Number(don.tien_dvvc);

        tongSan += tienSan;
        tongDVVC += tienDVVC;

        if (!shopMap.has(don.gh_ma)) shopMap.set(don.gh_ma, 0);
        shopMap.set(don.gh_ma, shopMap.get(don.gh_ma) + tienShop);
      }

      const tongShop = [...shopMap.values()].reduce((sum, tien) => sum + tien, 0);

      // Bắt buộc có tài khoản nhận tiền của ĐVVC khi phát sinh cước phải trả
      let thongTinDVVC = null;
      if (tongDVVC > 0) {
        const dvvcRes = await client.query(
          `SELECT t.dvvc_ma, t.ttnt_dvvc_sotaikhoan
           FROM kho k
           JOIN thongtinnhantien_dvvc t ON t.dvvc_ma = k.dvvc_ma
           WHERE k.kho_ma = $1
           LIMIT 1`,
          [kho_ma]
        );
        thongTinDVVC = dvvcRes.rows[0] || null;

        if (!thongTinDVVC?.ttnt_dvvc_sotaikhoan) {
          throw new Error(
            'ĐVVC chưa cấu hình tài khoản nhận tiền. Không thể tạo phiếu tất toán cước vận chuyển.'
          );
        }
      }

      const newPttMa = await TatToanModel.sinhMaPtt(client);

      // Lưu phiếu tất toán
      await client.query(
        `INSERT INTO phieu_tat_toan
           (ptt_ma, kho_ma, ptt_tong_tien_san, ptt_tong_tien_shop, ptt_tong_tien_dvvc,
            ptt_loai, ptt_trang_thai_thanh_toan)
         VALUES ($1, $2, $3, $4, $5, 'DAY_DU', 'CHO_THANH_TOAN')`,
        [newPttMa, kho_ma, tongSan, tongShop, tongDVVC]
      );

      // Lưu chi tiết
      for (const don of donRes.rows) {
        const tienShop = Number(don.tien_hang) - Number(don.giam_gia_shop);
        await client.query(
          `INSERT INTO chitiet_tat_toan
             (ptt_ma, dts_ma, ctt_tien_san, ctt_tien_shop, ctt_tien_dvvc)
           VALUES ($1, $2, $3, $4, $5)`,
          [newPttMa, don.dts_ma, don.tien_san, tienShop, don.tien_dvvc]
        );
      }

      // TẠO MÃ QR CHO SÀN
      const qrSan = `TT${newPttMa}S`;
      await client.query(
        `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, qr_so_tien)
         VALUES ($1, $2, 'SAN', $3)`,
        [qrSan, newPttMa, tongSan]
      );

      // TẠO MÃ QR CHO TỪNG SHOP
      for (const [gh_ma, tongTienShop] of shopMap.entries()) {
        const qrShop = `TT${newPttMa}SH${gh_ma}`;
        await client.query(
          `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, gh_ma, qr_so_tien)
           VALUES ($1, $2, 'SHOP', $3, $4)`,
          [qrShop, newPttMa, gh_ma, tongTienShop]
        );
      }

      // TẠO MÃ QR CHUYỂN CƯỚC CHO ĐVVC (chỉ khi có cước phát sinh)
      let qrDVVC = null;
      if (tongDVVC > 0) {
        qrDVVC = `TT${newPttMa}DV`;
        await client.query(
          `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, qr_so_tien, dvvc_ma)
           VALUES ($1, $2, 'DVVC', $3, $4)`,
          [qrDVVC, newPttMa, tongDVVC, thongTinDVVC.dvvc_ma]
        );
      }

      await client.query('COMMIT');
      return {
        ptt_ma: newPttMa,
        tong_tien: tongSan + tongShop + tongDVVC,
        tong_san: tongSan,
        tong_shop: tongShop,
        tong_dvvc: tongDVVC,
        qr_dvvc: qrDVVC,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 2b. Danh sách đơn đã tất toán Shop/Sàn nhưng còn thiếu cước ĐVVC
  getDuLieuCuocTon: async (kho_ma) => {
    await TatToanModel.donDepPhieuQuaHan();

    const [dvvcRes, ordersRes] = await Promise.all([
      pool.query(
        `SELECT t.dvvc_ma,
                t.ttnt_dvvc_sotaikhoan,
                t.ttnt_dvvc_tentaikhoan,
                nh.nhg_ma AS nganhang_ma,
                nh.nhg_ten AS nganhang_ten
         FROM kho k
         JOIN thongtinnhantien_dvvc t ON t.dvvc_ma = k.dvvc_ma
         LEFT JOIN nganhang nh ON nh.nhg_ma = t.nganhang_ma
         WHERE k.kho_ma = $1
         LIMIT 1`,
        [kho_ma]
      ),
      pool.query(
        `SELECT DISTINCT ON (o.dts_ma)
           o.dts_ma AS "DTS_Ma",
           o.gh_ma AS "GH_Ma",
           gh.gh_ten AS "TenShop",
           COALESCE(o.dts_tienvanchuyen, 0) AS "TienDVVC",
           p0.ptt_ma AS "PTT_Goc",
           COALESCE(p0.ptt_thoi_diem_hoan_tat, p0.ptt_ngay_tat_toan) AS "NgayTatToan"
         FROM chitiet_tat_toan c0
         JOIN phieu_tat_toan p0 ON p0.ptt_ma = c0.ptt_ma
         JOIN donhangtheoshop o ON o.dts_ma = c0.dts_ma
         JOIN gianhang gh ON gh.gh_ma = o.gh_ma
         WHERE p0.kho_ma = $1
           AND p0.ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
           AND p0.ptt_loai = 'DAY_DU'
           AND o.dvvc_ma = (SELECT dvvc_ma FROM kho WHERE kho_ma = $1)
           AND COALESCE(o.dts_tienvanchuyen, 0) > 0
           AND COALESCE(c0.ctt_tien_dvvc, 0) = 0
           AND NOT EXISTS (
             SELECT 1 FROM chitiet_tat_toan cx
             WHERE cx.dts_ma = o.dts_ma AND COALESCE(cx.ctt_tien_dvvc, 0) > 0
           )
           AND NOT EXISTS (
             SELECT 1 FROM giu_tien_su_co g
             WHERE g.dts_ma = o.dts_ma AND g.gtsc_trang_thai = 'DANG_GIU'
           )
         ORDER BY o.dts_ma DESC`,
        [kho_ma]
      ),
    ]);

    return {
      thongTinDVVC: dvvcRes.rows[0] || null,
      orders: ordersRes.rows,
    };
  },

  // 2c. Tạo phiếu tất toán riêng cho phần cước tồn (chỉ 1 QR ĐVVC)
  taoPhieuCuocTon: async (kho_ma, data) => {
    const ds_dts_ma = [...new Set(
      (data?.ds_dts_ma || data?.selectedOrders || [])
        .map((o) => (typeof o === 'string' ? o : o?.DTS_Ma || o?.dts_ma))
        .filter(Boolean)
    )];

    if (ds_dts_ma.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 đơn cước tồn để tất toán!');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dvvcRes = await client.query(
        `SELECT t.dvvc_ma, t.ttnt_dvvc_sotaikhoan
         FROM kho k
         JOIN thongtinnhantien_dvvc t ON t.dvvc_ma = k.dvvc_ma
         WHERE k.kho_ma = $1
         LIMIT 1`,
        [kho_ma]
      );
      const thongTinDVVC = dvvcRes.rows[0] || null;

      if (!thongTinDVVC?.ttnt_dvvc_sotaikhoan) {
        throw new Error(
          'ĐVVC chưa cấu hình tài khoản nhận tiền. Không thể tạo phiếu tất toán cước.'
        );
      }

      const donRes = await client.query(
        `SELECT o.dts_ma, COALESCE(o.dts_tienvanchuyen, 0) AS tien_dvvc
         FROM donhangtheoshop o
         WHERE o.dts_ma = ANY($2::varchar[])
           AND o.dvvc_ma = $3
           AND COALESCE(o.dts_tienvanchuyen, 0) > 0
           AND EXISTS (
             SELECT 1
             FROM chitiet_tat_toan c0
             JOIN phieu_tat_toan p0 ON p0.ptt_ma = c0.ptt_ma
             WHERE c0.dts_ma = o.dts_ma
               AND p0.kho_ma = $1
               AND p0.ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
               AND p0.ptt_loai = 'DAY_DU'
               AND COALESCE(c0.ctt_tien_dvvc, 0) = 0
           )
           AND NOT EXISTS (
             SELECT 1 FROM chitiet_tat_toan cx
             WHERE cx.dts_ma = o.dts_ma AND COALESCE(cx.ctt_tien_dvvc, 0) > 0
           )
           AND NOT EXISTS (
             SELECT 1 FROM giu_tien_su_co g
             WHERE g.dts_ma = o.dts_ma AND g.gtsc_trang_thai = 'DANG_GIU'
           )
         ORDER BY o.dts_ma
         FOR UPDATE`,
        [kho_ma, ds_dts_ma, thongTinDVVC.dvvc_ma]
      );

      if (donRes.rows.length !== ds_dts_ma.length) {
        throw new Error(
          'Một số đơn cước tồn không còn hợp lệ (đã được tất toán). Vui lòng tải lại trang.'
        );
      }

      const tongDVVC = donRes.rows.reduce(
        (sum, don) => sum + Number(don.tien_dvvc),
        0
      );

      const newPttMa = await TatToanModel.sinhMaPtt(client);

      await client.query(
        `INSERT INTO phieu_tat_toan
           (ptt_ma, kho_ma, ptt_tong_tien_san, ptt_tong_tien_shop, ptt_tong_tien_dvvc,
            ptt_loai, ptt_trang_thai_thanh_toan)
         VALUES ($1, $2, 0, 0, $3, 'CUOC_TON', 'CHO_THANH_TOAN')`,
        [newPttMa, kho_ma, tongDVVC]
      );

      for (const don of donRes.rows) {
        await client.query(
          `INSERT INTO chitiet_tat_toan
             (ptt_ma, dts_ma, ctt_tien_san, ctt_tien_shop, ctt_tien_dvvc)
           VALUES ($1, $2, 0, 0, $3)`,
          [newPttMa, don.dts_ma, don.tien_dvvc]
        );
      }

      const qrDVVC = `TT${newPttMa}DV`;
      await client.query(
        `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, qr_so_tien, dvvc_ma)
         VALUES ($1, $2, 'DVVC', $3, $4)`,
        [qrDVVC, newPttMa, tongDVVC, thongTinDVVC.dvvc_ma]
      );

      await client.query('COMMIT');
      return {
        ptt_ma: newPttMa,
        tong_tien: tongDVVC,
        tong_san: 0,
        tong_shop: 0,
        tong_dvvc: tongDVVC,
        qr_dvvc: qrDVVC,
      };
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

      if (payload.transferType !== 'in') {
        await client.query('COMMIT');
        return { skipped: true, reason: 'not_incoming' };
      }

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
      if (payload.transferType !== 'in') {
        await client.query('COMMIT');
        return { skipped: true, reason: 'not_incoming' };
      }

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

  // 6. Xử lý Webhook của ĐVVC
  //    - Ưu tiên khớp QR phiếu chi sàn trả ĐVVC (qr_chi_dvvc)
  //    - Sau đó khớp QR tất toán cước từ kho cho ĐVVC (qr_thanh_toan, qr_loai = 'DVVC')
  xuLyWebhookCuaDVVC: async (dvvc_ma, payload) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (payload.transferType !== 'in') {
        await client.query('COMMIT');
        return { skipped: true, reason: 'not_incoming' };
      }

      const noiDung = (payload.code || payload.content || '').toUpperCase();

      // 6.1. QR của phiếu chi (VD: PCD0000001)
      const qrChiRes = await client.query(
        `SELECT q.*, p.dvvc_ma FROM qr_chi_dvvc q
         JOIN phieu_chi_dvvc p ON q.pcd_ma = p.pcd_ma
         WHERE p.dvvc_ma = $1 
         AND $2 ~ ('\\y' || q.qr_ma || '\\y')
         AND q.qr_trang_thai = 'CHUA_THANH_TOAN'
         LIMIT 1 FOR UPDATE`,
        [dvvc_ma, noiDung]
      );

      if (qrChiRes.rows.length > 0) {
        const qr = qrChiRes.rows[0];

        await client.query(
          `UPDATE qr_chi_dvvc SET qr_trang_thai = 'DA_THANH_TOAN', qr_thoi_diem_tt = now() WHERE qr_ma = $1`,
          [qr.qr_ma]
        );

        await client.query(
          `UPDATE phieu_chi_dvvc SET pcd_trang_thai = 'DA_THANH_TOAN', pcd_ngay_hoan_tat = now() WHERE pcd_ma = $1`,
          [qr.pcd_ma]
        );

        await client.query('COMMIT');
        return { success: true, pcd_ma: qr.pcd_ma };
      }

      // 6.2. QR tất toán cước từ kho (VD: TT0000001DV)
      const qrTatToanRes = await client.query(
        `SELECT * FROM qr_thanh_toan
         WHERE qr_loai = 'DVVC'
         AND dvvc_ma = $1
         AND $2 ~ ('\\y' || qr_ma || '\\y')
         AND qr_trang_thai = 'CHUA_THANH_TOAN'
         ORDER BY LENGTH(qr_ma) DESC
         LIMIT 1 FOR UPDATE`,
        [dvvc_ma, noiDung]
      );

      if (qrTatToanRes.rows.length === 0) {
        await client.query('COMMIT');
        return { skipped: true, reason: 'no_match' };
      }

      const qrTT = qrTatToanRes.rows[0];

      if (Math.floor(Number(payload.transferAmount)) < Math.floor(Number(qrTT.qr_so_tien))) {
        console.log(`⚠️ [MODEL ĐVVC ${dvvc_ma}] Chuyển thiếu tiền!`);
        await client.query('COMMIT');
        return { skipped: true, reason: 'insufficient_amount' };
      }

      await client.query(
        `UPDATE qr_thanh_toan
         SET qr_trang_thai = 'DA_THANH_TOAN', qr_ma_giao_dich = $1, qr_thoi_diem_tt = now()
         WHERE qr_ma = $2`,
        [String(payload.id), qrTT.qr_ma]
      );

      const conLai = await client.query(
        `SELECT COUNT(*)::int AS so_con_lai
         FROM qr_thanh_toan
         WHERE ptt_ma = $1 AND qr_trang_thai = 'CHUA_THANH_TOAN'`,
        [qrTT.ptt_ma]
      );

      if (Number(conLai.rows[0].so_con_lai) === 0) {
        await client.query(
          `UPDATE phieu_tat_toan
           SET ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN', ptt_thoi_diem_hoan_tat = now()
           WHERE ptt_ma = $1`,
          [qrTT.ptt_ma]
        );
        console.log(`✅ CHÚC MỪNG: PHIẾU ${qrTT.ptt_ma} ĐÃ THU ĐỦ TIỀN TỪ TẤT CẢ CÁC BÊN!`);
      }

      await client.query('COMMIT');
      return { success: true, qr_ma: qrTT.qr_ma, ptt_ma: qrTT.ptt_ma };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = TatToanModel;
