const db = require('../../config/db');

const DiaChiModel = {
    getById: async (id) => {
        if (!id) return null; 
        const result = await db.query('SELECT * FROM diachi WHERE DC_Ma = $1', [id]);
        return result.rows[0];
    },
    create: async (data) => {
        const newId = "DC_" + Math.floor(Math.random() * 1000000); // Sinh mã DC_xxx
        const query = 'INSERT INTO DIACHI (DC_Ma, DC_MoTa, DC_GPS, XA_Ma) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [newId, data.DC_MoTa, data.DC_GPS || null, data.XA_Ma];
        const result = await db.query(query, values);
        return result.rows[0];
    },
    update: async (id, data) => {
        const query = 'UPDATE diachi SET DC_MoTa = $1, DC_GPS = $2, XA_Ma = $3 WHERE DC_Ma = $4 RETURNING *';
        const values = [data.DC_MoTa, data.DC_GPS, data.XA_Ma, id];
        const result = await db.query(query, values);
        return result.rows[0];
    }
};

module.exports = DiaChiModel;