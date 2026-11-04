// backend/src/models/shipper/authModel.js
const pool = require('../../config/db');

const ShipperAuthModel = {
  findBySdt: async (sdt) => {
    const query = `
      SELECT 
        s.shipper_ma,
        s.shipper_ten,
        s.shipper_sdt,
        s.shipper_hinhanh,
        s.shipper_hashpass,
        s.kho_ma,
        k.kho_ten,
        k.dvvc_ma,
        d.dvvc_ten,
        s.lsp_ma,
        ls.lshipper_ten
      FROM shipper s
      JOIN kho k ON s.kho_ma = k.kho_ma
      JOIN donvivanchuyen d ON k.dvvc_ma = d.dvvc_ma
      LEFT JOIN loai_shipper ls ON s.lsp_ma = ls.lshipper_ma
      WHERE s.shipper_sdt = $1
      LIMIT 1
    `;
    const res = await pool.query(query, [sdt]);
    return res.rows[0] || null;
  }
};

module.exports = ShipperAuthModel;