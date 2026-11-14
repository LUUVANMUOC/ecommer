// backend/src/models/san/phiVanChuyenThongKeModel.js
// Thống kê phí vận chuyển cho Admin.
//
// Quy ước dữ liệu (theo datHangService):
//   dts_tienvanchuyen        = phí ship khách thực trả SAU voucher
//   dts_tonggiamgiavanchuyen = phần voucher ship được giảm (Sàn bù)
//   phí ship gốc trước voucher = dts_tienvanchuyen + dts_tonggiamgiavanchuyen
//
// Bổ sung bộ lọc Kho:
//   - Kho của đơn lấy qua thongtingiaohang -> shipper.kho_ma
//     (ưu tiên shipper đã nộp tiền, sau đó chuyến giao mới nhất).
//   - Khi lọc kho, các số liệu tính theo đơn (phát sinh, sàn bù, khách trả,
//     đã chi/chờ chi theo đơn) đều được lọc theo kho.
//
// Trạng thái chi trả phản ánh thời điểm hiện tại của các đơn phát sinh trong kỳ lọc.
// Loại khỏi thống kê các đơn có trạng thái mới nhất là TTDH06 (Đã hủy).

const pool = require('../../config/db');

const TZ = 'Asia/Ho_Chi_Minh';
const TU = (p) => `(${p}::date::timestamp AT TIME ZONE '${TZ}')`;
const DEN = (p) => `((${p}::date + 1)::timestamp AT TIME ZONE '${TZ}')`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const khoangThoiGian = (nam, thang) => {
  const y = Number(nam) || new Date().getFullYear();
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

// Trạng thái mới nhất của đơn (theo thời điểm ghi nhận)
const TTDH_CUOI = (alias = 'o') => `(
  SELECT c.ttdh_ma
  FROM chitiettrangthaidonhang c
  WHERE c.dts_ma = ${alias}.dts_ma
  ORDER BY c.ctttdh_thoidiem DESC
  LIMIT 1
)`;

// Đơn có trạng thái mới nhất là TTDH06 (Đã hủy) bị loại khỏi thống kê
const LOAI_DON_HUY = (alias = 'o') =>
  `COALESCE(${TTDH_CUOI(alias)}, '') <> 'TTDH06'`;

// Kho của một đơn: ưu tiên shipper đã nộp tiền, sau đó chuyến giao mới nhất.
const KHO_CUA_DON = `
  LEFT JOIN LATERAL (
    SELECT s.kho_ma
    FROM thongtingiaohang t
    JOIN shipper s ON s.shipper_ma = t.shipper_ma
    WHERE t.dts_ma = o.dts_ma
    ORDER BY t.ttgh_da_nop_tien DESC, t.ttgh_thoidiem_nop DESC NULLS LAST
    LIMIT 1
  ) kv ON true
`;

// Dùng EXISTS để tránh nhân dòng khi 1 đơn nằm trong nhiều phiếu
const TRANG_THAI_CASE = (alias = 'o') => `
  CASE
    WHEN COALESCE(${alias}.dts_tonggiamgiavanchuyen, 0) <= 0 THEN 'KHONG_GIAM_GIA'
    WHEN EXISTS (
      SELECT 1
      FROM chitiet_chi_dvvc c
      JOIN phieu_chi_dvvc p ON p.pcd_ma = c.pcd_ma
      WHERE c.dts_ma = ${alias}.dts_ma
        AND p.pcd_trang_thai = 'DA_THANH_TOAN'
    ) THEN 'DA_CHI'
    ELSE 'CHUA_CHI'
  END
`;

const PhiVanChuyenThongKeModel = {
  // =========================================================
  // 1. DANH MỤC
  // =========================================================
  getDanhMuc: async () => {
    const [dvvcRes, khoRes, namRes] = await Promise.all([
      pool.query(
        `SELECT dvvc_ma, dvvc_ten FROM donvivanchuyen ORDER BY dvvc_ten ASC`
      ),
      pool.query(`
        SELECT k.kho_ma, k.kho_ten
        FROM kho k
        WHERE EXISTS (SELECT 1 FROM phieu_tat_toan p WHERE p.kho_ma = k.kho_ma)
           OR EXISTS (
             SELECT 1
             FROM thongtingiaohang t
             JOIN shipper s ON s.shipper_ma = t.shipper_ma
             WHERE s.kho_ma = k.kho_ma
           )
        ORDER BY k.kho_ten ASC
      `),
      pool.query(`
        SELECT DISTINCT
               EXTRACT(YEAR FROM o.dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam
        FROM donhangtheoshop o
        WHERE o.dts_ngaylap IS NOT NULL
          AND ${LOAI_DON_HUY('o')}
        ORDER BY nam DESC
      `),
    ]);

    const namHienTai = new Date().getFullYear();
    const dsNam = Array.from(
      new Set([namHienTai, ...namRes.rows.map((r) => num(r.nam))])
    )
      .filter((n) => n > 0)
      .sort((a, b) => b - a);

    return {
      kho: khoRes.rows,
      dvvc: dvvcRes.rows,
      nam: dsNam,
      nam_hien_tai: namHienTai,
    };
  },

  // =========================================================
  // 2. TỔNG QUAN
  // =========================================================
  getTongQuan: async ({ dvvc_ma = null, kho_ma = null, nam, thang = null }) => {
    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);
    const namSo = Number(nam) || new Date().getFullYear();

    // ---------- 2.1. KPI ----------
    const kpiSql = `
      WITH base AS (
        SELECT o.dts_ma,
               COALESCE(o.dts_tienvanchuyen, 0) AS khach_tra,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS san_bu,
               ${TRANG_THAI_CASE('o')} AS trang_thai
        FROM donhangtheoshop o
        ${KHO_CUA_DON}
        WHERE o.dts_ngaylap >= ${TU('$2')}
          AND o.dts_ngaylap <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
          AND ($4::varchar IS NULL OR kv.kho_ma = $4)
          AND ${LOAI_DON_HUY('o')}
      )
      SELECT COALESCE(SUM(khach_tra + san_bu), 0) AS phi_goc,
             COALESCE(SUM(san_bu), 0) AS san_bu,
             COALESCE(SUM(khach_tra), 0) AS khach_tra,
             COUNT(*)::int AS so_don,
             COUNT(*) FILTER (WHERE san_bu > 0)::int AS so_don_san_bu,
             COALESCE(SUM(san_bu) FILTER (WHERE trang_thai = 'DA_CHI'), 0) AS da_chi,
             COALESCE(SUM(san_bu) FILTER (WHERE trang_thai = 'CHUA_CHI'), 0) AS cho_chi,
             COUNT(*) FILTER (WHERE trang_thai = 'DA_CHI')::int AS so_don_da_chi,
             COUNT(*) FILTER (WHERE trang_thai = 'CHUA_CHI')::int AS so_don_cho_chi,
             COUNT(*) FILTER (WHERE trang_thai = 'KHONG_GIAM_GIA')::int AS so_don_khong_gg
      FROM base
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
      base AS (
        SELECT date_trunc('month', o.dts_ngaylap AT TIME ZONE '${TZ}')::date AS thang,
               COALESCE(o.dts_tienvanchuyen, 0) AS khach_tra,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS san_bu,
               ${TRANG_THAI_CASE('o')} AS trang_thai
        FROM donhangtheoshop o
        ${KHO_CUA_DON}
        WHERE o.dts_ngaylap >= (make_date($2::int, 1, 1)::timestamp AT TIME ZONE '${TZ}')
          AND o.dts_ngaylap <  ((make_date($2::int, 12, 31) + 1)::timestamp AT TIME ZONE '${TZ}')
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
          AND ($3::varchar IS NULL OR kv.kho_ma = $3)
          AND ${LOAI_DON_HUY('o')}
      ),
      agg AS (
        SELECT thang,
               SUM(khach_tra + san_bu) AS phi_goc,
               SUM(san_bu) AS san_bu,
               SUM(khach_tra) AS khach_tra,
               COALESCE(SUM(san_bu) FILTER (WHERE trang_thai = 'DA_CHI'), 0) AS da_chi,
               COALESCE(SUM(san_bu) FILTER (WHERE trang_thai = 'CHUA_CHI'), 0) AS cho_chi,
               COUNT(*)::int AS so_don
        FROM base
        GROUP BY thang
      )
      SELECT EXTRACT(MONTH FROM thang.thang)::int AS thang,
             COALESCE(agg.phi_goc, 0) AS phi_goc,
             COALESCE(agg.san_bu, 0) AS san_bu,
             COALESCE(agg.khach_tra, 0) AS khach_tra,
             COALESCE(agg.da_chi, 0) AS da_chi,
             COALESCE(agg.cho_chi, 0) AS cho_chi,
             COALESCE(agg.so_don, 0) AS so_don
      FROM thang
      LEFT JOIN agg ON agg.thang = thang.thang
      ORDER BY thang.thang
    `;

    // ---------- 2.3. Series theo năm ----------
    const namSql = `
      WITH ds_nam AS (
        SELECT DISTINCT
               EXTRACT(YEAR FROM o.dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam
        FROM donhangtheoshop o
        ${KHO_CUA_DON}
        WHERE o.dts_ngaylap IS NOT NULL
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
          AND ($2::varchar IS NULL OR kv.kho_ma = $2)
          AND ${LOAI_DON_HUY('o')}
      ),
      base AS (
        SELECT EXTRACT(YEAR FROM o.dts_ngaylap AT TIME ZONE '${TZ}')::int AS nam,
               COALESCE(o.dts_tienvanchuyen, 0) AS khach_tra,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS san_bu,
               ${TRANG_THAI_CASE('o')} AS trang_thai
        FROM donhangtheoshop o
        ${KHO_CUA_DON}
        WHERE o.dts_ngaylap IS NOT NULL
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
          AND ($2::varchar IS NULL OR kv.kho_ma = $2)
          AND ${LOAI_DON_HUY('o')}
      ),
      agg AS (
        SELECT nam,
               SUM(khach_tra + san_bu) AS phi_goc,
               SUM(san_bu) AS san_bu,
               SUM(khach_tra) AS khach_tra,
               COALESCE(SUM(san_bu) FILTER (WHERE trang_thai = 'DA_CHI'), 0) AS da_chi,
               COALESCE(SUM(san_bu) FILTER (WHERE trang_thai = 'CHUA_CHI'), 0) AS cho_chi,
               COUNT(*)::int AS so_don
        FROM base
        GROUP BY nam
      )
      SELECT ds_nam.nam,
             COALESCE(agg.phi_goc, 0) AS phi_goc,
             COALESCE(agg.san_bu, 0) AS san_bu,
             COALESCE(agg.khach_tra, 0) AS khach_tra,
             COALESCE(agg.da_chi, 0) AS da_chi,
             COALESCE(agg.cho_chi, 0) AS cho_chi,
             COALESCE(agg.so_don, 0) AS so_don
      FROM ds_nam
      LEFT JOIN agg ON agg.nam = ds_nam.nam
      ORDER BY ds_nam.nam ASC
    `;

    // ---------- 2.4. Theo ĐVVC ----------
    const dvvcSql = `
      WITH base AS (
        SELECT o.dvvc_ma,
               COALESCE(o.dts_tienvanchuyen, 0) AS khach_tra,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS san_bu,
               ${TRANG_THAI_CASE('o')} AS trang_thai
        FROM donhangtheoshop o
        ${KHO_CUA_DON}
        WHERE o.dts_ngaylap >= ${TU('$2')}
          AND o.dts_ngaylap <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
          AND ($4::varchar IS NULL OR kv.kho_ma = $4)
          AND ${LOAI_DON_HUY('o')}
      )
      SELECT b.dvvc_ma, d.dvvc_ten,
             COALESCE(SUM(b.khach_tra + b.san_bu), 0) AS phi_goc,
             COALESCE(SUM(b.san_bu), 0) AS san_bu,
             COALESCE(SUM(b.khach_tra), 0) AS khach_tra,
             COALESCE(SUM(b.san_bu) FILTER (WHERE b.trang_thai = 'DA_CHI'), 0) AS da_chi,
             COALESCE(SUM(b.san_bu) FILTER (WHERE b.trang_thai = 'CHUA_CHI'), 0) AS cho_chi,
             COUNT(*)::int AS so_don,
             COUNT(*) FILTER (WHERE b.san_bu > 0)::int AS so_don_san_bu
      FROM base b
      JOIN donvivanchuyen d ON d.dvvc_ma = b.dvvc_ma
      GROUP BY b.dvvc_ma, d.dvvc_ten
      ORDER BY COALESCE(SUM(b.khach_tra + b.san_bu), 0) DESC, d.dvvc_ten ASC
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
      pool.query(kpiSql, [dvvc_ma, tu_ngay, den_ngay, kho_ma]),
      pool.query(thangSql, [dvvc_ma, namSo, kho_ma]),
      pool.query(namSql, [dvvc_ma, kho_ma]),
      pool.query(dvvcSql, [dvvc_ma, tu_ngay, den_ngay, kho_ma]),
      pool.query(phieuChoSql, [dvvc_ma]),
    ]);

    const k = kpiRes.rows[0] || {};

    return {
      pham_vi: {
        dvvc_ma,
        kho_ma,
        nam: namSo,
        thang: thang || null,
        tu_ngay,
        den_ngay,
      },
      kpi: {
        phi_goc: num(k.phi_goc),
        san_bu: num(k.san_bu),
        khach_tra: num(k.khach_tra),
        da_chi: num(k.da_chi),
        cho_chi: num(k.cho_chi),
        so_don: num(k.so_don),
        so_don_san_bu: num(k.so_don_san_bu),
        so_don_da_chi: num(k.so_don_da_chi),
        so_don_cho_chi: num(k.so_don_cho_chi),
        so_don_khong_gg: num(k.so_don_khong_gg),
      },
      theo_thang: thangRes.rows.map((r) => ({
        thang: num(r.thang),
        phi_goc: num(r.phi_goc),
        san_bu: num(r.san_bu),
        khach_tra: num(r.khach_tra),
        da_chi: num(r.da_chi),
        cho_chi: num(r.cho_chi),
        so_don: num(r.so_don),
      })),
      theo_nam: namRes.rows.map((r) => ({
        nam: num(r.nam),
        phi_goc: num(r.phi_goc),
        san_bu: num(r.san_bu),
        khach_tra: num(r.khach_tra),
        da_chi: num(r.da_chi),
        cho_chi: num(r.cho_chi),
        so_don: num(r.so_don),
      })),
      theo_dvvc: dvvcRes.rows.map((r) => ({
        dvvc_ma: r.dvvc_ma,
        dvvc_ten: r.dvvc_ten,
        phi_goc: num(r.phi_goc),
        san_bu: num(r.san_bu),
        khach_tra: num(r.khach_tra),
        da_chi: num(r.da_chi),
        cho_chi: num(r.cho_chi),
        so_don: num(r.so_don),
        so_don_san_bu: num(r.so_don_san_bu),
      })),
      phieu_cho: phieuChoRes.rows.map((r) => ({
        ...r,
        pcd_tong_tien: num(r.pcd_tong_tien),
      })),
    };
  },

  // =========================================================
  // 3. DANH SÁCH ĐƠN (phân trang + tìm kiếm)
  // =========================================================
  getDanhSach: async ({
    dvvc_ma = null,
    kho_ma = null,
    nam,
    thang = null,
    trang_thai = null,
    q = null,
    page = 1,
    limit = 10,
  }) => {
    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;

    const baseSql = `
      WITH base AS (
        SELECT o.dts_ma, o.dts_ngaylap, o.dvvc_ma, d.dvvc_ten,
               kv.kho_ma, k.kho_ten,
               COALESCE(o.dts_tienvanchuyen, 0) AS khach_tra,
               COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS voucher_ship,
               COALESCE(o.dts_tienvanchuyen, 0)
                 + COALESCE(o.dts_tonggiamgiavanchuyen, 0) AS phi_ship_goc,
               (SELECT p.pcd_ma
                FROM chitiet_chi_dvvc c
                JOIN phieu_chi_dvvc p ON p.pcd_ma = c.pcd_ma
                WHERE c.dts_ma = o.dts_ma
                ORDER BY (p.pcd_trang_thai = 'DA_THANH_TOAN') DESC,
                         p.pcd_ngay_tao DESC
                LIMIT 1) AS pcd_ma,
               ${TRANG_THAI_CASE('o')} AS trang_thai
        FROM donhangtheoshop o
        JOIN donvivanchuyen d ON d.dvvc_ma = o.dvvc_ma
        ${KHO_CUA_DON}
        LEFT JOIN kho k ON k.kho_ma = kv.kho_ma
        WHERE o.dts_ngaylap >= ${TU('$2')}
          AND o.dts_ngaylap <  ${DEN('$3')}
          AND ($1::varchar IS NULL OR o.dvvc_ma = $1)
          AND ($6::varchar IS NULL OR kv.kho_ma = $6)
          AND ($5::text IS NULL
               OR o.dts_ma ILIKE '%' || $5 || '%'
               OR d.dvvc_ten ILIKE '%' || $5 || '%'
               OR k.kho_ten ILIKE '%' || $5 || '%')
          AND ${LOAI_DON_HUY('o')}
      )
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `
        ${baseSql}
        SELECT * FROM base
        WHERE ($4::varchar IS NULL OR trang_thai = $4)
        ORDER BY dts_ngaylap DESC, dts_ma DESC
        LIMIT $7 OFFSET $8
        `,
        [dvvc_ma, tu_ngay, den_ngay, trang_thai, q, kho_ma, l, offset]
      ),
      pool.query(
        `
        ${baseSql}
        SELECT COUNT(*)::int AS total FROM base
        WHERE ($4::varchar IS NULL OR trang_thai = $4)
        `,
        [dvvc_ma, tu_ngay, den_ngay, trang_thai, q, kho_ma]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => {
        let ghi_chu = 'Khách trả đủ phí ship, Sàn không chi trả';
        if (r.trang_thai === 'DA_CHI')
          ghi_chu = `Đã chi trả qua phiếu ${r.pcd_ma}`;
        else if (r.trang_thai === 'CHUA_CHI')
          ghi_chu = 'Chờ Sàn thanh toán voucher ship';

        return {
          ...r,
          phi_ship_goc: num(r.phi_ship_goc),
          voucher_ship: num(r.voucher_ship),
          khach_tra: num(r.khach_tra),
          ghi_chu,
        };
      }),
      total,
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
    };
  },
};

module.exports = PhiVanChuyenThongKeModel;