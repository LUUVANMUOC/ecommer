const pool = require('../../config/db');

// Các mảnh SQL dùng chung để biết một đơn đã được thu phần nào.
// Bảng chitiet_tat_toan là lịch sử: đơn nằm trong đợt nào thì đợt đó
// là chứng từ cho các khoản thu của đơn. Một QR DA_THANH_TOAN nghĩa là
// phần tiền tương ứng của TẤT CẢ đơn trong đợt đã được thu.
const SQL_DA_THU = {
  san: `EXISTS (
    SELECT 1
    FROM chitiet_tat_toan c
    JOIN qr_thanh_toan q ON q.ptt_ma = c.ptt_ma
    WHERE c.dts_ma = dts.dts_ma
      AND q.qr_loai = 'SAN'
      AND q.qr_trang_thai = 'DA_THANH_TOAN'
  )`,
  shop: `EXISTS (
    SELECT 1
    FROM chitiet_tat_toan c
    JOIN qr_thanh_toan q ON q.ptt_ma = c.ptt_ma
    WHERE c.dts_ma = dts.dts_ma
      AND q.qr_loai = 'SHOP'
      AND q.gh_ma = dts.gh_ma
      AND q.qr_trang_thai = 'DA_THANH_TOAN'
  )`,
  dvvc: `EXISTS (
    SELECT 1
    FROM chitiet_tat_toan c
    JOIN qr_thanh_toan q ON q.ptt_ma = c.ptt_ma
    WHERE c.dts_ma = dts.dts_ma
      AND q.qr_loai = 'DVVC'
      AND q.dvvc_ma = dts.dvvc_ma
      AND q.qr_trang_thai = 'DA_THANH_TOAN'
  )`,
  dangMo: `EXISTS (
    SELECT 1
    FROM chitiet_tat_toan c
    JOIN phieu_tat_toan p ON p.ptt_ma = c.ptt_ma
    WHERE c.dts_ma = dts.dts_ma
      AND p.ptt_trang_thai_thanh_toan = 'CHO_THANH_TOAN'
  )`,
};

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

  // Lấy danh sách QR kèm thông tin ngân hàng để frontend vẽ lại QR.
  // - ptt_ma: lấy 1 đợt (dùng ngay sau khi tạo).
  // - kho_ma: lấy các đợt đang mở của kho (dùng cho mục "Đợt đang mở").
  layDsQr: async (db, { ptt_ma, kho_ma }) => {
    const dieuKien = ptt_ma
      ? 'p.ptt_ma = $1'
      : "p.kho_ma = $1 AND p.ptt_trang_thai_thanh_toan = 'CHO_THANH_TOAN'";

    const res = await db.query(
      `SELECT p.ptt_ma,
              p.ptt_loai,
              p.ptt_ngay_tat_toan,
              p.ptt_trang_thai_thanh_toan,
              q.qr_ma,
              q.qr_loai,
              q.qr_so_tien,
              q.qr_trang_thai,
              q.gh_ma,
              q.dvvc_ma,
              gh.gh_ten,
              ts.nganhang_ten AS san_nganhang_ten,
              ts.so_tai_khoan AS san_so_tai_khoan,
              ts.ten_tai_khoan AS san_ten_tai_khoan,
              nhg.nhg_ten AS shop_nganhang_ten,
              tg.ttnt_gianhang_sotaikhoan AS shop_so_tai_khoan,
              tg.ttnt_gianhang_tentaikhoan AS shop_ten_tai_khoan,
              nhd.nhg_ten AS dvvc_nganhang_ten,
              td.ttnt_dvvc_sotaikhoan AS dvvc_so_tai_khoan,
              td.ttnt_dvvc_tentaikhoan AS dvvc_ten_tai_khoan
       FROM phieu_tat_toan p
       JOIN qr_thanh_toan q ON q.ptt_ma = p.ptt_ma
       LEFT JOIN gianhang gh ON gh.gh_ma = q.gh_ma
       LEFT JOIN thongtinnhantien_gianhang tg ON tg.gh_ma = q.gh_ma
       LEFT JOIN nganhang nhg ON nhg.nhg_ma = tg.nh_ma
       LEFT JOIN thongtinnhantien_dvvc td ON td.dvvc_ma = q.dvvc_ma
       LEFT JOIN nganhang nhd ON nhd.nhg_ma = td.nganhang_ma
       LEFT JOIN LATERAL (
         SELECT t.ttnt_stmdt_sotaikhoan AS so_tai_khoan,
                t.ttnt_stmdt_tentaikhoan AS ten_tai_khoan,
                nh.nhg_ten AS nganhang_ten
         FROM thongtinnhantien_stmdt t
         LEFT JOIN nganhang nh ON nh.nhg_ma = t.nganhang_ma
         LIMIT 1
       ) ts ON true
       WHERE ${dieuKien}
       ORDER BY p.ptt_ngay_tat_toan DESC, q.qr_loai, q.qr_ma`,
      [ptt_ma || kho_ma]
    );

    const map = new Map();
    for (const row of res.rows) {
      if (!map.has(row.ptt_ma)) {
        map.set(row.ptt_ma, {
          ptt_ma: row.ptt_ma,
          ptt_loai: row.ptt_loai,
          ptt_ngay_tat_toan: row.ptt_ngay_tat_toan,
          trang_thai: row.ptt_trang_thai_thanh_toan,
          ds_qr: [],
        });
      }

      const phieu = map.get(row.ptt_ma);
      const ngan_hang =
        row.qr_loai === 'SAN'
          ? {
              nganhang_ten: row.san_nganhang_ten,
              so_tai_khoan: row.san_so_tai_khoan,
              ten_tai_khoan: row.san_ten_tai_khoan,
            }
          : row.qr_loai === 'SHOP'
            ? {
                nganhang_ten: row.shop_nganhang_ten,
                so_tai_khoan: row.shop_so_tai_khoan,
                ten_tai_khoan: row.shop_ten_tai_khoan,
              }
            : {
                nganhang_ten: row.dvvc_nganhang_ten,
                so_tai_khoan: row.dvvc_so_tai_khoan,
                ten_tai_khoan: row.dvvc_ten_tai_khoan,
              };

      phieu.ds_qr.push({
        qr_ma: row.qr_ma,
        qr_loai: row.qr_loai,
        qr_so_tien: Number(row.qr_so_tien),
        qr_trang_thai: row.qr_trang_thai,
        gh_ma: row.gh_ma,
        dvvc_ma: row.dvvc_ma,
        ten:
          row.qr_loai === 'SAN'
            ? 'Sàn'
            : row.qr_loai === 'SHOP'
              ? row.gh_ten || 'Shop'
              : 'ĐVVC',
        ngan_hang,
      });
    }

    const ds = [...map.values()];
    const thuTu = { SAN: 0, SHOP: 1, DVVC: 2 };

    for (const phieu of ds) {
      phieu.ds_qr.sort(
        (a, b) =>
          (thuTu[a.qr_loai] ?? 9) - (thuTu[b.qr_loai] ?? 9) ||
          String(a.qr_ma).localeCompare(String(b.qr_ma))
      );
      phieu.tong_tien = phieu.ds_qr.reduce(
        (sum, qr) => sum + qr.qr_so_tien,
        0
      );
      phieu.da_thu = phieu.ds_qr
        .filter((qr) => qr.qr_trang_thai === 'DA_THANH_TOAN')
        .reduce((sum, qr) => sum + qr.qr_so_tien, 0);
      phieu.so_qr = phieu.ds_qr.length;
      phieu.so_qr_da_tra = phieu.ds_qr.filter(
        (qr) => qr.qr_trang_thai === 'DA_THANH_TOAN'
      ).length;
    }

    return ds;
  },

  // 1. Lấy danh sách các đơn hàng cần tất toán
  getDuLieuTatToan: async (kho_ma) => {
    const query = `
      SELECT * FROM (
        SELECT DISTINCT ON (dts.dts_ma)
          dts.dts_ma AS "DTS_Ma",
          dts.dts_tongtienhang AS "TienHang",
          dts.dts_tongtienphisan AS "PhiSanGoc",
          (dts.dts_tongtienhang - COALESCE(dts.dts_tonggiamgiashop, 0)) AS "TienShopGoc",
          COALESCE(dts.dts_tienvanchuyen, 0) AS "TienDVVVGoc",
          ${SQL_DA_THU.san} AS "DaThuSan",
          ${SQL_DA_THU.shop} AS "DaThuShop",
          ${SQL_DA_THU.dvvc} AS "DaThuDVVC",
          CASE WHEN ${SQL_DA_THU.san}
               THEN 0 ELSE COALESCE(dts.dts_tongtienphisan, 0) END AS "PhiSan",
          CASE WHEN ${SQL_DA_THU.shop}
               THEN 0 ELSE (COALESCE(dts.dts_tongtienhang, 0) - COALESCE(dts.dts_tonggiamgiashop, 0)) END AS "TienShop",
          CASE WHEN ${SQL_DA_THU.dvvc}
               THEN 0 ELSE COALESCE(dts.dts_tienvanchuyen, 0) END AS "TienDVVC",
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
          AND NOT ${SQL_DA_THU.dangMo}
          AND NOT EXISTS (
            SELECT 1 FROM giu_tien_su_co g
            WHERE g.dts_ma = dts.dts_ma AND g.gtsc_trang_thai = 'DANG_GIU'
          )
        ORDER BY dts.dts_ma,
                 ttgh.ttgh_thoidiem_nop DESC NULLS LAST,
                 ttgh.ttgh_thoidiem DESC NULLS LAST
      ) x
      WHERE ("PhiSan" > 0 OR "TienShop" > 0)
    `;

    const [sanRes, dvvcRes, ordersRes, phieuDangMo] = await Promise.all([
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
      TatToanModel.layDsQr(pool, { kho_ma }),
    ]);

    return {
      thongTinSan: sanRes.rows[0] || null,
      thongTinDVVC: dvvcRes.rows[0] || null,
      orders: ordersRes.rows,
      phieuDangMo,
    };
  },

  // 2. Tạo đợt tất toán và sinh các QR cho phần còn phải thu
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

      // Khoá các đơn để hai lần bấm liên tiếp không tạo 2 đợt cho cùng đơn.
      await client.query(
        `SELECT dts_ma FROM donhangtheoshop
         WHERE dts_ma = ANY($1::varchar[])
         ORDER BY dts_ma
         FOR UPDATE`,
        [ds_dts_ma]
      );

      // Tính lại phần còn phải thu từ DB, không tin số tiền phía client.
      const donRes = await client.query(
        `SELECT DISTINCT ON (dts.dts_ma)
           dts.dts_ma,
           dts.gh_ma,
           COALESCE(dts.dts_tongtienhang, 0) AS tien_hang,
           COALESCE(dts.dts_tonggiamgiashop, 0) AS giam_gia_shop,
           COALESCE(dts.dts_tongtienphisan, 0) AS tien_san,
           COALESCE(dts.dts_tienvanchuyen, 0) AS tien_dvvc,
           ${SQL_DA_THU.san} AS da_thu_san,
           ${SQL_DA_THU.shop} AS da_thu_shop,
           ${SQL_DA_THU.dvvc} AS da_thu_dvvc
         FROM donhangtheoshop dts
         JOIN thongtingiaohang ttgh ON dts.dts_ma = ttgh.dts_ma
         WHERE dts.dts_ma = ANY($2::varchar[])
           AND ttgh.ttgh_da_nop_tien = true
           AND EXISTS (
             SELECT 1 FROM kho k
             WHERE k.kho_ma = $1 AND k.dvvc_ma = dts.dvvc_ma
           )
           AND NOT ${SQL_DA_THU.dangMo}
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
          'Một số đơn không còn hợp lệ để tất toán (đang trong đợt khác, đã tất toán hoặc đang bị giữ tiền). Vui lòng tải lại trang.'
        );
      }

      let tongSan = 0;
      let tongDVVC = 0;
      const shopMap = new Map();
      const chiTiet = [];

      for (const don of donRes.rows) {
        const tienSan = don.da_thu_san ? 0 : Number(don.tien_san);
        const tienShop = don.da_thu_shop
          ? 0
          : Number(don.tien_hang) - Number(don.giam_gia_shop);
        const tienDVVC = don.da_thu_dvvc ? 0 : Number(don.tien_dvvc);

        if (tienSan + tienShop === 0) {
          if (tienDVVC > 0) {
            throw new Error(
              `Đơn ${don.dts_ma} chỉ còn cước ĐVVC. Vui lòng dùng mục "Tất toán cước tồn".`
            );
          }
          throw new Error(`Đơn ${don.dts_ma} không còn khoản nào cần thu.`);
        }

        tongSan += tienSan;
        tongDVVC += tienDVVC;
        if (!shopMap.has(don.gh_ma)) shopMap.set(don.gh_ma, 0);
        shopMap.set(don.gh_ma, shopMap.get(don.gh_ma) + tienShop);

        chiTiet.push({
          dts_ma: don.dts_ma,
          tien_san: tienSan,
          tien_shop: tienShop,
          tien_dvvc: tienDVVC,
        });
      }

      const tongShop = [...shopMap.values()].reduce((sum, tien) => sum + tien, 0);

      if (tongSan + tongShop + tongDVVC <= 0) {
        throw new Error('Các đơn đã chọn không còn khoản nào cần thu.');
      }

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

      // Lưu đợt tất toán
      await client.query(
        `INSERT INTO phieu_tat_toan
           (ptt_ma, kho_ma, ptt_tong_tien_san, ptt_tong_tien_shop, ptt_tong_tien_dvvc,
            ptt_loai, ptt_trang_thai_thanh_toan)
         VALUES ($1, $2, $3, $4, $5, 'DAY_DU', 'CHO_THANH_TOAN')`,
        [newPttMa, kho_ma, tongSan, tongShop, tongDVVC]
      );

      // Lưu chi tiết: chỉ ghi phần còn phải thu của đợt này.
      for (const ct of chiTiet) {
        await client.query(
          `INSERT INTO chitiet_tat_toan
             (ptt_ma, dts_ma, ctt_tien_san, ctt_tien_shop, ctt_tien_dvvc)
           VALUES ($1, $2, $3, $4, $5)`,
          [newPttMa, ct.dts_ma, ct.tien_san, ct.tien_shop, ct.tien_dvvc]
        );
      }

      // Chỉ tạo QR cho bên có tiền > 0.
      if (tongSan > 0) {
        await client.query(
          `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, qr_so_tien)
           VALUES ($1, $2, 'SAN', $3)`,
          [`TT${newPttMa}S`, newPttMa, tongSan]
        );
      }

      for (const [gh_ma, tongTienShop] of shopMap.entries()) {
        if (tongTienShop <= 0) continue;
        await client.query(
          `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, gh_ma, qr_so_tien)
           VALUES ($1, $2, 'SHOP', $3, $4)`,
          [`TT${newPttMa}SH${gh_ma}`, newPttMa, gh_ma, tongTienShop]
        );
      }

      if (tongDVVC > 0) {
        await client.query(
          `INSERT INTO qr_thanh_toan (qr_ma, ptt_ma, qr_loai, qr_so_tien, dvvc_ma)
           VALUES ($1, $2, 'DVVC', $3, $4)`,
          [`TT${newPttMa}DV`, newPttMa, tongDVVC, thongTinDVVC.dvvc_ma]
        );
      }

      const [phieu] = await TatToanModel.layDsQr(client, {
        ptt_ma: newPttMa,
      });

      await client.query('COMMIT');
      return {
        ptt_ma: newPttMa,
        tong_tien: tongSan + tongShop + tongDVVC,
        tong_san: tongSan,
        tong_shop: tongShop,
        tong_dvvc: tongDVVC,
        ds_qr: phieu?.ds_qr || [],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 2b. Danh sách đơn đã thu xong Sàn/Shop nhưng còn thiếu cước ĐVVC
  getDuLieuCuocTon: async (kho_ma) => {
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
        `SELECT DISTINCT ON (dts.dts_ma)
           dts.dts_ma AS "DTS_Ma",
           dts.gh_ma AS "GH_Ma",
           gh.gh_ten AS "TenShop",
           COALESCE(dts.dts_tienvanchuyen, 0) AS "TienDVVC",
           goc.ptt_ma AS "PTT_Goc",
           goc.thoi_diem AS "NgayTatToan"
         FROM donhangtheoshop dts
         JOIN gianhang gh ON gh.gh_ma = dts.gh_ma
         LEFT JOIN LATERAL (
           SELECT p.ptt_ma,
                  COALESCE(p.ptt_thoi_diem_hoan_tat, p.ptt_ngay_tat_toan) AS thoi_diem
           FROM chitiet_tat_toan c
           JOIN phieu_tat_toan p ON p.ptt_ma = c.ptt_ma
           WHERE c.dts_ma = dts.dts_ma
             AND p.kho_ma = $1
             AND p.ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
           ORDER BY p.ptt_ngay_tat_toan DESC
           LIMIT 1
         ) goc ON true
         WHERE dts.dvvc_ma = (SELECT dvvc_ma FROM kho WHERE kho_ma = $1)
           AND COALESCE(dts.dts_tienvanchuyen, 0) > 0
           AND (
             COALESCE(dts.dts_tongtienphisan, 0) <= 0
             OR ${SQL_DA_THU.san}
           )
           AND (
             COALESCE(dts.dts_tongtienhang, 0) - COALESCE(dts.dts_tonggiamgiashop, 0) <= 0
             OR ${SQL_DA_THU.shop}
           )
           AND NOT ${SQL_DA_THU.dvvc}
           AND NOT ${SQL_DA_THU.dangMo}
           AND NOT EXISTS (
             SELECT 1 FROM giu_tien_su_co g
             WHERE g.dts_ma = dts.dts_ma AND g.gtsc_trang_thai = 'DANG_GIU'
           )
         ORDER BY dts.dts_ma DESC`,
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

      // Khoá các đơn để hai lần bấm liên tiếp không tạo 2 đợt cho cùng đơn.
      await client.query(
        `SELECT dts_ma FROM donhangtheoshop
         WHERE dts_ma = ANY($1::varchar[])
         ORDER BY dts_ma
         FOR UPDATE`,
        [ds_dts_ma]
      );

      const donRes = await client.query(
        `SELECT dts.dts_ma, COALESCE(dts.dts_tienvanchuyen, 0) AS tien_dvvc
         FROM donhangtheoshop dts
         WHERE dts.dts_ma = ANY($2::varchar[])
           AND dts.dvvc_ma = $3
           AND COALESCE(dts.dts_tienvanchuyen, 0) > 0
           AND EXISTS (
             SELECT 1 FROM thongtingiaohang ttgh
             WHERE ttgh.dts_ma = dts.dts_ma AND ttgh.ttgh_da_nop_tien = true
           )
           AND (
             COALESCE(dts.dts_tongtienphisan, 0) <= 0
             OR ${SQL_DA_THU.san}
           )
           AND (
             COALESCE(dts.dts_tongtienhang, 0) - COALESCE(dts.dts_tonggiamgiashop, 0) <= 0
             OR ${SQL_DA_THU.shop}
           )
           AND NOT ${SQL_DA_THU.dvvc}
           AND NOT ${SQL_DA_THU.dangMo}
           AND NOT EXISTS (
             SELECT 1 FROM giu_tien_su_co g
             WHERE g.dts_ma = dts.dts_ma AND g.gtsc_trang_thai = 'DANG_GIU'
           )
         ORDER BY dts.dts_ma`,
        [kho_ma, ds_dts_ma, thongTinDVVC.dvvc_ma]
      );

      if (donRes.rows.length !== ds_dts_ma.length) {
        throw new Error(
          'Một số đơn cước tồn không còn hợp lệ (đã được tất toán hoặc đang trong đợt khác). Vui lòng tải lại trang.'
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

      const [phieu] = await TatToanModel.layDsQr(client, {
        ptt_ma: newPttMa,
      });

      await client.query('COMMIT');
      return {
        ptt_ma: newPttMa,
        tong_tien: tongDVVC,
        tong_san: 0,
        tong_shop: 0,
        tong_dvvc: tongDVVC,
        ds_qr: phieu?.ds_qr || [],
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
          `UPDATE phieu_tat_toan SET ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN', ptt_thoi_diem_hoan_tat = now() WHERE ptt_ma = $1 AND ptt_trang_thai_thanh_toan = 'CHO_THANH_TOAN'`,
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
          `UPDATE phieu_tat_toan SET ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN', ptt_thoi_diem_hoan_tat = now() WHERE ptt_ma = $1 AND ptt_trang_thai_thanh_toan = 'CHO_THANH_TOAN'`,
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

  // 5. Huỷ đợt tất toán: KHÔNG xoá dữ liệu.
  //    - QR chưa thu chuyển sang HUY.
  //    - QR đã thu giữ nguyên DA_THANH_TOAN (không mất dấu khoản đã nhận).
  //    - Đợt chuyển HUY; đơn quay lại danh sách với phần chưa thu.
  huyDot: async (ptt_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const phieuRes = await client.query(
        `SELECT ptt_ma, ptt_trang_thai_thanh_toan
         FROM phieu_tat_toan
         WHERE ptt_ma = $1
         FOR UPDATE`,
        [ptt_ma]
      );
      const phieu = phieuRes.rows[0];

      if (!phieu) {
        throw new Error('Không tìm thấy đợt tất toán.');
      }
      if (phieu.ptt_trang_thai_thanh_toan === 'DA_THANH_TOAN') {
        throw new Error('Đợt tất toán đã thu đủ tiền, không thể huỷ.');
      }
      if (phieu.ptt_trang_thai_thanh_toan === 'HUY') {
        await client.query('COMMIT');
        return { ptt_ma, trang_thai: 'HUY', da_thu: 0 };
      }

      await client.query(
        `UPDATE qr_thanh_toan
         SET qr_trang_thai = 'HUY'
         WHERE ptt_ma = $1 AND qr_trang_thai = 'CHUA_THANH_TOAN'`,
        [ptt_ma]
      );

      await client.query(
        `UPDATE phieu_tat_toan
         SET ptt_trang_thai_thanh_toan = 'HUY'
         WHERE ptt_ma = $1`,
        [ptt_ma]
      );

      const daThuRes = await client.query(
        `SELECT COALESCE(SUM(qr_so_tien), 0) AS da_thu
         FROM qr_thanh_toan
         WHERE ptt_ma = $1 AND qr_trang_thai = 'DA_THANH_TOAN'`,
        [ptt_ma]
      );

      await client.query('COMMIT');
      return {
        ptt_ma,
        trang_thai: 'HUY',
        da_thu: Number(daThuRes.rows[0].da_thu),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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
           WHERE ptt_ma = $1 AND ptt_trang_thai_thanh_toan = 'CHO_THANH_TOAN'`,
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
