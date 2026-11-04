// backend/src/models/san/loaiShipperModel.js
const pool = require('../../config/db');

const LoaiShipperModel = {
  getAll: async () => {
    const res = await pool.query(`
      SELECT 
        lshipper_ma AS "Lshipper_Ma",
        lshipper_ten AS "Lshipper_Ten"
      FROM loai_shipper
      ORDER BY lshipper_ma ASC
    `);
    return res.rows;
  },
};

module.exports = LoaiShipperModel;