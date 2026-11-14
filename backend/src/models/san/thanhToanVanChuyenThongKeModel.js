// backend/src/models/san/thanhToanVanChuyenThongKeModel.js
// Thống kê chi trả voucher vận chuyển cho Admin.
// Nguyên tắc:
//  - "Phát sinh" tính theo ngày lập đơn (dts_ngaylap)
//  - "Đã chi" tính theo ngày hoàn tất phiếu (pcd_ngay_hoan_tat)
//  - "Công nợ hiện tại" = đơn chưa vào phiếu + phiếu đang chờ QR (snapshot)
//  - Quy đổi múi giờ Việt Nam ngay trong SQL
//  - nam = null/'' => xem toàn bộ thời gian (mọi năm)

const pool = require('../../config/db');
const ThanhToanVanChuyenModel = require('./thanhToanVanChuyenModel');

const TZ = 'Asia/Ho_Chi_Minh';
const TU = (p) => `(${p}::date::timestamp AT TIME ZONE '${TZ}')`;
const DEN = (p) => `((${p}::date + 1)::timestamp AT TIME ZONE '${TZ}')`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Có chọn năm cụ thể hay không
const coNam = (nam) => {
  const y = Number(nam);
  return Number.isFinite(y) && y > 0;
};

// Khoảng ngày lọc. Không có năm => toàn bộ thời gian.
const khoangThoiGian = (nam, thang) => {
  const y = Number(nam);
  if (!Number.isFinite(y) || y <= 0) {
    return { tu_ngay: '1900-01-01', den_ngay: '9999-12-31' };
  }

  const m = thang ? Number(thang) : null;
  if (m >= 1 && m <= 12) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = String(m).padStart(2, '0');
    return {
      tu_ngay: `${y}-${mm}-01`,
      den_ngay: `${y}-${mm}-${String(last).padStart(2, '0')}`,
    };
  }
  return { tu_ngay: `${y}-01-01`, den_ngay: `${y}-12-31` };
};

const ThanhToanVanChuyenThongKeModel = {
  // =========================================================
  // 1. DANH MỤC BỘ LỌC
  // =========================================================
  getDanhMuc: async () => {
    const [dvvcRes, namRes] = await Promise.all([
      pool.query(
        `SELECT dvvc_ma, dvvc_ten FROM donvivanchuyen ORDER BY dvvc_ten ASC`
      ),
      pool.query(`
        SELECT DISTINCT nam FROM (
          SELECT EXTRACT(YEAR FROM dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam
          FROM donhangtheoshop
          WHERE dts_tonggiamgiavanchuyen > 0 AND dts_ngaylap IS NOT NULL
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

    return { dvvc: dvvcRes.rows, nam: dsNam, nam_hien_tai: namHienTai };
  },

  // =========================================================
  // 2. TỔNG QUAN
  // =========================================================
  getTongQuan: async ({ dvvc_ma = null, nam = null, thang = null }) => {
    await ThanhToanVanChuyenModel.donDepPhieuQuaHan();

    const namChon = coNam(nam) ? Number(nam) : null;
    const thangSo = Number(thang);
    const thangChon =
      namChon && thangSo >= 1 && thangSo <= 12 ? thangSo : null;

    const { tu_ngay, den_ngay } = khoangThoiGian(namChon, thangChon);

    // ---------- 2.1. KPI ----------
    const kpiSql = `
      WITH phat_sinh AS (
        SELECT COALESCE(SUM(o.dts_tonggiamgiavanchuyen), 0) AS phat_sinh,
               COUNT(*)::int AS so_don_phat_sinh
        FROM donhangtheoshop o
        WHERE o.dts_tonggiamgiavanchuyen > 0
          AND o.dts_ngaylap >= ${TU('$2')}
          AND o.dts_ngaylap <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
      ),
      da_chi AS (
        SELECT COALESCE(SUM(p.pcd_tong_tien), 0) AS da_chi,
               COUNT(*)::int AS so_phieu
        FROM phieu_chi_dvvc p
        WHERE p.pcd_trang_thai = 'DA_THANH_TOAN'
          AND p.pcd_ngay_hoan_tat >= ${TU('$2')}
          AND p.pcd_ngay_hoan_tat <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
      ),
      da_chi_all AS (
        SELECT COALESCE(SUM(p.pcd_tong_tien), 0) AS da_chi_all
        FROM phieu_chi_dvvc p
        WHERE p.pcd_trang_thai = 'DA_THANH_TOAN'
          AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
      ),
      chua_lap AS (
        SELECT COALESCE(SUM(o.dts_tonggiamgiavanchuyen), 0) AS no_chua_lap,
               COUNT(*)::int AS so_don_no
        FROM donhangtheoshop o
        WHERE o.dts_tonggiamgiavanchuyen > 0
          AND NOT EXISTS (
            SELECT 1 FROM chitiet_chi_dvvc c WHERE c.dts_ma = o.dts_ma
          )
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
      ),
      dang_cho AS (
        SELECT COALESCE(SUM(p.pcd_tong_tien), 0) AS cho_qr,
               COUNT(*)::int AS so_phieu_cho
        FROM phieu_chi_dvvc p
        WHERE p.pcd_trang_thai = 'CHO_THANH_TOAN'
          AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
      ),
      dvvc_no AS (
        SELECT COUNT(DISTINCT dvvc_ma)::int AS so_dvvc_cong_no
        FROM (
          SELECT o.dvvc_ma
          FROM donhangtheoshop o
          WHERE o.dts_tonggiamgiavanchuyen > 0
            AND NOT EXISTS (
              SELECT 1 FROM chitiet_chi_dvvc c WHERE c.dts_ma = o.dts_ma
            )
            AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
          UNION
          SELECT p.dvvc_ma
          FROM phieu_chi_dvvc p
          WHERE p.pcd_trang_thai = 'CHO_THANH_TOAN'
            AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
        ) x
      )
      SELECT phat_sinh.*, da_chi.*, da_chi_all.*, chua_lap.*, dang_cho.*, dvvc_no.*
      FROM phat_sinh, da_chi, da_chi_all, chua_lap, dang_cho, dvvc_no
    `;

    // ---------- 2.2. Series 12 tháng (chỉ khi chọn 1 năm cụ thể) ----------
    const thangSql = `
      WITH thang AS (
        SELECT generate_series(
          make_date($2::int, 1, 1),
          make_date($2::int, 12, 1),
          interval '1 month'
        )::date AS thang
      ),
      ps AS (
        SELECT date_trunc('month', o.dts_ngaylap AT TIME ZONE '${TZ}')::date AS thang,
               SUM(o.dts_tonggiamgiavanchuyen) AS phat_sinh,
               COUNT(*)::int AS so_don
        FROM donhangtheoshop o
        WHERE o.dts_tonggiamgiavanchuyen > 0
          AND o.dts_ngaylap >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND o.dts_ngaylap <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
        GROUP BY 1
      ),
      dc AS (
        SELECT date_trunc('month', p.pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::date AS thang,
               SUM(p.pcd_tong_tien) AS da_chi,
               COUNT(*)::int AS so_phieu
        FROM phieu_chi_dvvc p
        WHERE p.pcd_trang_thai = 'DA_THANH_TOAN'
          AND p.pcd_ngay_hoan_tat >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND p.pcd_ngay_hoan_tat <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
          AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
        GROUP BY 1
      )
      SELECT EXTRACT(MONTH FROM thang.thang)::int AS thang,
             COALESCE(ps.phat_sinh, 0) AS phat_sinh,
             COALESCE(ps.so_don, 0) AS so_don,
             COALESCE(dc.da_chi, 0) AS da_chi,
             COALESCE(dc.so_phieu, 0) AS so_phieu
      FROM thang
      LEFT JOIN ps ON ps.thang = thang.thang
      LEFT JOIN dc ON dc.thang = thang.thang
      ORDER BY thang.thang
    `;

    // ---------- 2.3. Series theo năm (luôn toàn bộ các năm) ----------
    const namSql = `
      WITH ds_nam AS (
        SELECT DISTINCT nam FROM (
          SELECT EXTRACT(YEAR FROM dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam
          FROM donhangtheoshop
          WHERE dts_tonggiamgiavanchuyen > 0
            AND dts_ngaylap IS NOT NULL
            AND ($1::varchar IS NULL OR dvvc_ma = $1)
          UNION
          SELECT EXTRACT(YEAR FROM pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam
          FROM phieu_chi_dvvc
          WHERE pcd_ngay_hoan_tat IS NOT NULL
            AND ($1::varchar IS NULL OR dvvc_ma = $1)
        ) x
        WHERE nam IS NOT NULL
      ),
      ps AS (
        SELECT EXTRACT(YEAR FROM o.dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam,
               SUM(o.dts_tonggiamgiavanchuyen) AS phat_sinh
        FROM donhangtheoshop o
        WHERE o.dts_tonggiamgiavanchuyen > 0
          AND o.dts_ngaylap IS NOT NULL
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
        GROUP BY 1
      ),
      dc AS (
        SELECT EXTRACT(YEAR FROM p.pcd_ngay_hoan_tat AT TIME ZONE '${TZ}')::int AS nam,
               SUM(p.pcd_tong_tien) AS da_chi,
               COUNT(*)::int AS so_phieu
        FROM phieu_chi_dvvc p
        WHERE p.pcd_trang_thai = 'DA_THANH_TOAN'
          AND p.pcd_ngay_hoan_tat IS NOT NULL
          AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
        GROUP BY 1
      )
      SELECT ds_nam.nam,
             COALESCE(ps.phat_sinh, 0) AS phat_sinh,
             COALESCE(dc.da_chi, 0) AS da_chi,
             COALESCE(dc.so_phieu, 0) AS so_phieu
      FROM ds_nam
      LEFT JOIN ps ON ps.nam = ds_nam.nam
      LEFT JOIN dc ON dc.nam = ds_nam.nam
      ORDER BY ds_nam.nam ASC
    `;

    // ---------- 2.4. Theo ĐVVC ----------
    const dvvcSql = `
      WITH ps AS (
        SELECT o.dvvc_ma,
               SUM(o.dts_tonggiamgiavanchuyen) AS phat_sinh,
               COUNT(*)::int AS so_don
        FROM donhangtheoshop o
        WHERE o.dts_tonggiamgiavanchuyen > 0
          AND o.dts_ngaylap >= ${TU('$2')}
          AND o.dts_ngaylap <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
        GROUP BY o.dvvc_ma
      ),
      dc AS (
        SELECT p.dvvc_ma,
               SUM(p.pcd_tong_tien) AS da_chi,
               COUNT(*)::int AS so_phieu
        FROM phieu_chi_dvvc p
        WHERE p.pcd_trang_thai = 'DA_THANH_TOAN'
          AND p.pcd_ngay_hoan_tat >= ${TU('$2')}
          AND p.pcd_ngay_hoan_tat <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
        GROUP BY p.dvvc_ma
      ),
      chua_lap AS (
        SELECT o.dvvc_ma,
               SUM(o.dts_tonggiamgiavanchuyen) AS con_no,
               COUNT(*)::int AS so_don_no
        FROM donhangtheoshop o
        WHERE o.dts_tonggiamgiavanchuyen > 0
          AND NOT EXISTS (
            SELECT 1 FROM chitiet_chi_dvvc c WHERE c.dts_ma = o.dts_ma
          )
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
        GROUP BY o.dvvc_ma
      ),
      dang_cho AS (
        SELECT p.dvvc_ma, SUM(p.pcd_tong_tien) AS cho_qr
        FROM phieu_chi_dvvc p
        WHERE p.pcd_trang_thai = 'CHO_THANH_TOAN'
          AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
        GROUP BY p.dvvc_ma
      ),
      ds AS (
        SELECT dvvc_ma FROM ps
        UNION SELECT dvvc_ma FROM dc
        UNION SELECT dvvc_ma FROM chua_lap
        UNION SELECT dvvc_ma FROM dang_cho
      )
      SELECT ds.dvvc_ma, v.dvvc_ten,
             COALESCE(ps.phat_sinh, 0) AS phat_sinh,
             COALESCE(ps.so_don, 0) AS so_don,
             COALESCE(dc.da_chi, 0) AS da_chi,
             COALESCE(dc.so_phieu, 0) AS so_phieu,
             COALESCE(chua_lap.con_no, 0) AS con_no,
             COALESCE(chua_lap.so_don_no, 0) AS so_don_no,
             COALESCE(dang_cho.cho_qr, 0) AS cho_qr
      FROM ds
      JOIN donvivanchuyen v ON v.dvvc_ma = ds.dvvc_ma
      LEFT JOIN ps ON ps.dvvc_ma = ds.dvvc_ma
      LEFT JOIN dc ON dc.dvvc_ma = ds.dvvc_ma
      LEFT JOIN chua_lap ON chua_lap.dvvc_ma = ds.dvvc_ma
      LEFT JOIN dang_cho ON dang_cho.dvvc_ma = ds.dvvc_ma
      ORDER BY COALESCE(chua_lap.con_no, 0) DESC,
               COALESCE(ps.phat_sinh, 0) DESC,
               v.dvvc_ten ASC
    `;

    // ---------- 2.5. Phiếu đang chờ QR ----------
    const phieuChoSql = `
      SELECT p.pcd_ma, p.dvvc_ma, d.dvvc_ten,
             p.pcd_tong_tien, p.pcd_ngay_tao
      FROM phieu_chi_dvvc p
      JOIN donvivanchuyen d ON d.dvvc_ma = p.dvvc_ma
      WHERE p.pcd_trang_thai = 'CHO_THANH_TOAN'
        AND ($1::varchar IS NULL OR p.dvvc_ma = $1)
      ORDER BY p.pcd_ngay_tao DESC
    `;

    const [kpiRes, thangRes, namRes, dvvcRes, phieuChoRes] = await Promise.all([
      pool.query(kpiSql, [dvvc_ma, tu_ngay, den_ngay]),
      // Không chọn năm => không dựng series 12 tháng
      namChon
        ? pool.query(thangSql, [dvvc_ma, namChon])
        : Promise.resolve({ rows: [] }),
      pool.query(namSql, [dvvc_ma]),
      pool.query(dvvcSql, [dvvc_ma, tu_ngay, den_ngay]),
      pool.query(phieuChoSql, [dvvc_ma]),
    ]);

    const k = kpiRes.rows[0] || {};
    const phat_sinh = num(k.phat_sinh);
    const da_chi = num(k.da_chi);
    const da_chi_all = num(k.da_chi_all);
    const no_chua_lap = num(k.no_chua_lap);
    const cho_qr = num(k.cho_qr);

    return {
      pham_vi: {
        dvvc_ma,
        nam: namChon,
        thang: thangChon,
        tu_ngay,
        den_ngay,
      },
      kpi: {
        phat_sinh,
        da_chi,
        da_chi_all,
        no_chua_lap,
        cho_qr,
        tong_cong_no: no_chua_lap + cho_qr,
        so_don_phat_sinh: num(k.so_don_phat_sinh),
        so_phieu: num(k.so_phieu),
        so_don_no: num(k.so_don_no),
        so_phieu_cho: num(k.so_phieu_cho),
        so_dvvc_cong_no: num(k.so_dvvc_cong_no),
      },
      theo_thang: thangRes.rows.map((r) => ({
        thang: num(r.thang),
        phat_sinh: num(r.phat_sinh),
        so_don: num(r.so_don),
        da_chi: num(r.da_chi),
        so_phieu: num(r.so_phieu),
      })),
      theo_nam: namRes.rows.map((r) => ({
        nam: num(r.nam),
        phat_sinh: num(r.phat_sinh),
        da_chi: num(r.da_chi),
        so_phieu: num(r.so_phieu),
      })),
      theo_dvvc: dvvcRes.rows.map((r) => ({
        dvvc_ma: r.dvvc_ma,
        dvvc_ten: r.dvvc_ten,
        phat_sinh: num(r.phat_sinh),
        so_don: num(r.so_don),
        da_chi: num(r.da_chi),
        so_phieu: num(r.so_phieu),
        con_no: num(r.con_no),
        so_don_no: num(r.so_don_no),
        cho_qr: num(r.cho_qr),
      })),
      phieu_cho: phieuChoRes.rows.map((r) => ({
        ...r,
        pcd_tong_tien: num(r.pcd_tong_tien),
      })),
    };
  },

  // =========================================================
  // 3. LỊCH SỬ PHIẾU CHI (phân trang)
  //    nam = null => xem tất cả các năm
  // =========================================================
  getDanhSachPhieu: async ({
    dvvc_ma = null,
    nam = null,
    thang = null,
    trang_thai = null,
    q = null,
    page = 1,
    limit = 10,
  }) => {
    await ThanhToanVanChuyenModel.donDepPhieuQuaHan();

    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;

    const where = `
      WHERE ($1::varchar IS NULL OR p.dvvc_ma = $1)
        AND COALESCE(p.pcd_ngay_hoan_tat, p.pcd_ngay_tao) >= ${TU('$2')}
        AND COALESCE(p.pcd_ngay_hoan_tat, p.pcd_ngay_tao) <  ${DEN('$3')}
        AND ($4::varchar IS NULL OR p.pcd_trang_thai = $4)
        AND ($5::text IS NULL
             OR p.pcd_ma ILIKE '%' || $5 || '%'
             OR d.dvvc_ten ILIKE '%' || $5 || '%')
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `
        SELECT p.pcd_ma, p.dvvc_ma, d.dvvc_ten,
               p.pcd_tong_tien, p.pcd_trang_thai,
               p.pcd_ngay_tao, p.pcd_ngay_hoan_tat,
               (SELECT COUNT(*)::int FROM chitiet_chi_dvvc c
                WHERE c.pcd_ma = p.pcd_ma) AS so_don
        FROM phieu_chi_dvvc p
        JOIN donvivanchuyen d ON d.dvvc_ma = p.dvvc_ma
        ${where}
        ORDER BY COALESCE(p.pcd_ngay_hoan_tat, p.pcd_ngay_tao) DESC, p.pcd_ma DESC
        LIMIT $6 OFFSET $7
        `,
        [dvvc_ma, tu_ngay, den_ngay, trang_thai, q, l, offset]
      ),
      pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM phieu_chi_dvvc p
        JOIN donvivanchuyen d ON d.dvvc_ma = p.dvvc_ma
        ${where}
        `,
        [dvvc_ma, tu_ngay, den_ngay, trang_thai, q]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);
    return {
      rows: rowsRes.rows.map((r) => ({
        ...r,
        pcd_tong_tien: num(r.pcd_tong_tien),
        so_don: num(r.so_don),
      })),
      total,
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
    };
  },

  // =========================================================
  // 4. CHI TIẾT MỘT PHIẾU CHI
  // =========================================================
  getPhieuChiTiet: async (pcd_ma) => {
    const phieuRes = await pool.query(
      `
      SELECT p.pcd_ma, p.dvvc_ma, d.dvvc_ten,
             p.pcd_tong_tien, p.pcd_trang_thai,
             p.pcd_ngay_tao, p.pcd_ngay_hoan_tat
      FROM phieu_chi_dvvc p
      JOIN donvivanchuyen d ON d.dvvc_ma = p.dvvc_ma
      WHERE p.pcd_ma = $1
      `,
      [pcd_ma]
    );

    const phieu = phieuRes.rows[0];
    if (!phieu) return null;

    const [donRes, qrRes, bankRes] = await Promise.all([
      pool.query(
        `
        SELECT c.dts_ma, c.ccd_so_tien, o.dts_ngaylap
        FROM chitiet_chi_dvvc c
        JOIN donhangtheoshop o ON o.dts_ma = c.dts_ma
        WHERE c.pcd_ma = $1
        ORDER BY o.dts_ngaylap ASC, c.dts_ma ASC
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
      pool.query(
        `
        SELECT tt.ttnt_dvvc_sotaikhoan AS so_tai_khoan,
               tt.ttnt_dvvc_tentaikhoan AS ten_tai_khoan,
               nh.nhg_ten AS ten_ngan_hang,
               nh.nhg_ma  AS ma_ngan_hang
        FROM thongtinnhantien_dvvc tt
        JOIN nganhang nh ON nh.nhg_ma = tt.nganhang_ma
        WHERE tt.dvvc_ma = $1
        LIMIT 1
        `,
        [phieu.dvvc_ma]
      ),
    ]);

    return {
      phieu: { ...phieu, pcd_tong_tien: num(phieu.pcd_tong_tien) },
      don_hang: donRes.rows.map((r) => ({
        ...r,
        ccd_so_tien: num(r.ccd_so_tien),
      })),
      qr: qrRes.rows.map((r) => ({ ...r, qr_so_tien: num(r.qr_so_tien) })),
      ngan_hang: bankRes.rows[0] || null,
    };
  },
};

module.exports = ThanhToanVanChuyenThongKeModel;