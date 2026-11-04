const db = require('../../config/db');

const tinhtpModel = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM tinhtp ORDER BY tinh_ma ASC');
        return result.rows;
    },

    getById: async (id) => {
        const result = await db.query('SELECT * FROM tinhtp WHERE tinh_ma = $1', [id]);
        return result.rows[0];
    },

    create: async (data) => {
        const query = 'INSERT INTO tinhtp (tinh_ma, tinh_ten, tinh_gps) VALUES ($1, $2, $3) RETURNING *';
        const values = [data.tinh_ma, data.tinh_ten, data.tinh_gps];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    update: async (id, data) => {
        const query = 'UPDATE tinhtp SET tinh_ten = $1, tinh_gps = $2 WHERE tinh_ma = $3 RETURNING *';
        // Đã sửa data.TH_MoTa thành data.tinh_gps
        const values = [data.tinh_ten, data.tinh_gps, id]; 
        const result = await db.query(query, values);
        return result.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM tinhtp WHERE tinh_ma = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = tinhtpModel;