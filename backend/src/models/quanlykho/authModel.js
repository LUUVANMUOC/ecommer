const pool = require('../../config/db');

const QuanLyKhoAuthModel = {
    findByKhoMa: async (kho_ma) => {
        const query = `
            SELECT 
                k.kho_ma, k.kho_ten, k.kho_hinhanh, k.kho_hashpass,
                k.dvvc_ma, d.dvvc_ten
            FROM kho k
            JOIN donvivanchuyen d ON k.dvvc_ma = d.dvvc_ma
            WHERE k.kho_ma = $1
            LIMIT 1
        `;
        const res = await pool.query(query, [kho_ma]);
        return res.rows[0] || null;
    }
};
module.exports = QuanLyKhoAuthModel;