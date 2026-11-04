const pool = require('../../config/db');

const TrangThaiDonHangModel = {
  // Lấy danh sách trạng thái đơn hàng
  getAll: async () => {
    const query = `
      SELECT 
        ttdh_ma AS "Ma", 
        ttdh_ten AS "Ten"
      FROM trangthaidonhang
      ORDER BY ttdh_ma ASC
    `;
    const res = await pool.query(query);
    return res.rows;
  }
};

module.exports = TrangThaiDonHangModel;