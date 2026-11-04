const pool = require('../../config/db');

const GianHangKienNghiModel = {
  // Lấy danh sách kiến nghị của 1 Gian Hàng
  getByShop: async (gh_ma) => {
    const query = `SELECT * FROM gianhang_kiennghi WHERE gh_ma = $1 ORDER BY ghkn_thoidiemtao DESC`;
    const res = await pool.query(query, [gh_ma]);
    return res.rows;
  },

  // Lấy danh sách kiến nghị gửi đến Sàn (kèm tên Shop)
  getAllForSan: async () => {
    const query = `
      SELECT k.*, g.gh_ten 
      FROM gianhang_kiennghi k
      JOIN gianhang g ON k.gh_ma = g.gh_ma
      ORDER BY k.ghkn_thoidiemtao DESC
    `;
    const res = await pool.query(query);
    return res.rows;
  },

  // Lấy mã lớn nhất để sinh mã tự động
  getLatestMa: async () => {
    const query = `
      SELECT ghkn_ma FROM gianhang_kiennghi 
      WHERE ghkn_ma ~ '^KN[0-9]+$'
      ORDER BY CAST(SUBSTRING(ghkn_ma FROM 3) AS INTEGER) DESC 
      LIMIT 1
    `;
    const res = await pool.query(query);
    return res.rows[0] ? res.rows[0].ghkn_ma : null;
  },

  // Tạo kiến nghị mới (Gian hàng tạo)
  create: async (data) => {
    const query = `
      INSERT INTO gianhang_kiennghi (ghkn_ma, stmdt_ma, gh_ma, ghkn_noidungkiennghi)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const values = [data.ghkn_ma, data.stmdt_ma, data.gh_ma, data.ghkn_noidungkiennghi];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  // Phản hồi kiến nghị (Sàn phản hồi)
  reply: async (id, phanhoi) => {
    const query = `
      UPDATE gianhang_kiennghi 
      SET ghkn_noidungphanhoi = $1, ghkn_thoidiemphanhoi = CURRENT_TIMESTAMP 
      WHERE ghkn_ma = $2 RETURNING *
    `;
    const res = await pool.query(query, [phanhoi, id]);
    return res.rows[0];
  }
};

module.exports = GianHangKienNghiModel;