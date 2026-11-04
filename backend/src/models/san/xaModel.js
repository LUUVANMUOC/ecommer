const db = require('../../config/db');

const XaModel = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM XAphuong ORDER BY XA_Ma ASC');
        return result.rows;
    },

    getById: async (id) => {
        const result = await db.query('SELECT * FROM XAphuong WHERE XA_Ma = $1', [id]);
        return result.rows[0];
    },

    create: async (data) => {
        // Thêm Tinh_Ma vào câu lệnh INSERT
        const query = 'INSERT INTO XAphuong (XA_Ma, XA_Ten, Xa_GPS, Tinh_Ma) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [data.XA_Ma, data.XA_Ten, data.Xa_GPS, data.Tinh_Ma];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    update: async (id, data) => {
        // Thêm Tinh_Ma vào câu lệnh UPDATE
        const query = 'UPDATE XAphuong SET XA_Ten = $1, Xa_GPS = $2, Tinh_Ma = $3 WHERE XA_Ma = $4 RETURNING *';
        const values = [data.XA_Ten, data.Xa_GPS, data.Tinh_Ma, id];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM XAphuong WHERE XA_Ma = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = XaModel;