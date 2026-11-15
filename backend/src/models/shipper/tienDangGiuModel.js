// backend/src/models/shipper/tienDangGiuModel.js
// Đã đối chiếu cột với TaiLieu/backup_db.sql:
//   thongtingiaohang(dts_ma, shipper_ma, ttgh_thoidiem, ttgh_da_nop_tien, ttgh_thoidiem_nop)
//   donhangtheoshop(dts_ma, gh_ma, dts_tongtienhang, dts_tonggiamgiashop, dts_tongtienphisan,
//                   dts_tienvanchuyen, dts_tonggiamgiavanchuyen, dts_tongtienkhachhangthanhtoan,
//                   dts_trangthaithanhtoan)
//   gianhang(gh_ma, gh_ten) | kho(kho_ma, kho_ten) | shipper(shipper_ma, kho_ma, lsp_ma)
//   loai_shipper(lshipper_ma, lshipper_ten)
const pool = require('../../config/db');

const TZ = 'Asia/Ho_Chi_Minh';

const NGAY_GIAO = `(ttgh.ttgh_thoidiem AT TIME ZONE '${TZ}')::date`;
const NGAY_NOP = `(ttgh.ttgh_thoidiem_nop AT TIME ZONE '${TZ}')::date`;
const NGAY_GIAO_STR = `to_char(ttgh.ttgh_thoidiem AT TIME ZONE '${TZ}', 'YYYY-MM-DD')`;
const NGAY_NOP_STR = `to_char(ttgh.ttgh_thoidiem_nop AT TIME ZONE '${TZ}', 'YYYY-MM-DD')`;
const HOM_NAY = `(NOW() AT TIME ZONE '${TZ}')::date`;

// Tách tiền 1 đơn: khách trả (COD) = tiền hàng sau giảm shop + cước ship thực trả
const COT_TIEN = `
        dts.dts_tongtienkhachhangthanhtoan AS khach_tra,
        (dts.dts_tongtienhang - dts.dts_tonggiamgiashop) AS tra_shop,
        dts.dts_tongtienphisan AS phi_san,
        (dts.dts_tienvanchuyen - dts.dts_tonggiamgiavanchuyen) AS cuoc_ship`;

const TienDangGiuModel = {
  // Thông tin shipper + kho + loại shipper
  getThongTin: async (shipper_ma) => {
    const { rows } = await pool.query(
      `SELECT s.shipper_ma,
              s.shipper_ten,
              s.shipper_sdt,
              s.kho_ma,
              k.kho_ten,
              s.lsp_ma,
              ls.lshipper_ten
         FROM shipper s
         LEFT JOIN kho k ON k.kho_ma = s.kho_ma
         LEFT JOIN loai_shipper ls ON ls.lshipper_ma = s.lsp_ma
        WHERE s.shipper_ma = $1`,
      [shipper_ma],
    );
    return rows[0] || null;
  },

  // KPI snapshot: không phụ thuộc bộ lọc ngày
  getKpi: async (shipper_ma) => {
    const { rows } = await pool.query(
      `WITH co_so AS (
         SELECT dts.dts_tongtienkhachhangthanhtoan AS tien,
                dts.dts_trangthaithanhtoan AS da_xac_nhan,
                ttgh.ttgh_da_nop_tien AS da_nop,
                ${NGAY_GIAO} AS ngay_giao
           FROM thongtingiaohang ttgh
           JOIN donhangtheoshop dts ON dts.dts_ma = ttgh.dts_ma
          WHERE ttgh.shipper_ma = $1
            AND ttgh.ttgh_thoidiem IS NOT NULL
       )
       SELECT COUNT(*) FILTER (WHERE da_xac_nhan AND NOT da_nop)::int AS dang_giu_don,
              COALESCE(SUM(tien) FILTER (WHERE da_xac_nhan AND NOT da_nop), 0) AS dang_giu_tien,
              COUNT(*) FILTER (WHERE NOT da_xac_nhan AND NOT da_nop)::int AS cho_xac_nhan_don,
              COALESCE(SUM(tien) FILTER (WHERE NOT da_xac_nhan AND NOT da_nop), 0) AS cho_xac_nhan_tien,
              COUNT(*) FILTER (WHERE da_nop)::int AS da_nop_don,
              COALESCE(SUM(tien) FILTER (WHERE da_nop), 0) AS da_nop_tien,
              COUNT(*) FILTER (WHERE ngay_giao >= ${HOM_NAY} - 29)::int AS giao_30_don,
              COALESCE(SUM(tien) FILTER (WHERE ngay_giao >= ${HOM_NAY} - 29), 0) AS giao_30_tien
         FROM co_so`,
      [shipper_ma],
    );
    return rows[0];
  },

  // Đơn đã giao, chưa nộp tiền (gồm cả chờ khách xác nhận)
  getDangGiu: async (shipper_ma, tu_ngay, den_ngay) => {
    const params = [shipper_ma];
    const dieuKien = [];

    if (tu_ngay) {
      params.push(tu_ngay);
      dieuKien.push(`${NGAY_GIAO} >= $${params.length}::date`);
    }
    if (den_ngay) {
      params.push(den_ngay);
      dieuKien.push(`${NGAY_GIAO} <= $${params.length}::date`);
    }

    const locNgay = dieuKien.length ? `AND ${dieuKien.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT dts.dts_ma,
              ttgh.ttgh_thoidiem AS thoi_diem_giao,
              ${NGAY_GIAO_STR} AS ngay_giao,
              gh.gh_ten,
              dts.dts_trangthaithanhtoan AS da_xac_nhan,
              ${COT_TIEN}
         FROM thongtingiaohang ttgh
         JOIN donhangtheoshop dts ON dts.dts_ma = ttgh.dts_ma
         JOIN gianhang gh ON gh.gh_ma = dts.gh_ma
        WHERE ttgh.shipper_ma = $1
          AND ttgh.ttgh_thoidiem IS NOT NULL
          AND ttgh.ttgh_da_nop_tien = false
          ${locNgay}
        ORDER BY ttgh.ttgh_thoidiem DESC, dts.dts_ma ASC`,
      params,
    );
    return rows;
  },

  // Số dư đầu kỳ = COD đã xác nhận giao trước kỳ - tiền đã nộp trước kỳ
  getSoDuDauKy: async (shipper_ma, tu_ngay) => {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(dts.dts_tongtienkhachhangthanhtoan) FILTER (
                WHERE dts.dts_trangthaithanhtoan = true AND ${NGAY_GIAO} < $2::date
              ), 0)
              - COALESCE(SUM(dts.dts_tongtienkhachhangthanhtoan) FILTER (
                WHERE ttgh.ttgh_thoidiem_nop IS NOT NULL AND ${NGAY_NOP} < $2::date
              ), 0) AS so_du_dau_ky
         FROM thongtingiaohang ttgh
         JOIN donhangtheoshop dts ON dts.dts_ma = ttgh.dts_ma
        WHERE ttgh.shipper_ma = $1
          AND ttgh.ttgh_thoidiem IS NOT NULL`,
      [shipper_ma, tu_ngay],
    );
    return rows[0] ? rows[0].so_du_dau_ky : 0;
  },

  // Tiền giữ phát sinh (theo ngày giao) và tiền đã nộp (theo ngày nộp)
  getTheoNgay: async (shipper_ma, tu_ngay, den_ngay) => {
    const { rows } = await pool.query(
      `WITH vao AS (
         SELECT ${NGAY_GIAO_STR} AS ngay,
                COUNT(*)::int AS so_don,
                SUM(dts.dts_tongtienkhachhangthanhtoan) AS tien
           FROM thongtingiaohang ttgh
           JOIN donhangtheoshop dts ON dts.dts_ma = ttgh.dts_ma
          WHERE ttgh.shipper_ma = $1
            AND ttgh.ttgh_thoidiem IS NOT NULL
            AND dts.dts_trangthaithanhtoan = true
            AND ${NGAY_GIAO} BETWEEN $2::date AND $3::date
          GROUP BY 1
       ), ra AS (
         SELECT ${NGAY_NOP_STR} AS ngay,
                COUNT(*)::int AS so_don,
                SUM(dts.dts_tongtienkhachhangthanhtoan) AS tien
           FROM thongtingiaohang ttgh
           JOIN donhangtheoshop dts ON dts.dts_ma = ttgh.dts_ma
          WHERE ttgh.shipper_ma = $1
            AND ttgh.ttgh_thoidiem_nop IS NOT NULL
            AND ${NGAY_NOP} BETWEEN $2::date AND $3::date
          GROUP BY 1
       )
       SELECT COALESCE(v.ngay, r.ngay) AS ngay,
              COALESCE(v.so_don, 0) AS so_don_vao,
              COALESCE(v.tien, 0) AS tien_vao,
              COALESCE(r.so_don, 0) AS so_don_ra,
              COALESCE(r.tien, 0) AS tien_ra
         FROM vao v
         FULL JOIN ra r ON r.ngay = v.ngay
        ORDER BY 1`,
      [shipper_ma, tu_ngay, den_ngay],
    );
    return rows;
  },

  // Các đơn thuộc từng lần nộp tiền (gom theo ttgh_thoidiem_nop)
  getLichSuNop: async (shipper_ma, tu_ngay, den_ngay) => {
    const { rows } = await pool.query(
      `SELECT ttgh.ttgh_thoidiem_nop AS thoi_diem_nop,
              dts.dts_ma,
              ${NGAY_GIAO_STR} AS ngay_giao,
              gh.gh_ten,
              ${COT_TIEN}
         FROM thongtingiaohang ttgh
         JOIN donhangtheoshop dts ON dts.dts_ma = ttgh.dts_ma
         JOIN gianhang gh ON gh.gh_ma = dts.gh_ma
        WHERE ttgh.shipper_ma = $1
          AND ttgh.ttgh_da_nop_tien = true
          AND ttgh.ttgh_thoidiem_nop IS NOT NULL
          AND ${NGAY_NOP} BETWEEN $2::date AND $3::date
        ORDER BY ttgh.ttgh_thoidiem_nop DESC, dts.dts_ma ASC`,
      [shipper_ma, tu_ngay, den_ngay],
    );
    return rows;
  },
};

module.exports = TienDangGiuModel;