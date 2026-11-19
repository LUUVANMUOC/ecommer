const pool = require('../../config/db');
const ThongBaoService = require('../../services/thongbao/thongBaoService');

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
    let ketQua = null;
    let phanTramCu = null;
    let tenNganh = null;

    try {
      await client.query('BEGIN');

      // 0. Lấy phí cũ + tên ngành hàng để soạn thông báo
      const [truocRes, nganhRes] = await Promise.all([
        client.query(
          // So sánh ngay trong DB để khớp đúng kiểu numeric(5,2) khi làm tròn.
          `SELECT psck_phantram,
                  (psck_phantram = $3::numeric(5,2)) AS khong_doi
           FROM phisanchieckhau
           WHERE nh_ma = $1 AND stmdt_ma = $2
           ORDER BY psck_thoidiem DESC
           LIMIT 1`,
          [nh_ma, stmdt_ma, psck_phantram],
        ),
        client.query(`SELECT nh_ten FROM nganhhang WHERE nh_ma = $1`, [nh_ma]),
      ]);
      phanTramCu = truocRes.rows[0]?.psck_phantram ?? null;
      tenNganh = nganhRes.rows[0]?.nh_ten || null;

      // Không ghi lịch sử và không gửi thông báo khi mức phí không thay đổi.
      if (truocRes.rows[0]?.khong_doi) {
        await client.query('ROLLBACK');
        return { khong_doi: true, psck_phantram: phanTramCu };
      }

      // 1. Lưu lịch sử phí mới
      const queryInsert = `
        INSERT INTO phisanchieckhau (psck_thoidiem, psck_phantram, nh_ma, stmdt_ma)
        VALUES (clock_timestamp(), $1, $2, $3) 
        RETURNING *;
      `;
      const result = await client.query(queryInsert, [psck_phantram, nh_ma, stmdt_ma]);
      ketQua = result.rows[0];

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
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("LỖI KHI CẬP NHẬT PHÍ VÀ GIÁ SẢN PHẨM:", error);
      throw error;
    } finally {
      client.release();
    }

    // 3. Gửi thông báo cho các shop có sản phẩm thuộc ngành hàng vừa đổi phí
    //    (chạy sau khi đã commit, lỗi thông báo không làm hỏng nghiệp vụ)
    try {
      const shopRes = await pool.query(
        `SELECT DISTINCT sp.gh_ma
         FROM chitietsanpham ctsp
         JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
         WHERE ctsp.nh_ma = $1`,
        [nh_ma],
      );

      await ThongBaoService.thongBaoDoiPhi({
        stmdt_ma,
        nh_ma,
        ten_nganh: tenNganh,
        phan_tram_cu: phanTramCu,
        phan_tram_moi: psck_phantram,
        ds_gh_ma: shopRes.rows.map((r) => r.gh_ma),
      });
    } catch (error) {
      console.error("❌ Lỗi gửi thông báo đổi phí chiết khấu:", error.message);
    }

    return ketQua;
  }
};

module.exports = PhiChiecKhauModel;