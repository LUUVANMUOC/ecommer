// backend/src/models/khachhang/gioHangModel.js
const pool = require('../../config/db');

const GioHangModel = {
  // 1. Lấy danh sách sản phẩm trong giỏ hàng
  // backend/src/models/khachhang/gioHangModel.js
  getCartByCustomer: async (kh_ma) => {
    const query = `
      SELECT 
        ctgh.kh_ma, ctgh.ctsp_ma, ctgh.ctgh_soluong, ctgh.ctgh_thoidiemthem,
        ctsp.ctsp_ten, ctsp.ctsp_gianban, ctsp.ctsp_soluongton,
        sp.sp_ma, sp.sp_ten, sp.gh_ma,
        gh.gh_ten, 
        (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1) AS image
      FROM chitietgiohang ctgh
      JOIN chitietsanpham ctsp ON ctgh.ctsp_ma = ctsp.ctsp_ma
      JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
      JOIN gianhang gh ON sp.gh_ma = gh.gh_ma
      WHERE ctgh.kh_ma = $1
      ORDER BY gh.gh_ten ASC, ctgh.ctgh_thoidiemthem DESC
    `;
    const result = await pool.query(query, [kh_ma]);
    return result.rows;
  },

  // 2. Đếm tổng số lượng món đồ trong giỏ (để hiện lên icon)
  getCartCount: async (kh_ma) => {
    const query = `SELECT SUM(ctgh_soluong) as total FROM chitietgiohang WHERE kh_ma = $1`;
    const result = await pool.query(query, [kh_ma]);
    return result.rows[0]?.total || 0;
  },

  // 3. Thêm vào giỏ (Nếu có rồi thì cộng dồn số lượng)
  addToCart: async (kh_ma, ctsp_ma, soluong) => {
    const query = `
      INSERT INTO chitietgiohang (kh_ma, ctsp_ma, ctgh_soluong)
      VALUES ($1, $2, $3)
      ON CONFLICT (kh_ma, ctsp_ma) 
      DO UPDATE SET ctgh_soluong = chitietgiohang.ctgh_soluong + EXCLUDED.ctgh_soluong
      RETURNING *
    `;
    const result = await pool.query(query, [kh_ma, ctsp_ma, soluong]);
    return result.rows[0];
  },

  // 4. Cập nhật số lượng (Ghi đè)
  updateQuantity: async (kh_ma, ctsp_ma, soluong) => {
    const query = `
      UPDATE chitietgiohang 
      SET ctgh_soluong = $1 
      WHERE kh_ma = $2 AND ctsp_ma = $3 
      RETURNING *
    `;
    const result = await pool.query(query, [soluong, kh_ma, ctsp_ma]);
    return result.rows[0];
  },

  // 5. Xóa 1 món đồ khỏi giỏ
  removeItem: async (kh_ma, ctsp_ma) => {
    const query = `DELETE FROM chitietgiohang WHERE kh_ma = $1 AND ctsp_ma = $2 RETURNING *`;
    const result = await pool.query(query, [kh_ma, ctsp_ma]);
    return result.rows[0];
  },

  // 6. Xóa sạch giỏ hàng
  clearCart: async (kh_ma) => {
    const query = `DELETE FROM chitietgiohang WHERE kh_ma = $1 RETURNING *`;
    const result = await pool.query(query, [kh_ma]);
    return result.rows;
  }
};

module.exports = GioHangModel;