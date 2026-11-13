const pool = require('../../config/db');

const PhiChiecKhauModel = {
  // Lấy cây ngành hàng kèm mức phí mới nhất
  getTreeWithLatestFee: async (stmdt_ma) => {
    try {
      const query = `
        WITH RECURSIVE CategoryTree AS (
            SELECT nh_ma, nh_ten, nh_mota, nh_cha, nh_hinhanh, 1 as level, nh_ma::text as path
            FROM nganhhang WHERE nh_cha IS NULL
            UNION ALL
            SELECT c.nh_ma, c.nh_ten, c.nh_mota, c.nh_cha, c.nh_hinhanh, ct.level + 1, ct.path || ' > ' || c.nh_ma
            FROM nganhhang c JOIN CategoryTree ct ON c.nh_cha = ct.nh_ma WHERE ct.level < 5
        ),
        LatestFee AS (
            SELECT DISTINCT ON (nh_ma) nh_ma, psck_phantram
            FROM phisanchieckhau WHERE stmdt_ma = $1 ORDER BY nh_ma, psck_thoidiem DESC
        )
        SELECT 
            ct.nh_ma AS "nh_ma", ct.nh_ten AS "nh_ten", ct.nh_mota AS "nh_mota", 
            ct.nh_cha AS "nh_cha", ct.nh_hinhanh AS "nh_hinhanh",
            ct.level AS "level", lf.psck_phantram AS "psck_phantram"
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

  // Cập nhật phí chiết khấu VÀ tự động đồng bộ lại giá bán sản phẩm
  updateFee: async (data) => {
    const { nh_ma, stmdt_ma, psck_phantram } = data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lưu lịch sử phí mới
      const queryInsert = `
        INSERT INTO phisanchieckhau (psck_thoidiem, psck_phantram, nh_ma, stmdt_ma)
        VALUES (clock_timestamp(), $1, $2, $3) 
        RETURNING *;
      `;
      const result = await client.query(queryInsert, [psck_phantram, nh_ma, stmdt_ma]);

      // 2. Cập nhật lại giá bán cho TẤT CẢ sản phẩm thuộc ngành hàng này
      const queryUpdatePrice = `
        UPDATE chitietsanpham ctsp
        SET ctsp_gianban = ROUND(
            (SELECT gb.gb_gia 
             FROM giabangoc gb 
             WHERE gb.ctsp_ma = ctsp.ctsp_ma 
             ORDER BY gb.gb_thoidiem DESC 
             LIMIT 1) * (1 + ($1 / 100.0)), 
        2)
        WHERE ctsp.nh_ma = $2 
        AND EXISTS (
            SELECT 1 FROM giabangoc gb2 
            WHERE gb2.ctsp_ma = ctsp.ctsp_ma
        );
      `;
      await client.query(queryUpdatePrice, [psck_phantram, nh_ma]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("LỖI KHI CẬP NHẬT PHÍ VÀ GIÁ SẢN PHẨM:", error);
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = PhiChiecKhauModel;