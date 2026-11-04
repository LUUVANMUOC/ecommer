const db = require('../../config/db');

const NganHangModel = {
    // 1. Lấy tất cả
    getAll: async () => {
        const result = await db.query('SELECT * FROM nganhang ORDER BY nhg_ma ASC');
        return result.rows;
    },

    // 2. Lấy 1 theo mã
    getById: async (id) => {
        const result = await db.query('SELECT * FROM nganhang WHERE nhg_ma = $1', [id]);
        return result.rows[0];
    },

    // 3. Thêm mới (Đã bổ sung nhg_logo)
    create: async (data) => {
        const query = 'INSERT INTO nganhang (nhg_ma, nhg_ten, nhg_logo) VALUES ($1, $2, $3) RETURNING *';
        const values = [data.NHG_Ma, data.NHG_Ten, data.NHG_Logo];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    // 4. Cập nhật (Đã bổ sung nhg_logo)
    update: async (id, data) => {
        const query = 'UPDATE nganhang SET nhg_ten = $1, nhg_logo = $2 WHERE nhg_ma = $3 RETURNING *';
        const values = [data.NHG_Ten, data.NHG_Logo, id];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    // 5. Xóa
    delete: async (id) => {
        const query = 'DELETE FROM nganhang WHERE nhg_ma = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = NganHangModel;