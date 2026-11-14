// backend/src/models/dvvc/dongTienThongKeModel.js
// Thống kê dòng tiền cho ĐVVC:
//  - Shipper đang giữ COD
//  - Kho đang giữ COD
//  - Sàn còn nợ voucher ship (sàn chưa chuyển)
//  - Sàn đã chuyển trong kỳ
//
// Nguyên tắc:
//  - Mọi số liệu giới hạn theo dvvc_ma.
//  - "Đang giữ" là snapshot hiện tại; biểu đồ là số dư cuối tháng/năm.
//  - Kho của đơn lấy theo shipper đã nộp tiền, sau đó chuyến giao mới nhất.
//  - Loại đơn hủy (trạng thái mới nhất TTDH06) khỏi công nợ sàn.
//  - phieu_chi_dvvc không có kho_ma nên số liệu sàn luôn là toàn ĐVVC.

const pool = require('../../config/db');

const TZ = 'Asia/Ho_Chi_Minh';
const TU = (p) => `(${p}::date::timestamp AT TIME ZONE '${TZ}')`;
const DEN = (p) => `((${p}::date + 1)::timestamp AT TIME ZONE '${TZ}')`;
const MOC = (expr) => `((${expr})::timestamp AT TIME ZONE '${TZ}')`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const khoangThoiGian = (nam, thang) => {
  const y = Number(nam) || new Date().getFullYear();
  const m = Number(thang);
  if (m >= 1 && m <= 12) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = String(m).padStart(2, '0');
    return {
      nam: y,
      thang: m,
      tu_ngay: `${y}-${mm}-01`,
      den_ngay: `${y}-${mm}-${String(last).padStart(2, '0')}`,
    };
  }
  return { nam: y, thang: null, tu_ngay: `${y}-01-01`, den_ngay: `${y}-12-31` };
};

// Đơn không bị hủy: trạng thái mới nhất khác TTDH06
const KHONG_HUY = (alias = 'o') => `
  COALESCE((
    SELECT c.ttdh_ma
    FROM chitiettrangthaidonhang c
    WHERE c.dts_ma = ${alias}.dts_ma
    ORDER BY c.ctttdh_thoidiem DESC
    LIMIT 1
  ), '') <> 'TTDH06'
`;

// Chọn 1 dòng giao hàng cho mỗi đơn:
// ưu tiên đã nộp tiền -> thời điểm nộp mới nhất -> giao mới nhất.
const TTGH_CHON = `
  SELECT DISTINCT ON (t.dts_ma)
         t.dts_ma, t.shipper_ma, t.ttgh_thoidiem,
         t.ttgh_da_nop_tien, t.ttgh_thoidiem_nop
  FROM thongtingiaohang t
  JOIN donhangtheoshop o0 ON o0.dts_ma = t.dts_ma
  WHERE t.ttgh_thoidiem IS NOT NULL
    AND o0.dvvc_ma = $1
  ORDER BY t.dts_ma,
           t.ttgh_da_nop_tien DESC,
           t.ttgh_thoidiem_nop DESC NULLS LAST,
           t.ttgh_thoidiem DESC
`;

// Tiền đang giữ (shipper hoặc kho)
const GIU = `
  SELECT o.dts_ma, o.dts_ngaylap,
         COALESCE(o.dts_tongtienkhachhangthanhtoan, 0) AS cod,
         (COALESCE(o.dts_tongtienhang, 0) - COALESCE(o.dts_tonggiamgiashop, 0)) AS tra_shop,
         COALESCE(o.dts_tongtienphisan, 0) AS tra_san,
         COALESCE(o.dts_tienvanchuyen, 0) AS dvvc_giu,
         t.shipper_ma, s.shipper_ten, s.shipper_sdt,
         s.kho_ma, k.kho_ten,
         t.ttgh_thoidiem, t.ttgh_thoidiem_nop, t.ttgh_da_nop_tien,
         COALESCE((
           SELECT MAX(c.ctttdh_thoidiem)
           FROM chitiettrangthaidonhang c
           WHERE c.dts_ma = o.dts_ma AND c.ttdh_ma = 'TTDH05'
         ), t.ttgh_thoidiem) AS thoi_diem_ghi_nhan,
         CASE
           WHEN t.ttgh_da_nop_tien = false THEN 'SHIPPER'
           WHEN NOT EXISTS (
             SELECT 1 FROM chitiet_tat_toan c WHERE c.dts_ma = o.dts_ma
           ) THEN 'KHO'
           ELSE NULL
         END AS dang_giu
  FROM (${TTGH_CHON}) t
  JOIN donhangtheoshop o ON o.dts_ma = t.dts_ma
  JOIN shipper s ON s.shipper_ma = t.shipper_ma
  JOIN kho k ON k.kho_ma = s.kho_ma
  WHERE o.dvvc_ma = $1
    AND o.dts_trangthaithanhtoan = true
    AND k.dvvc_ma = $1
    AND ($2::varchar IS NULL OR s.kho_ma = $2)
`;

// Kho + shipper của đơn, dùng cho danh sách đơn chưa lập phiếu
const KHO_SHIPPER_CUA_DON = `
  LEFT JOIN LATERAL (
    SELECT s.kho_ma, s.shipper_ma, s.shipper_ten
    FROM thongtingiaohang t
    JOIN shipper s ON s.shipper_ma = t.shipper_ma
    WHERE t.dts_ma = o.dts_ma
    ORDER BY t.ttgh_da_nop_tien DESC,
             t.ttgh_thoidiem_nop DESC NULLS LAST,
             t.ttgh_thoidiem DESC NULLS LAST
    LIMIT 1
  ) kv ON true
`;

const DongTienThongKeModel = {
  // =========================================================
  // 1. DANH MỤC
  // =========================================================
  getDanhMuc: async (dvvc_ma) => {
    const [khoRes, namRes] = await Promise.all([
      pool.query(
        `SELECT kho_ma, kho_ten
         FROM kho
         WHERE dvvc_ma = $1
         ORDER BY kho_ten ASC`,
        [dvvc_ma]
      ),
      pool.query(
        `SELECT DISTINCT nam FROM (
           SELECT EXTRACT(YEAR FROM p.pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
           FROM phieu_chi_dvvc p
           WHERE p.dvvc_ma = $1
             AND p.pcd_trang_thai = 'DA_THANH_TOAN'
             AND p.pcd_ngay_hoan_tat IS NOT NULL
           UNION
           SELECT EXTRACT(YEAR FROM t.ttgh_thoidiem_nop AT TIME ZONE '${TZ}')::int AS nam
           FROM thongtingiaohang t
           JOIN donhangtheoshop o ON o.dts_ma = t.dts_ma
           WHERE o.dvvc_ma = $1
             AND t.ttgh_thoidiem_nop IS NOT NULL
           UNION
           SELECT EXTRACT(YEAR FROM o.dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam
           FROM donhangtheoshop o
           WHERE o.dvvc_ma = $1
             AND o.dts_ngaylap IS NOT NULL
         ) x
         WHERE nam IS NOT NULL
         ORDER BY nam DESC`,
        [dvvc_ma]
      ),
    ]);

    const namHienTai = new Date().getFullYear();
    const dsNam = Array.from(
      new Set([namHienTai, ...namRes.rows.map((r) => num(r.nam))])
    )
      .filter((n) => n > 0)
      .sort((a, b) => b - a);

    return { kho: khoRes.rows, nam: dsNam, nam_hien_tai: namHienTai };
  },

  // =========================================================
  // 2. TỔNG QUAN
  // =========================================================
  getTongQuan: async ({ dvvc_ma, kho_ma = null, nam, thang = null }) => {
    const {
      nam: namSo,
      thang: thangSo,
      tu_ngay,
      den_ngay,
    } = khoangThoiGian(nam, thang);

    // ---------- 2.1. KPI ----------
    const kpiSql = `
      WITH giu AS (${GIU}),
      voucher AS (
        SELECT o.dts_ma,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS tien,
               CASE
                 WHEN EXISTS (
                   SELECT 1
                   FROM chitiet_chi_dvvc c
                   JOIN phieu_chi_dvvc p ON p.pcd_ma = c.pcd_ma
                   WHERE c.dts_ma = o.dts_ma
                     AND p.pcd_trang_thai = 'DA_THANH_TOAN'
                 ) THEN 'DA_CHUYEN'
                 WHEN EXISTS (
                   SELECT 1 FROM chitiet_chi_dvvc c WHERE c.dts_ma = o.dts_ma
                 ) THEN 'CHO_QR'
                 ELSE 'CHUA_LAP'
               END AS trang_thai
        FROM donhangtheoshop o
        WHERE o.dvvc_ma = $1
          AND COALESCE(o.dts_tonggiamgiavanchuyen, 0) > 0
          AND ${KHONG_HUY('o')}
      ),
      sanchuyen AS (
        SELECT COALESCE(SUM(pcd_tong_tien), 0) AS tien,
               COUNT(*)::int AS so_phieu
        FROM phieu_chi_dvvc
        WHERE dvvc_ma = $1
          AND pcd_trang_thai = 'DA_THANH_TOAN'
          AND pcd_ngay_hoan_tat >= ${TU('$3')}
          AND pcd_ngay_hoan_tat <  ${DEN('$4')}
      ),
      phieu_cho AS (
        SELECT COUNT(*)::int AS so_phieu,
               COALESCE(SUM(pcd_tong_tien), 0) AS tien
        FROM phieu_chi_dvvc
        WHERE dvvc_ma = $1
          AND pcd_trang_thai = 'CHO_THANH_TOAN'
      )
      SELECT
        COALESCE(SUM(g.cod) FILTER (WHERE g.dang_giu = 'SHIPPER'), 0) AS shipper_giu,
        (COUNT(*) FILTER (WHERE g.dang_giu = 'SHIPPER'))::int AS shipper_so_don,
        (COUNT(DISTINCT g.shipper_ma) FILTER (WHERE g.dang_giu = 'SHIPPER'))::int AS shipper_so_shipper,
        MIN(g.ttgh_thoidiem) FILTER (WHERE g.dang_giu = 'SHIPPER') AS shipper_cu_nhat,
        COALESCE(SUM(g.cod) FILTER (WHERE g.dang_giu = 'KHO'), 0) AS kho_giu,
        (COUNT(*) FILTER (WHERE g.dang_giu = 'KHO'))::int AS kho_so_don,
        (COUNT(DISTINCT g.kho_ma) FILTER (WHERE g.dang_giu = 'KHO'))::int AS kho_so_kho,
        COALESCE(SUM(g.tra_shop) FILTER (WHERE g.dang_giu IS NOT NULL), 0) AS tra_shop,
        COALESCE(SUM(g.tra_san) FILTER (WHERE g.dang_giu IS NOT NULL), 0) AS tra_san,
        COALESCE(SUM(g.dvvc_giu) FILTER (WHERE g.dang_giu IS NOT NULL), 0) AS dvvc_giu,
        (SELECT COALESCE(SUM(tien), 0) FROM voucher WHERE trang_thai = 'CHUA_LAP') AS san_chua_lap,
        (SELECT COUNT(*)::int FROM voucher WHERE trang_thai = 'CHUA_LAP') AS san_chua_lap_don,
        (SELECT COALESCE(SUM(tien), 0) FROM voucher WHERE trang_thai = 'CHO_QR') AS san_cho_qr,
        (SELECT COUNT(*)::int FROM voucher WHERE trang_thai = 'CHO_QR') AS san_cho_qr_don,
        (SELECT COALESCE(SUM(tien), 0) FROM voucher WHERE trang_thai <> 'DA_CHUYEN') AS san_chua_chuyen,
        (SELECT COUNT(*)::int FROM voucher WHERE trang_thai <> 'DA_CHUYEN') AS san_chua_chuyen_don,
        (SELECT tien FROM sanchuyen) AS san_da_chuyen,
        (SELECT so_phieu FROM sanchuyen) AS san_da_chuyen_phieu,
        (SELECT so_phieu FROM phieu_cho) AS phieu_cho_so_phieu,
        (SELECT tien FROM phieu_cho) AS phieu_cho_tien
      FROM giu g
    `;

    // ---------- 2.2. Series theo tháng ----------
    const thangSql = `
      WITH thang AS (
        SELECT generate_series(
          make_date($3::int, 1, 1),
          make_date($3::int, 12, 1),
          interval '1 month'
        )::date AS thang
      ),
      moc AS (
        SELECT thang, (thang + interval '1 month')::date AS moc_sau
        FROM thang
      ),
      giu AS (${GIU}),
      voucher AS (
        SELECT o.dts_ma,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS tien,
               o.dts_ngaylap
        FROM donhangtheoshop o
        WHERE o.dvvc_ma = $1
          AND COALESCE(o.dts_tonggiamgiavanchuyen, 0) > 0
          AND ${KHONG_HUY('o')}
      ),
      da_chuyen AS (
        SELECT date_trunc('month', p.pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::date AS thang,
               SUM(p.pcd_tong_tien) AS tien,
               COUNT(*)::int AS so_phieu
        FROM phieu_chi_dvvc p
        WHERE p.dvvc_ma = $1
          AND p.pcd_trang_thai = 'DA_THANH_TOAN'
          AND p.pcd_ngay_hoan_tat >= (make_date($3::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND p.pcd_ngay_hoan_tat <  ((make_date($3::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
        GROUP BY 1
      )
      SELECT
        EXTRACT(MONTH FROM m.thang)::int AS thang,
        (SELECT COALESCE(SUM(g.cod), 0)
         FROM giu g
         WHERE g.thoi_diem_ghi_nhan < ${MOC('m.moc_sau')}
           AND (g.ttgh_thoidiem_nop IS NULL
                OR g.ttgh_thoidiem_nop >= ${MOC('m.moc_sau')})
        ) AS shipper_giu,
        (SELECT COALESCE(SUM(g.cod), 0)
         FROM giu g
         WHERE g.ttgh_thoidiem_nop IS NOT NULL
           AND g.ttgh_thoidiem_nop < ${MOC('m.moc_sau')}
           AND NOT EXISTS (
             SELECT 1
             FROM chitiet_tat_toan c
             JOIN phieu_tat_toan p ON p.ptt_ma = c.ptt_ma
             WHERE c.dts_ma = g.dts_ma
               AND p.ptt_ngay_tat_toan < ${MOC('m.moc_sau')}
           )
        ) AS kho_giu,
        (SELECT COALESCE(SUM(v.tien), 0)
         FROM voucher v
         WHERE v.dts_ngaylap < ${MOC('m.moc_sau')}
           AND NOT EXISTS (
             SELECT 1
             FROM chitiet_chi_dvvc c
             JOIN phieu_chi_dvvc p ON p.pcd_ma = c.pcd_ma
             WHERE c.dts_ma = v.dts_ma
               AND p.pcd_trang_thai = 'DA_THANH_TOAN'
               AND p.pcd_ngay_hoan_tat < ${MOC('m.moc_sau')}
           )
        ) AS san_chua_chuyen,
        COALESCE(dc.tien, 0) AS san_da_chuyen,
        COALESCE(dc.so_phieu, 0) AS san_da_chuyen_phieu
      FROM moc m
      LEFT JOIN da_chuyen dc ON dc.thang = m.thang
      ORDER BY m.thang
    `;

    // ---------- 2.3. Series theo năm ----------
    const namSql = `
      WITH ds_nam AS (
        SELECT DISTINCT nam FROM (
          SELECT EXTRACT(YEAR FROM p.pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
          FROM phieu_chi_dvvc p
          WHERE p.dvvc_ma = $1
            AND p.pcd_trang_thai = 'DA_THANH_TOAN'
            AND p.pcd_ngay_hoan_tat IS NOT NULL
          UNION
          SELECT EXTRACT(YEAR FROM t.ttgh_thoidiem_nop AT TIME ZONE '${TZ}')::int AS nam
          FROM thongtingiaohang t
          JOIN donhangtheoshop o ON o.dts_ma = t.dts_ma
          WHERE o.dvvc_ma = $1
            AND t.ttgh_thoidiem_nop IS NOT NULL
          UNION
          SELECT EXTRACT(YEAR FROM o.dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam
          FROM donhangtheoshop o
          WHERE o.dvvc_ma = $1
            AND o.dts_ngaylap IS NOT NULL
        ) x
        WHERE nam IS NOT NULL
      ),
      moc AS (
        SELECT nam, make_date(nam + 1, 1, 1) AS moc_sau
        FROM ds_nam
      ),
      giu AS (${GIU}),
      voucher AS (
        SELECT o.dts_ma,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS tien,
               o.dts_ngaylap
        FROM donhangtheoshop o
        WHERE o.dvvc_ma = $1
          AND COALESCE(o.dts_tonggiamgiavanchuyen, 0) > 0
          AND ${KHONG_HUY('o')}
      ),
      da_chuyen AS (
        SELECT EXTRACT(YEAR FROM p.pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam,
               SUM(p.pcd_tong_tien) AS tien,
               COUNT(*)::int AS so_phieu
        FROM phieu_chi_dvvc p
        WHERE p.dvvc_ma = $1
          AND p.pcd_trang_thai = 'DA_THANH_TOAN'
          AND p.pcd_ngay_hoan_tat IS NOT NULL
        GROUP BY 1
      )
      SELECT
        m.nam,
        (SELECT COALESCE(SUM(g.cod), 0)
         FROM giu g
         WHERE g.thoi_diem_ghi_nhan < ${MOC('m.moc_sau')}
           AND (g.ttgh_thoidiem_nop IS NULL
                OR g.ttgh_thoidiem_nop >= ${MOC('m.moc_sau')})
        ) AS shipper_giu,
        (SELECT COALESCE(SUM(g.cod), 0)
         FROM giu g
         WHERE g.ttgh_thoidiem_nop IS NOT NULL
           AND g.ttgh_thoidiem_nop < ${MOC('m.moc_sau')}
           AND NOT EXISTS (
             SELECT 1
             FROM chitiet_tat_toan c
             JOIN phieu_tat_toan p ON p.ptt_ma = c.ptt_ma
             WHERE c.dts_ma = g.dts_ma
               AND p.ptt_ngay_tat_toan < ${MOC('m.moc_sau')}
           )
        ) AS kho_giu,
        (SELECT COALESCE(SUM(v.tien), 0)
         FROM voucher v
         WHERE v.dts_ngaylap < ${MOC('m.moc_sau')}
           AND NOT EXISTS (
             SELECT 1
             FROM chitiet_chi_dvvc c
             JOIN phieu_chi_dvvc p ON p.pcd_ma = c.pcd_ma
             WHERE c.dts_ma = v.dts_ma
               AND p.pcd_trang_thai = 'DA_THANH_TOAN'
               AND p.pcd_ngay_hoan_tat < ${MOC('m.moc_sau')}
           )
        ) AS san_chua_chuyen,
        COALESCE(dc.tien, 0) AS san_da_chuyen,
        COALESCE(dc.so_phieu, 0) AS san_da_chuyen_phieu
      FROM moc m
      LEFT JOIN da_chuyen dc ON dc.nam = m.nam
      ORDER BY m.nam
    `;

    // ---------- 2.4. Theo kho ----------
    const khoSql = `
      WITH giu AS (${GIU}),
      giu_agg AS (
        SELECT kho_ma,
               COALESCE(SUM(cod) FILTER (WHERE dang_giu = 'SHIPPER'), 0) AS shipper_giu,
               (COUNT(*) FILTER (WHERE dang_giu = 'SHIPPER'))::int AS so_don_shipper,
               (COUNT(DISTINCT shipper_ma) FILTER (WHERE dang_giu = 'SHIPPER'))::int AS so_shipper,
               COALESCE(SUM(cod) FILTER (WHERE dang_giu = 'KHO'), 0) AS kho_giu,
               (COUNT(*) FILTER (WHERE dang_giu = 'KHO'))::int AS so_don_kho,
               COALESCE(SUM(tra_shop) FILTER (WHERE dang_giu IS NOT NULL), 0) AS tra_shop,
               COALESCE(SUM(tra_san) FILTER (WHERE dang_giu IS NOT NULL), 0) AS tra_san,
               COALESCE(SUM(dvvc_giu) FILTER (WHERE dang_giu IS NOT NULL), 0) AS dvvc_giu
        FROM giu
        WHERE dang_giu IS NOT NULL
        GROUP BY kho_ma
      ),
      nhan AS (
        SELECT s.kho_ma,
               COALESCE(SUM(o.dts_tongtienkhachhangthanhtoan), 0) AS tien_nhan,
               (COUNT(DISTINCT o.dts_ma))::int AS so_don_nhan
        FROM (${TTGH_CHON}) t
        JOIN donhangtheoshop o ON o.dts_ma = t.dts_ma
        JOIN shipper s ON s.shipper_ma = t.shipper_ma
        WHERE t.ttgh_da_nop_tien = true
          AND t.ttgh_thoidiem_nop >= ${TU('$3')}
          AND t.ttgh_thoidiem_nop <  ${DEN('$4')}
          AND o.dvvc_ma = $1
        GROUP BY s.kho_ma
      ),
      tat_toan AS (
        SELECT p.kho_ma,
               COALESCE(SUM(p.ptt_tong_tien_shop + p.ptt_tong_tien_san), 0) AS tien_tat_toan,
               COUNT(*)::int AS so_phieu,
               COALESCE(SUM((
                 SELECT COUNT(*) FROM chitiet_tat_toan c WHERE c.ptt_ma = p.ptt_ma
               )), 0)::int AS so_don_tat_toan
        FROM phieu_tat_toan p
        WHERE p.ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND p.ptt_thoi_diem_hoan_tat >= ${TU('$3')}
          AND p.ptt_thoi_diem_hoan_tat <  ${DEN('$4')}
          AND p.kho_ma IN (SELECT kho_ma FROM kho WHERE dvvc_ma = $1)
        GROUP BY p.kho_ma
      )
      SELECT k.kho_ma, k.kho_ten,
             COALESCE(g.so_shipper, 0) AS so_shipper,
             COALESCE(g.so_don_shipper, 0) AS so_don_shipper,
             COALESCE(g.so_don_kho, 0) AS so_don_kho,
             (COALESCE(g.so_don_shipper, 0) + COALESCE(g.so_don_kho, 0)) AS so_don_giu,
             COALESCE(g.shipper_giu, 0) AS shipper_giu,
             COALESCE(g.kho_giu, 0) AS kho_giu,
             (COALESCE(g.shipper_giu, 0) + COALESCE(g.kho_giu, 0)) AS tong_giu,
             COALESCE(g.tra_shop, 0) AS tra_shop,
             COALESCE(g.tra_san, 0) AS tra_san,
             COALESCE(g.dvvc_giu, 0) AS dvvc_giu,
             COALESCE(n.tien_nhan, 0) AS tien_nhan,
             COALESCE(n.so_don_nhan, 0) AS so_don_nhan,
             COALESCE(t.tien_tat_toan, 0) AS tien_tat_toan,
             COALESCE(t.so_phieu, 0) AS so_phieu,
             COALESCE(t.so_don_tat_toan, 0) AS so_don_tat_toan
      FROM kho k
      LEFT JOIN giu_agg g ON g.kho_ma = k.kho_ma
      LEFT JOIN nhan n ON n.kho_ma = k.kho_ma
      LEFT JOIN tat_toan t ON t.kho_ma = k.kho_ma
      WHERE k.dvvc_ma = $1
        AND ($2::varchar IS NULL OR k.kho_ma = $2)
      ORDER BY tong_giu DESC, k.kho_ten ASC
    `;

    // ---------- 2.5. Theo shipper ----------
    const shipperSql = `
      WITH giu AS (${GIU})
      SELECT shipper_ma, shipper_ten, shipper_sdt, kho_ma, kho_ten,
             COUNT(*)::int AS so_don,
             COALESCE(SUM(cod), 0) AS tong_giu,
             COALESCE(SUM(tra_shop), 0) AS tra_shop,
             COALESCE(SUM(tra_san), 0) AS tra_san,
             COALESCE(SUM(dvvc_giu), 0) AS dvvc_giu,
             MIN(ttgh_thoidiem) AS don_cu_nhat,
             FLOOR(EXTRACT(EPOCH FROM (NOW() - MIN(ttgh_thoidiem))) / 86400)::int AS so_ngay_giu
      FROM giu
      WHERE dang_giu = 'SHIPPER'
      GROUP BY shipper_ma, shipper_ten, shipper_sdt, kho_ma, kho_ten
      HAVING COALESCE(SUM(cod), 0) > 0
      ORDER BY tong_giu DESC
    `;

    // ---------- 2.6. Phiếu chờ QR ----------
    const phieuChoSql = `
      SELECT p.pcd_ma, p.pcd_tong_tien, p.pcd_ngay_tao,
             (SELECT COUNT(*)::int
              FROM chitiet_chi_dvvc c
              WHERE c.pcd_ma = p.pcd_ma) AS so_don
      FROM phieu_chi_dvvc p
      WHERE p.dvvc_ma = $1
        AND p.pcd_trang_thai = 'CHO_THANH_TOAN'
      ORDER BY p.pcd_ngay_tao DESC
    `;

    const [kpiRes, thangRes, namRes, khoRes, shipperRes, phieuChoRes] =
      await Promise.all([
        pool.query(kpiSql, [dvvc_ma, kho_ma, tu_ngay, den_ngay]),
        pool.query(thangSql, [dvvc_ma, kho_ma, namSo]),
        pool.query(namSql, [dvvc_ma, kho_ma]),
        pool.query(khoSql, [dvvc_ma, kho_ma, tu_ngay, den_ngay]),
        pool.query(shipperSql, [dvvc_ma, kho_ma]),
        pool.query(phieuChoSql, [dvvc_ma]),
      ]);

    const k = kpiRes.rows[0] || {};
    const shipper_giu = num(k.shipper_giu);
    const kho_giu = num(k.kho_giu);
    const san_chua_chuyen = num(k.san_chua_chuyen);
    const cuNhat = k.shipper_cu_nhat ? new Date(k.shipper_cu_nhat) : null;
    const lauNhat =
      cuNhat && !Number.isNaN(cuNhat.getTime())
        ? Math.max(0, Math.floor((Date.now() - cuNhat.getTime()) / 86400000))
        : 0;

    return {
      pham_vi: { dvvc_ma, kho_ma, nam: namSo, thang: thangSo, tu_ngay, den_ngay },
      kpi: {
        shipper_giu,
        shipper_so_don: num(k.shipper_so_don),
        shipper_so_shipper: num(k.shipper_so_shipper),
        shipper_cu_nhat: k.shipper_cu_nhat || null,
        shipper_lau_nhat_ngay: lauNhat,
        kho_giu,
        kho_so_don: num(k.kho_so_don),
        kho_so_kho: num(k.kho_so_kho),
        tra_shop: num(k.tra_shop),
        tra_san: num(k.tra_san),
        dvvc_giu: num(k.dvvc_giu),
        tong_cod_giu: shipper_giu + kho_giu,
        san_chua_lap: num(k.san_chua_lap),
        san_chua_lap_don: num(k.san_chua_lap_don),
        san_cho_qr: num(k.san_cho_qr),
        san_cho_qr_don: num(k.san_cho_qr_don),
        san_cho_qr_phieu: num(k.phieu_cho_so_phieu),
        san_chua_chuyen,
        san_chua_chuyen_don: num(k.san_chua_chuyen_don),
        san_da_chuyen: num(k.san_da_chuyen),
        san_da_chuyen_phieu: num(k.san_da_chuyen_phieu),
        tong_dang_giu: shipper_giu + kho_giu + san_chua_chuyen,
      },
      theo_thang: thangRes.rows.map((r) => ({
        thang: num(r.thang),
        shipper_giu: num(r.shipper_giu),
        kho_giu: num(r.kho_giu),
        san_chua_chuyen: num(r.san_chua_chuyen),
        san_da_chuyen: num(r.san_da_chuyen),
        san_da_chuyen_phieu: num(r.san_da_chuyen_phieu),
      })),
      theo_nam: namRes.rows.map((r) => ({
        nam: num(r.nam),
        shipper_giu: num(r.shipper_giu),
        kho_giu: num(r.kho_giu),
        san_chua_chuyen: num(r.san_chua_chuyen),
        san_da_chuyen: num(r.san_da_chuyen),
        san_da_chuyen_phieu: num(r.san_da_chuyen_phieu),
      })),
      theo_kho: khoRes.rows.map((r) => ({
        kho_ma: r.kho_ma,
        kho_ten: r.kho_ten,
        so_shipper: num(r.so_shipper),
        so_don_shipper: num(r.so_don_shipper),
        so_don_kho: num(r.so_don_kho),
        so_don_giu: num(r.so_don_giu),
        shipper_giu: num(r.shipper_giu),
        kho_giu: num(r.kho_giu),
        tong_giu: num(r.tong_giu),
        tra_shop: num(r.tra_shop),
        tra_san: num(r.tra_san),
        dvvc_giu: num(r.dvvc_giu),
        tien_nhan: num(r.tien_nhan),
        so_don_nhan: num(r.so_don_nhan),
        tien_tat_toan: num(r.tien_tat_toan),
        so_phieu: num(r.so_phieu),
        so_don_tat_toan: num(r.so_don_tat_toan),
      })),
      theo_shipper: shipperRes.rows.map((r) => ({
        shipper_ma: r.shipper_ma,
        shipper_ten: r.shipper_ten,
        shipper_sdt: r.shipper_sdt,
        kho_ma: r.kho_ma,
        kho_ten: r.kho_ten,
        so_don: num(r.so_don),
        tong_giu: num(r.tong_giu),
        tra_shop: num(r.tra_shop),
        tra_san: num(r.tra_san),
        dvvc_giu: num(r.dvvc_giu),
        don_cu_nhat: r.don_cu_nhat,
        so_ngay_giu: num(r.so_ngay_giu),
      })),
      phieu_cho: phieuChoRes.rows.map((r) => ({
        pcd_ma: r.pcd_ma,
        pcd_tong_tien: num(r.pcd_tong_tien),
        pcd_ngay_tao: r.pcd_ngay_tao,
        so_don: num(r.so_don),
      })),
    };
  },

  // =========================================================
  // 3. DANH SÁCH ĐƠN ĐANG GIỮ
  // =========================================================
  getDonDangGiu: async ({ dvvc_ma, loai, ma, page = 1, limit = 10 }) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;
    const khoFilter = loai === 'kho' ? ma : null;

    const where = `
      WHERE (
        ($4::varchar = 'shipper' AND dang_giu = 'SHIPPER' AND shipper_ma = $3)
        OR ($4::varchar = 'kho' AND dang_giu IS NOT NULL AND kho_ma = $3)
      )
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `
        WITH giu AS (${GIU})
        SELECT dts_ma, dts_ngaylap, ttgh_thoidiem,
               shipper_ma, shipper_ten, shipper_sdt,
               kho_ma, kho_ten, cod, tra_shop, tra_san, dvvc_giu, dang_giu,
               FLOOR(EXTRACT(EPOCH FROM (NOW() - ttgh_thoidiem)) / 86400)::int AS so_ngay_giu
        FROM giu
        ${where}
        ORDER BY ttgh_thoidiem ASC, dts_ma ASC
        LIMIT $5 OFFSET $6
        `,
        [dvvc_ma, khoFilter, ma, loai, l, offset]
      ),
      pool.query(
        `
        WITH giu AS (${GIU})
        SELECT COUNT(*)::int AS total
        FROM giu
        ${where}
        `,
        [dvvc_ma, khoFilter, ma, loai]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => ({
        ...r,
        cod: num(r.cod),
        tra_shop: num(r.tra_shop),
        tra_san: num(r.tra_san),
        dvvc_giu: num(r.dvvc_giu),
        so_ngay_giu: num(r.so_ngay_giu),
      })),
      total,
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
    };
  },

  // =========================================================
  // 4. ĐƠN CHƯA LẬP PHIẾU CHI
  // =========================================================
  getDonChuaLap: async ({ dvvc_ma, kho_ma = null, page = 1, limit = 10 }) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;

    const base = `
      FROM donhangtheoshop o
      JOIN gianhang g ON g.gh_ma = o.gh_ma
      ${KHO_SHIPPER_CUA_DON}
      LEFT JOIN kho k ON k.kho_ma = kv.kho_ma
      WHERE o.dvvc_ma = $1
        AND COALESCE(o.dts_tonggiamgiavanchuyen, 0) > 0
        AND ${KHONG_HUY('o')}
        AND NOT EXISTS (
          SELECT 1 FROM chitiet_chi_dvvc c WHERE c.dts_ma = o.dts_ma
        )
        AND ($2::varchar IS NULL OR kv.kho_ma = $2)
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `
        SELECT o.dts_ma, o.dts_ngaylap,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS tien_san_bu,
               g.gh_ten, kv.kho_ma, k.kho_ten,
               kv.shipper_ma, kv.shipper_ten
        ${base}
        ORDER BY o.dts_ngaylap ASC, o.dts_ma ASC
        LIMIT $3 OFFSET $4
        `,
        [dvvc_ma, kho_ma, l, offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total ${base}`, [dvvc_ma, kho_ma]),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => ({
        ...r,
        tien_san_bu: num(r.tien_san_bu),
      })),
      total,
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
    };
  },

  // =========================================================
  // 5. DANH SÁCH PHIẾU SÀN ĐÃ CHUYỂN
  // =========================================================
    // =========================================================
  // 5. DANH SÁCH PHIẾU SÀN ĐÃ CHUYỂN
  // =========================================================
  getDanhSachPhieu: async ({ dvvc_ma, nam, thang = null, page = 1, limit = 10 }) => {
    const {
      nam: namSo,
      thang: thangSo,
      tu_ngay,
      den_ngay,
    } = khoangThoiGian(nam, thang);
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;

    const where = `
      WHERE p.dvvc_ma = $1
        AND p.pcd_trang_thai = 'DA_THANH_TOAN'
        AND p.pcd_ngay_hoan_tat >= ${TU('$2')}
        AND p.pcd_ngay_hoan_tat <  ${DEN('$3')}
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `
        SELECT p.pcd_ma, p.pcd_tong_tien, p.pcd_trang_thai,
               p.pcd_ngay_tao, p.pcd_ngay_hoan_tat,
               (SELECT COUNT(*)::int FROM chitiet_chi_dvvc c WHERE c.pcd_ma = p.pcd_ma) AS so_don,
               (SELECT COUNT(*)::int FROM qr_chi_dvvc q WHERE q.pcd_ma = p.pcd_ma) AS so_qr,
               (SELECT COUNT(*)::int FROM qr_chi_dvvc q
                WHERE q.pcd_ma = p.pcd_ma AND q.qr_trang_thai = 'DA_THANH_TOAN') AS so_qr_da_tt
        FROM phieu_chi_dvvc p
        ${where}
        ORDER BY p.pcd_ngay_hoan_tat DESC, p.pcd_ma DESC
        LIMIT $4 OFFSET $5
        `,
        [dvvc_ma, tu_ngay, den_ngay, l, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM phieu_chi_dvvc p ${where}`,
        [dvvc_ma, tu_ngay, den_ngay]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => ({
        ...r,
        pcd_tong_tien: num(r.pcd_tong_tien),
        so_don: num(r.so_don),
        so_qr: num(r.so_qr),
        so_qr_da_tt: num(r.so_qr_da_tt),
      })),
      total,
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
      pham_vi: { nam: namSo, thang: thangSo, tu_ngay, den_ngay },
    };
  },

  // =========================================================
  // 6. CHI TIẾT PHIẾU CHI
  // =========================================================
  getPhieuChiTiet: async ({ dvvc_ma, pcd_ma }) => {
    const [phieuRes, donRes, qrRes] = await Promise.all([
      pool.query(
        `
        SELECT p.pcd_ma, p.dvvc_ma, d.dvvc_ten,
               p.pcd_tong_tien, p.pcd_trang_thai,
               p.pcd_ngay_tao, p.pcd_ngay_hoan_tat
        FROM phieu_chi_dvvc p
        JOIN donvivanchuyen d ON d.dvvc_ma = p.dvvc_ma
        WHERE p.pcd_ma = $1 AND p.dvvc_ma = $2
        `,
        [pcd_ma, dvvc_ma]
      ),
      pool.query(
        `
        SELECT c.dts_ma, c.ccd_so_tien,
               o.dts_ngaylap, o.dts_tonggiamgiavanchuyen, o.dts_tienvanchuyen,
               g.gh_ten
        FROM chitiet_chi_dvvc c
        JOIN donhangtheoshop o ON o.dts_ma = c.dts_ma
        LEFT JOIN gianhang g ON g.gh_ma = o.gh_ma
        WHERE c.pcd_ma = $1
        ORDER BY c.dts_ma ASC
        `,
        [pcd_ma]
      ),
      pool.query(
        `
        SELECT qr_ma, qr_so_tien, qr_trang_thai, qr_thoi_diem_tt
        FROM qr_chi_dvvc
        WHERE pcd_ma = $1
        ORDER BY qr_ma ASC
        `,
        [pcd_ma]
      ),
    ]);

    if (!phieuRes.rows[0]) return null;

    return {
      phieu: {
        ...phieuRes.rows[0],
        pcd_tong_tien: num(phieuRes.rows[0].pcd_tong_tien),
      },
      don_hang: donRes.rows.map((r) => ({
        ...r,
        ccd_so_tien: num(r.ccd_so_tien),
        dts_tonggiamgiavanchuyen: num(r.dts_tonggiamgiavanchuyen),
        dts_tienvanchuyen: num(r.dts_tienvanchuyen),
      })),
      qr: qrRes.rows.map((r) => ({
        ...r,
        qr_so_tien: num(r.qr_so_tien),
      })),
    };
  },
};

module.exports = DongTienThongKeModel;