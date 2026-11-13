// backend/src/models/san/dongTienThongKeModel.js
// Toàn bộ query thống kê dòng tiền cho trang Admin.
// Nguyên tắc:
//  - Chỉ tính tiền THỰC THU: phieu_tat_toan có ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
//  - Mốc thời gian: ptt_thoi_diem_hoan_tat (KHÔNG dùng ptt_ngay_tat_toan vì đó là lúc tạo phiếu)
//  - Tiền vào kho: shipper đã nộp tiền (ttgh_da_nop_tien = true) theo ttgh_thoidiem_nop
//  - Quy đổi múi giờ Việt Nam ngay trong SQL, không đổi cấu hình DB

const pool = require('../../config/db');

const TZ = 'Asia/Ho_Chi_Minh';

// Mốc đầu ngày (giờ VN) dưới dạng timestamptz
const TU = (p) => `(${p}::date::timestamp AT TIME ZONE '${TZ}')`;
// Mốc đầu ngày KẾ TIẾP (dùng "<" để bao trọn ngày cuối)
const DEN = (p) => `((${p}::date + 1)::timestamp AT TIME ZONE '${TZ}')`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const DongTienThongKeModel = {
  // =========================================================
  // 1. DANH MỤC BỘ LỌC (kho + các năm có dữ liệu)
  // =========================================================
  getDanhMuc: async () => {
    const [khoRes, namRes] = await Promise.all([
      pool.query(`SELECT kho_ma, kho_ten FROM kho ORDER BY kho_ten ASC`),
      pool.query(`
        SELECT DISTINCT nam FROM (
          SELECT EXTRACT(YEAR FROM ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
          FROM phieu_tat_toan
          WHERE ptt_thoi_diem_hoan_tat IS NOT NULL
          UNION
          SELECT EXTRACT(YEAR FROM ttgh_thoidiem_nop AT TIME ZONE '${TZ}')::int AS nam
          FROM thongtingiaohang
          WHERE ttgh_thoidiem_nop IS NOT NULL
        ) x
        WHERE nam IS NOT NULL
        ORDER BY nam DESC
      `),
    ]);

    const namHienTai = new Date().getFullYear();
    const dsNam = Array.from(
      new Set([namHienTai, ...namRes.rows.map((r) => r.nam)])
    ).sort((a, b) => b - a);

    return { kho: khoRes.rows, nam: dsNam, nam_hien_tai: namHienTai };
  },

  // =========================================================
  // 2. TỔNG QUAN: KPI + series tháng + series năm + theo kho
  // =========================================================
  getTongQuan: async ({ kho_ma = null, nam, tu_ngay, den_ngay }) => {
    // ---------- 2.1. KPI ----------
    const kpiSql = `
      WITH ptt AS (
        SELECT ptt_ma, ptt_tong_tien_san, ptt_tong_tien_shop
        FROM phieu_tat_toan
        WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND ptt_thoi_diem_hoan_tat >= ${TU('$2')}
          AND ptt_thoi_diem_hoan_tat <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR kho_ma = $1)
      ),
      vao AS (
        SELECT COALESCE(SUM(d.dts_tongtienkhachhangthanhtoan), 0) AS tien_vao,
               COUNT(DISTINCT d.dts_ma)::int AS so_don_cod
        FROM thongtingiaohang t
        JOIN donhangtheoshop d ON d.dts_ma = t.dts_ma
        JOIN shipper s ON s.shipper_ma = t.shipper_ma
        WHERE t.ttgh_da_nop_tien = true
          AND t.ttgh_thoidiem_nop >= ${TU('$2')}
          AND t.ttgh_thoidiem_nop <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR s.kho_ma = $1)
      ),
      ra AS (
        SELECT COALESCE(SUM(ptt_tong_tien_shop), 0) AS tra_shop,
               COALESCE(SUM(ptt_tong_tien_san), 0)  AS tra_san,
               COUNT(*)::int AS so_phieu
        FROM ptt
      ),
      don AS (
        SELECT COUNT(*)::int AS so_don_tt
        FROM chitiet_tat_toan c
        WHERE EXISTS (SELECT 1 FROM ptt p WHERE p.ptt_ma = c.ptt_ma)
      ),
      dvvc AS (
        SELECT COALESCE(SUM(pcd_tong_tien), 0) AS chi_dvvc
        FROM phieu_chi_dvvc
        WHERE pcd_trang_thai = 'DA_THANH_TOAN'
          AND pcd_ngay_hoan_tat >= ${TU('$2')}
          AND pcd_ngay_hoan_tat <  ${DEN('$3')}
      )
      SELECT vao.tien_vao, vao.so_don_cod,
             ra.tra_shop, ra.tra_san, ra.so_phieu,
             don.so_don_tt, dvvc.chi_dvvc
      FROM vao, ra, don, dvvc
    `;

    // ---------- 2.2. Series theo 12 tháng của năm được chọn ----------
    const thangSql = `
      WITH thang AS (
        SELECT generate_series(
          make_date($2::int, 1, 1),
          make_date($2::int, 12, 1),
          interval '1 month'
        )::date AS thang
      ),
      vao AS (
        SELECT date_trunc('month', t.ttgh_thoidiem_nop AT TIME ZONE '${TZ}')::date AS thang,
               SUM(d.dts_tongtienkhachhangthanhtoan) AS tien_vao
        FROM thongtingiaohang t
        JOIN donhangtheoshop d ON d.dts_ma = t.dts_ma
        JOIN shipper s ON s.shipper_ma = t.shipper_ma
        WHERE t.ttgh_da_nop_tien = true
          AND t.ttgh_thoidiem_nop >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND t.ttgh_thoidiem_nop <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
          AND ($1::varchar IS NULL OR s.kho_ma = $1)
        GROUP BY 1
      ),
      ra AS (
        SELECT date_trunc('month', ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::date AS thang,
               SUM(ptt_tong_tien_shop) AS tra_shop,
               SUM(ptt_tong_tien_san)  AS tra_san
        FROM phieu_tat_toan
        WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND ptt_thoi_diem_hoan_tat >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND ptt_thoi_diem_hoan_tat <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
          AND ($1::varchar IS NULL OR kho_ma = $1)
        GROUP BY 1
      ),
      dvvc AS (
        SELECT date_trunc('month', pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::date AS thang,
               SUM(pcd_tong_tien) AS chi_dvvc
        FROM phieu_chi_dvvc
        WHERE pcd_trang_thai = 'DA_THANH_TOAN'
          AND pcd_ngay_hoan_tat >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND pcd_ngay_hoan_tat <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
        GROUP BY 1
      )
      SELECT EXTRACT(MONTH FROM thang.thang)::int AS thang,
             COALESCE(v.tien_vao, 0) AS tien_vao,
             COALESCE(r.tra_shop, 0) AS tra_shop,
             COALESCE(r.tra_san, 0)  AS tra_san,
             COALESCE(d.chi_dvvc, 0) AS chi_dvvc
      FROM thang
      LEFT JOIN vao  v ON v.thang = thang.thang
      LEFT JOIN ra   r ON r.thang = thang.thang
      LEFT JOIN dvvc d ON d.thang = thang.thang
      ORDER BY thang.thang
    `;

    // ---------- 2.3. Series theo năm ----------
    const namSql = `
      WITH ds_nam AS (
        SELECT DISTINCT nam FROM (
          SELECT EXTRACT(YEAR FROM ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
          FROM phieu_tat_toan
          WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
            AND ptt_thoi_diem_hoan_tat IS NOT NULL
            AND ($1::varchar IS NULL OR kho_ma = $1)
          UNION
          SELECT EXTRACT(YEAR FROM t.ttgh_thoidiem_nop AT TIME ZONE '${TZ}')::int AS nam
          FROM thongtingiaohang t
          JOIN shipper s ON s.shipper_ma = t.shipper_ma
          WHERE t.ttgh_da_nop_tien = true
            AND t.ttgh_thoidiem_nop IS NOT NULL
            AND ($1::varchar IS NULL OR s.kho_ma = $1)
        ) x
        WHERE nam IS NOT NULL
      ),
      vao AS (
        SELECT EXTRACT(YEAR FROM t.ttgh_thoidiem_nop AT TIME ZONE '${TZ}')::int AS nam,
               SUM(d.dts_tongtienkhachhangthanhtoan) AS tien_vao
        FROM thongtingiaohang t
        JOIN donhangtheoshop d ON d.dts_ma = t.dts_ma
        JOIN shipper s ON s.shipper_ma = t.shipper_ma
        WHERE t.ttgh_da_nop_tien = true
          AND ($1::varchar IS NULL OR s.kho_ma = $1)
        GROUP BY 1
      ),
      ra AS (
        SELECT EXTRACT(YEAR FROM ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::int AS nam,
               SUM(ptt_tong_tien_shop) AS tra_shop,
               SUM(ptt_tong_tien_san)  AS tra_san
        FROM phieu_tat_toan
        WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND ptt_thoi_diem_hoan_tat IS NOT NULL
          AND ($1::varchar IS NULL OR kho_ma = $1)
        GROUP BY 1
      ),
      dvvc AS (
        SELECT EXTRACT(YEAR FROM pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam,
               SUM(pcd_tong_tien) AS chi_dvvc
        FROM phieu_chi_dvvc
        WHERE pcd_trang_thai = 'DA_THANH_TOAN'
          AND pcd_ngay_hoan_tat IS NOT NULL
        GROUP BY 1
      )
      SELECT ds_nam.nam,
             COALESCE(v.tien_vao, 0) AS tien_vao,
             COALESCE(r.tra_shop, 0) AS tra_shop,
             COALESCE(r.tra_san, 0)  AS tra_san,
             COALESCE(d.chi_dvvc, 0) AS chi_dvvc
      FROM ds_nam
      LEFT JOIN vao  v ON v.nam = ds_nam.nam
      LEFT JOIN ra   r ON r.nam = ds_nam.nam
      LEFT JOIN dvvc d ON d.nam = ds_nam.nam
      ORDER BY ds_nam.nam ASC
    `;

    // ---------- 2.4. Bảng theo kho ----------
    const khoSql = `
      WITH vao AS (
        SELECT s.kho_ma,
               SUM(d.dts_tongtienkhachhangthanhtoan) AS tien_vao,
               COUNT(DISTINCT d.dts_ma)::int AS so_don
        FROM thongtingiaohang t
        JOIN donhangtheoshop d ON d.dts_ma = t.dts_ma
        JOIN shipper s ON s.shipper_ma = t.shipper_ma
        WHERE t.ttgh_da_nop_tien = true
          AND t.ttgh_thoidiem_nop >= ${TU('$2')}
          AND t.ttgh_thoidiem_nop <  ${DEN('$3')}
        GROUP BY s.kho_ma
      ),
      ra AS (
        SELECT kho_ma,
               SUM(ptt_tong_tien_shop) AS tra_shop,
               SUM(ptt_tong_tien_san)  AS tra_san,
               COUNT(*)::int AS so_phieu
        FROM phieu_tat_toan
        WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND ptt_thoi_diem_hoan_tat >= ${TU('$2')}
          AND ptt_thoi_diem_hoan_tat <  ${DEN('$3')}
        GROUP BY kho_ma
      )
      SELECT k.kho_ma, k.kho_ten,
             COALESCE(v.tien_vao, 0) AS tien_vao,
             COALESCE(v.so_don, 0)   AS so_don,
             COALESCE(r.tra_shop, 0) AS tra_shop,
             COALESCE(r.tra_san, 0)  AS tra_san,
             COALESCE(r.so_phieu, 0) AS so_phieu
      FROM kho k
      LEFT JOIN vao v ON v.kho_ma = k.kho_ma
      LEFT JOIN ra  r ON r.kho_ma = k.kho_ma
      WHERE ($1::varchar IS NULL OR k.kho_ma = $1)
      ORDER BY COALESCE(r.tra_san, 0) DESC, COALESCE(v.tien_vao, 0) DESC
    `;

    const [kpiRes, thangRes, namRes, khoRes] = await Promise.all([
      pool.query(kpiSql, [kho_ma, tu_ngay, den_ngay]),
      pool.query(thangSql, [kho_ma, nam]),
      pool.query(namSql, [kho_ma]),
      pool.query(khoSql, [kho_ma, tu_ngay, den_ngay]),
    ]);

    const k = kpiRes.rows[0] || {};
    const tien_vao = num(k.tien_vao);
    const tra_shop = num(k.tra_shop);
    const tra_san = num(k.tra_san);
    const chi_dvvc = num(k.chi_dvvc);

    return {
      pham_vi: { kho_ma, nam, tu_ngay, den_ngay },
      kpi: {
        tien_vao,
        tra_shop,
        tra_san,
        chi_dvvc,
        so_phieu: num(k.so_phieu),
        so_don_tt: num(k.so_don_tt),
        so_don_cod: num(k.so_don_cod),
        con_giu: tien_vao - tra_shop - tra_san,
        lai_san: tra_san - chi_dvvc,
      },
      theo_thang: thangRes.rows.map((r) => ({
        thang: num(r.thang),
        tien_vao: num(r.tien_vao),
        tra_shop: num(r.tra_shop),
        tra_san: num(r.tra_san),
        chi_dvvc: num(r.chi_dvvc),
      })),
      theo_nam: namRes.rows.map((r) => ({
        nam: num(r.nam),
        tien_vao: num(r.tien_vao),
        tra_shop: num(r.tra_shop),
        tra_san: num(r.tra_san),
        chi_dvvc: num(r.chi_dvvc),
      })),
      theo_kho: khoRes.rows.map((r) => {
        const vao = num(r.tien_vao);
        const shop = num(r.tra_shop);
        const san = num(r.tra_san);
        return {
          kho_ma: r.kho_ma,
          kho_ten: r.kho_ten,
          tien_vao: vao,
          so_don: num(r.so_don),
          tra_shop: shop,
          tra_san: san,
          so_phieu: num(r.so_phieu),
          con_giu: vao - shop - san,
        };
      }),
    };
  },

  // =========================================================
  // 3. DANH SÁCH GIAO DỊCH (phân trang + tìm kiếm)
  // =========================================================
  getGiaoDich: async ({
    kho_ma = null,
    tu_ngay,
    den_ngay,
    trang_thai = null,
    q = null,
    page = 1,
    limit = 10,
  }) => {
    const offset = (page - 1) * limit;

    const where = `
      WHERE ($1::varchar IS NULL OR p.kho_ma = $1)
        AND COALESCE(p.ptt_thoi_diem_hoan_tat, p.ptt_ngay_tat_toan) >= ${TU('$2')}
        AND COALESCE(p.ptt_thoi_diem_hoan_tat, p.ptt_ngay_tat_toan) <  ${DEN('$3')}
        AND ($4::varchar IS NULL OR p.ptt_trang_thai_thanh_toan = $4)
        AND ($5::text IS NULL
             OR p.ptt_ma ILIKE '%' || $5 || '%'
             OR k.kho_ten ILIKE '%' || $5 || '%')
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `
        SELECT p.ptt_ma,
               p.ptt_ngay_tat_toan,
               p.ptt_thoi_diem_hoan_tat,
               p.ptt_trang_thai_thanh_toan,
               p.ptt_tong_tien_san,
               p.ptt_tong_tien_shop,
               k.kho_ma, k.kho_ten,
               (SELECT COUNT(*)::int FROM chitiet_tat_toan c WHERE c.ptt_ma = p.ptt_ma) AS so_don,
               (SELECT COUNT(*)::int FROM qr_thanh_toan q WHERE q.ptt_ma = p.ptt_ma) AS so_qr,
               (SELECT COUNT(*)::int FROM qr_thanh_toan q
                WHERE q.ptt_ma = p.ptt_ma AND q.qr_trang_thai = 'DA_THANH_TOAN') AS so_qr_da_tt
        FROM phieu_tat_toan p
        JOIN kho k ON k.kho_ma = p.kho_ma
        ${where}
        ORDER BY COALESCE(p.ptt_thoi_diem_hoan_tat, p.ptt_ngay_tat_toan) DESC, p.ptt_ma DESC
        LIMIT $6 OFFSET $7
        `,
        [kho_ma, tu_ngay, den_ngay, trang_thai, q, limit, offset]
      ),
      pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM phieu_tat_toan p
        JOIN kho k ON k.kho_ma = p.kho_ma
        ${where}
        `,
        [kho_ma, tu_ngay, den_ngay, trang_thai, q]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => ({
        ptt_ma: r.ptt_ma,
        ptt_ngay_tat_toan: r.ptt_ngay_tat_toan,
        ptt_thoi_diem_hoan_tat: r.ptt_thoi_diem_hoan_tat,
        ptt_trang_thai_thanh_toan: r.ptt_trang_thai_thanh_toan,
        ptt_tong_tien_san: num(r.ptt_tong_tien_san),
        ptt_tong_tien_shop: num(r.ptt_tong_tien_shop),
        kho_ma: r.kho_ma,
        kho_ten: r.kho_ten,
        so_don: num(r.so_don),
        so_qr: num(r.so_qr),
        so_qr_da_tt: num(r.so_qr_da_tt),
      })),
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  // =========================================================
  // 4. CHI TIẾT MỘT PHIẾU TẤT TOÁN
  // =========================================================
  getPhieuChiTiet: async (ptt_ma) => {
    const [phieuRes, donRes, qrRes] = await Promise.all([
      pool.query(
        `
        SELECT p.ptt_ma, p.kho_ma, k.kho_ten,
               p.ptt_ngay_tat_toan, p.ptt_thoi_diem_hoan_tat,
               p.ptt_trang_thai_thanh_toan,
               p.ptt_tong_tien_san, p.ptt_tong_tien_shop
        FROM phieu_tat_toan p
        JOIN kho k ON k.kho_ma = p.kho_ma
        WHERE p.ptt_ma = $1
        `,
        [ptt_ma]
      ),
      pool.query(
        `
        SELECT c.dts_ma, c.ctt_tien_san, c.ctt_tien_shop,
               d.dts_ngaylap, d.dts_tongtienkhachhangthanhtoan,
               g.gh_ten
        FROM chitiet_tat_toan c
        JOIN donhangtheoshop d ON d.dts_ma = c.dts_ma
        LEFT JOIN gianhang g ON g.gh_ma = d.gh_ma
        WHERE c.ptt_ma = $1
        ORDER BY c.dts_ma ASC
        `,
        [ptt_ma]
      ),
      pool.query(
        `
        SELECT qr_ma, qr_loai, gh_ma, qr_so_tien, qr_trang_thai, qr_thoi_diem_tt
        FROM qr_thanh_toan
        WHERE ptt_ma = $1
        ORDER BY qr_loai ASC, qr_ma ASC
        `,
        [ptt_ma]
      ),
    ]);

    if (!phieuRes.rows[0]) return null;

    return {
      phieu: phieuRes.rows[0],
      don_hang: donRes.rows,
      qr: qrRes.rows,
    };
  },
};

module.exports = DongTienThongKeModel;