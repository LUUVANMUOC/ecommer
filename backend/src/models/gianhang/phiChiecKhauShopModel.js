const pool = require('../../config/db');

// Dùng chung CTE dựng cây ngành hàng + đánh dấu ngành lá.
// Phí chiết khấu chỉ áp dụng cho ngành lá (không có ngành con).
const CTE_CAY = `
  WITH RECURSIVE cay AS (
    SELECT nh_ma, nh_ten, nh_cha, 1 AS cap, nh_ten::text AS duong_dan
    FROM nganhhang
    WHERE nh_cha IS NULL
    UNION ALL
    SELECT c.nh_ma, c.nh_ten, c.nh_cha, cay.cap + 1,
           cay.duong_dan || ' > ' || c.nh_ten
    FROM nganhhang c
    JOIN cay ON c.nh_cha = cay.nh_ma
    WHERE cay.cap < 10
  ),
  la AS (
    SELECT cay.nh_ma, cay.nh_ten, cay.duong_dan, cay.cap
    FROM cay
    WHERE NOT EXISTS (
      SELECT 1 FROM nganhhang con WHERE con.nh_cha = cay.nh_ma
    )
  )
`;

// Số phân loại sản phẩm của shop theo từng ngành hàng.
const CTE_SP_SHOP = `
  sp_shop AS (
    SELECT ctsp.nh_ma, COUNT(*)::int AS so_san_pham
    FROM chitietsanpham ctsp
    JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
    WHERE sp.gh_ma = $1 AND ctsp.nh_ma IS NOT NULL
    GROUP BY ctsp.nh_ma
  )
`;

const PhiChiecKhauShopModel = {
  getSanMacDinh: async (stmdt_ma) => {
    if (stmdt_ma) {
      const res = await pool.query(
        `SELECT stmdt_ma, stmdt_ten FROM san_thuong_mai_dien_tu WHERE stmdt_ma = $1`,
        [stmdt_ma],
      );
      return res.rows[0] || null;
    }
    const res = await pool.query(
      `SELECT stmdt_ma, stmdt_ten
       FROM san_thuong_mai_dien_tu
       ORDER BY stmdt_ma ASC
       LIMIT 1`,
    );
    return res.rows[0] || null;
  },

  // Bảng phí hiện tại: tất cả ngành lá + phí mới nhất + số sản phẩm shop đang bán.
  getBangPhi: async (gh_ma, stmdt_ma) => {
    const query = `
      ${CTE_CAY},
      phi AS (
        SELECT DISTINCT ON (nh_ma) nh_ma, psck_phantram, psck_thoidiem
        FROM phisanchieckhau
        WHERE stmdt_ma = $2
        ORDER BY nh_ma, psck_thoidiem DESC
      ),
      ${CTE_SP_SHOP}
      SELECT
        la.nh_ma::text AS "Nh_Ma",
        la.nh_ten AS "Nh_Ten",
        la.duong_dan AS "Duong_Dan",
        la.cap AS "Cap",
        phi.psck_phantram AS "Phi_PhanTram",
        phi.psck_thoidiem AS "ThoiDiemCapNhat",
        COALESCE(sp_shop.so_san_pham, 0) AS "SoSanPham"
      FROM la
      LEFT JOIN phi ON phi.nh_ma = la.nh_ma
      LEFT JOIN sp_shop ON sp_shop.nh_ma = la.nh_ma
      ORDER BY la.duong_dan ASC
    `;
    const res = await pool.query(query, [gh_ma, stmdt_ma]);
    return res.rows;
  },

  // Lịch sử đổi phí: dùng LAG để có phí cũ ngay trong 1 query.
  // Bỏ các dòng lưu trùng mức phí (admin bấm lưu lại mà không đổi).
  getLichSu: async (gh_ma, stmdt_ma) => {
    const query = `
      ${CTE_CAY},
      bien_dong AS (
        SELECT
          p.nh_ma,
          p.psck_thoidiem,
          p.psck_phantram,
          LAG(p.psck_phantram) OVER (
            PARTITION BY p.nh_ma ORDER BY p.psck_thoidiem
          ) AS phi_cu
        FROM phisanchieckhau p
        WHERE p.stmdt_ma = $2
      ),
      ${CTE_SP_SHOP}
      SELECT
        b.nh_ma::text AS "Nh_Ma",
        cay.nh_ten AS "Nh_Ten",
        cay.duong_dan AS "Duong_Dan",
        b.psck_thoidiem AS "ThoiDiem",
        b.phi_cu AS "Phi_Cu",
        b.psck_phantram AS "Phi_Moi",
        (b.psck_phantram - b.phi_cu) AS "Chenh_Lech",
        COALESCE(sp_shop.so_san_pham, 0) AS "SoSanPham"
      FROM bien_dong b
      JOIN cay ON cay.nh_ma = b.nh_ma
      LEFT JOIN sp_shop ON sp_shop.nh_ma = b.nh_ma
      WHERE b.phi_cu IS NULL OR b.phi_cu <> b.psck_phantram
      ORDER BY b.psck_thoidiem DESC, b.nh_ma ASC
      LIMIT 200
    `;
    const res = await pool.query(query, [gh_ma, stmdt_ma]);
    return res.rows;
  },

  getData: async (gh_ma, stmdt_ma) => {
    const san = await PhiChiecKhauShopModel.getSanMacDinh(stmdt_ma);
    if (!san) return { san: null, nganh_hang: [], lich_su: [] };

    const [nganh_hang, lich_su] = await Promise.all([
      PhiChiecKhauShopModel.getBangPhi(gh_ma, san.stmdt_ma),
      PhiChiecKhauShopModel.getLichSu(gh_ma, san.stmdt_ma),
    ]);

    return { san, nganh_hang, lich_su };
  },
};

module.exports = PhiChiecKhauShopModel;
