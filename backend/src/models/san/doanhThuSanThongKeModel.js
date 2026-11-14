// backend/src/models/san/doanhThuSanThongKeModel.js
// Thống kê DOANH THU SÀN (phí sàn) cho Admin.
// Nguyên tắc:
//  - Doanh thu sàn = tổng ptt_tong_tien_san của phiếu tất toán ĐÃ THU ĐỦ.
//  - Mốc thời gian: ptt_thoi_diem_hoan_tat.
//  - Chi cho ĐVVC = tổng pcd_tong_tien của phiếu chi ĐÃ THANH TOÁN,
//    mốc pcd_ngay_hoan_tat. Bảng phieu_chi_dvvc KHÔNG có kho_ma nên
//    khoản này luôn là số toàn hệ thống.
//  - Lãi = doanh thu sàn - chi cho ĐVVC (chỉ đúng khi không lọc 1 kho).
//  - Quy đổi múi giờ Việt Nam ngay trong SQL.

const pool = require('../../config/db');

const TZ = 'Asia/Ho_Chi_Minh';
const TU = (p) => `(${p}::date::timestamp AT TIME ZONE '${TZ}')`;
const DEN = (p) => `((${p}::date + 1)::timestamp AT TIME ZONE '${TZ}')`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const mapKy = (r) => {
  const doanh_thu_san = num(r.doanh_thu_san);
  const chi_dvvc = num(r.chi_dvvc);
  return {
    doanh_thu_san,
    tra_shop: num(r.tra_shop),
    chi_dvvc,
    lai_san: doanh_thu_san - chi_dvvc,
    so_phieu: num(r.so_phieu),
    so_don: num(r.so_don),
  };
};

const DoanhThuSanThongKeModel = {
  // =========================================================
  // 1. DANH MỤC BỘ LỌC
  // =========================================================
  getDanhMuc: async () => {
    const [khoRes, namRes] = await Promise.all([
      pool.query(`
        SELECT k.kho_ma, k.kho_ten
        FROM kho k
        WHERE EXISTS (
          SELECT 1 FROM phieu_tat_toan p WHERE p.kho_ma = k.kho_ma
        )
        ORDER BY k.kho_ten ASC
      `),
      pool.query(`
        SELECT DISTINCT nam FROM (
          SELECT EXTRACT(YEAR FROM ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
          FROM phieu_tat_toan
          WHERE ptt_thoi_diem_hoan_tat IS NOT NULL
          UNION
          SELECT EXTRACT(YEAR FROM pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
          FROM phieu_chi_dvvc
          WHERE pcd_ngay_hoan_tat IS NOT NULL
        ) x
        WHERE nam IS NOT NULL
        ORDER BY nam DESC
      `),
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
  // 2. TỔNG QUAN: KPI + theo tháng + theo năm + theo kho
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
      don AS (
        SELECT COUNT(DISTINCT c.dts_ma)::int AS so_don
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
      SELECT COALESCE(SUM(ptt_tong_tien_san), 0) AS doanh_thu_san,
             COALESCE(SUM(ptt_tong_tien_shop), 0) AS tra_shop,
             COUNT(*)::int AS so_phieu,
             (SELECT so_don FROM don) AS so_don,
             (SELECT chi_dvvc FROM dvvc) AS chi_dvvc
      FROM ptt
    `;

    // ---------- 2.2. Series 12 tháng ----------
    const thangSql = `
      WITH thang AS (
        SELECT generate_series(
          make_date($2::int, 1, 1),
          make_date($2::int, 12, 1),
          interval '1 month'
        )::date AS thang
      ),
      ptt AS (
        SELECT date_trunc('month', ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::date AS thang,
               SUM(ptt_tong_tien_san) AS doanh_thu_san,
               SUM(ptt_tong_tien_shop) AS tra_shop,
               COUNT(*)::int AS so_phieu
        FROM phieu_tat_toan
        WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND ptt_thoi_diem_hoan_tat >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND ptt_thoi_diem_hoan_tat <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
          AND ($1::varchar IS NULL OR kho_ma = $1)
        GROUP BY 1
      ),
      don AS (
        SELECT date_trunc('month', p.ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::date AS thang,
               COUNT(DISTINCT c.dts_ma)::int AS so_don
        FROM phieu_tat_toan p
        JOIN chitiet_tat_toan c ON c.ptt_ma = p.ptt_ma
        WHERE p.ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND p.ptt_thoi_diem_hoan_tat >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND p.ptt_thoi_diem_hoan_tat <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
          AND ($1::varchar IS NULL OR p.kho_ma = $1)
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
             COALESCE(p.doanh_thu_san, 0) AS doanh_thu_san,
             COALESCE(p.tra_shop, 0) AS tra_shop,
             COALESCE(p.so_phieu, 0) AS so_phieu,
             COALESCE(d.so_don, 0) AS so_don,
             COALESCE(v.chi_dvvc, 0) AS chi_dvvc
      FROM thang
      LEFT JOIN ptt p ON p.thang = thang.thang
      LEFT JOIN don d ON d.thang = thang.thang
      LEFT JOIN dvvc v ON v.thang = thang.thang
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
          SELECT EXTRACT(YEAR FROM pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
          FROM phieu_chi_dvvc
          WHERE pcd_ngay_hoan_tat IS NOT NULL
        ) x
        WHERE nam IS NOT NULL
      ),
      ptt AS (
        SELECT EXTRACT(YEAR FROM ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::int AS nam,
               SUM(ptt_tong_tien_san) AS doanh_thu_san,
               SUM(ptt_tong_tien_shop) AS tra_shop,
               COUNT(*)::int AS so_phieu
        FROM phieu_tat_toan
        WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND ptt_thoi_diem_hoan_tat IS NOT NULL
          AND ($1::varchar IS NULL OR kho_ma = $1)
        GROUP BY 1
      ),
      don AS (
        SELECT EXTRACT(YEAR FROM p.ptt_thoi_diem_hoan_tat AT TIME ZONE '${TZ}')::int AS nam,
               COUNT(DISTINCT c.dts_ma)::int AS so_don
        FROM phieu_tat_toan p
        JOIN chitiet_tat_toan c ON c.ptt_ma = p.ptt_ma
        WHERE p.ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND p.ptt_thoi_diem_hoan_tat IS NOT NULL
          AND ($1::varchar IS NULL OR p.kho_ma = $1)
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
             COALESCE(p.doanh_thu_san, 0) AS doanh_thu_san,
             COALESCE(p.tra_shop, 0) AS tra_shop,
             COALESCE(p.so_phieu, 0) AS so_phieu,
             COALESCE(d.so_don, 0) AS so_don,
             COALESCE(v.chi_dvvc, 0) AS chi_dvvc
      FROM ds_nam
      LEFT JOIN ptt p ON p.nam = ds_nam.nam
      LEFT JOIN don d ON d.nam = ds_nam.nam
      LEFT JOIN dvvc v ON v.nam = ds_nam.nam
      ORDER BY ds_nam.nam ASC
    `;

    // ---------- 2.4. Theo kho ----------
    const khoSql = `
      WITH ptt AS (
        SELECT kho_ma,
               SUM(ptt_tong_tien_san) AS doanh_thu_san,
               SUM(ptt_tong_tien_shop) AS tra_shop,
               COUNT(*)::int AS so_phieu
        FROM phieu_tat_toan
        WHERE ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND ptt_thoi_diem_hoan_tat >= ${TU('$2')}
          AND ptt_thoi_diem_hoan_tat <  ${DEN('$3')}
        GROUP BY kho_ma
      ),
      don AS (
        SELECT p.kho_ma,
               COUNT(DISTINCT c.dts_ma)::int AS so_don
        FROM phieu_tat_toan p
        JOIN chitiet_tat_toan c ON c.ptt_ma = p.ptt_ma
        WHERE p.ptt_trang_thai_thanh_toan = 'DA_THANH_TOAN'
          AND p.ptt_thoi_diem_hoan_tat >= ${TU('$2')}
          AND p.ptt_thoi_diem_hoan_tat <  ${DEN('$3')}
        GROUP BY p.kho_ma
      ),
      kho_all AS (
        SELECT k.kho_ma::text AS kho_ma, k.kho_ten::text AS kho_ten
        FROM kho k
        WHERE EXISTS (SELECT 1 FROM ptt p WHERE p.kho_ma = k.kho_ma)
           OR ($1::varchar IS NOT NULL AND k.kho_ma = $1)
      )
      SELECT k.kho_ma, k.kho_ten,
             COALESCE(p.doanh_thu_san, 0) AS doanh_thu_san,
             COALESCE(p.tra_shop, 0) AS tra_shop,
             COALESCE(p.so_phieu, 0) AS so_phieu,
             COALESCE(d.so_don, 0) AS so_don
      FROM kho_all k
      LEFT JOIN ptt p ON p.kho_ma = k.kho_ma
      LEFT JOIN don d ON d.kho_ma = k.kho_ma
      WHERE ($1::varchar IS NULL OR k.kho_ma = $1)
      ORDER BY COALESCE(p.doanh_thu_san, 0) DESC, k.kho_ten ASC
    `;

    const [kpiRes, thangRes, namRes, khoRes] = await Promise.all([
      pool.query(kpiSql, [kho_ma, tu_ngay, den_ngay]),
      pool.query(thangSql, [kho_ma, nam]),
      pool.query(namSql, [kho_ma]),
      pool.query(khoSql, [kho_ma, tu_ngay, den_ngay]),
    ]);

    const k = kpiRes.rows[0] || {};
    const doanh_thu_san = num(k.doanh_thu_san);
    const chi_dvvc = num(k.chi_dvvc);

    return {
      pham_vi: { kho_ma, nam, tu_ngay, den_ngay },
      kpi: {
        doanh_thu_san,
        tra_shop: num(k.tra_shop),
        chi_dvvc,
        lai_san: doanh_thu_san - chi_dvvc,
        so_phieu: num(k.so_phieu),
        so_don: num(k.so_don),
      },
      theo_thang: thangRes.rows.map((r) => ({
        thang: num(r.thang),
        ...mapKy(r),
      })),
      theo_nam: namRes.rows.map((r) => ({
        nam: num(r.nam),
        ...mapKy(r),
      })),
      theo_kho: khoRes.rows.map((r) => ({
        kho_ma: r.kho_ma,
        kho_ten: r.kho_ten,
        doanh_thu_san: num(r.doanh_thu_san),
        tra_shop: num(r.tra_shop),
        so_phieu: num(r.so_phieu),
        so_don: num(r.so_don),
      })),
    };
  },

  // =========================================================
  // 3. DANH SÁCH PHIẾU TẤT TOÁN
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
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;

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
        [kho_ma, tu_ngay, den_ngay, trang_thai, q, l, offset]
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
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
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
               d.dts_tienvanchuyen, d.dts_tonggiamgiavanchuyen,
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

module.exports = DoanhThuSanThongKeModel;