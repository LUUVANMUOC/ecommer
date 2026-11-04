const pool = require('../../config/db');

const PhiChiecKhauModel = {
  // Lấy cây ngành hàng kèm mức phí mới nhất
  getTreeWithLatestFee: async (stmdt_ma) => {
    try {
      const query = `
        WITH RECURSIVE CategoryTree AS (
            SELECT nh_ma, nh_ten, nh_mota, nh_cha, 1 as level, nh_ma::text as path
            FROM nganhhang WHERE nh_cha IS NULL
            UNION ALL
            SELECT c.nh_ma, c.nh_ten, c.nh_mota, c.nh_cha, ct.level + 1, ct.path || ' > ' || c.nh_ma
            FROM nganhhang c JOIN CategoryTree ct ON c.nh_cha = ct.nh_ma WHERE ct.level < 5
        ),
        LatestFee AS (
            SELECT DISTINCT ON (nh_ma) nh_ma, psck_phantram
            FROM phisanchieckhau WHERE stmdt_ma = $1 ORDER BY nh_ma, psck_thoidiem DESC
        )
        SELECT 
            ct.nh_ma AS "nh_ma", ct.nh_ten AS "nh_ten", ct.nh_mota AS "nh_mota", 
            ct.nh_cha AS "nh_cha", ct.level AS "level", lf.psck_phantram AS "psck_phantram"
        FROM CategoryTree ct
        LEFT JOIN LatestFee lf ON ct.nh_ma = lf.nh_ma
        ORDER BY ct.path;
      `;
      const result = await pool.query(query, [stmdt_ma]);
      return result.rows;
    } catch (error) {
      console.error("LỖI SQL GET TABLE:", error.message);
      throw error;
    }
  },

  // Cập nhật phí chiết khấu
  updateFee: async (data) => {
    const { nh_ma, stmdt_ma, psck_phantram } = data;
    const query = `
      INSERT INTO phisanchieckhau (psck_thoidiem, psck_phantram, nh_ma, stmdt_ma)
      VALUES (clock_timestamp(), $1, $2, $3) 
      ON CONFLICT (nh_ma, psck_thoidiem, stmdt_ma) 
      DO UPDATE SET psck_phantram = EXCLUDED.psck_phantram
      RETURNING *;
    `;
    const result = await pool.query(query, [psck_phantram, nh_ma, stmdt_ma]);
    return result.rows[0];
  }
};

module.exports = PhiChiecKhauModel;