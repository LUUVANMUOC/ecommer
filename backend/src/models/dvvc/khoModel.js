const pool = require('../../config/db');

const KhoModel = {
    // Lấy danh sách kho của 1 ĐVVC (kèm địa chỉ đầy đủ)
    getAllByDVVC: async (dvvc_ma, tinh_ma, xa_ma) => {
        let query = `
            SELECT 
                k.kho_ma AS "Kho_Ma", k.kho_ten AS "Kho_Ten", k.kho_hinhanh AS "Kho_HinhAnh",
                d.dc_ma AS "DC_Ma", d.dc_mota AS "DC_MoTa", d.dc_gps AS "DC_GPS", d.xa_ma AS "Xa_Ma",
                x.xa_ten AS "Xa_Ten", t.tinh_ma AS "Tinh_Ma", t.tinh_ten AS "Tinh_Ten"
            FROM kho k
            JOIN diachi d ON k.dc_ma = d.dc_ma
            JOIN xaphuong x ON d.xa_ma = x.xa_ma
            JOIN tinhtp t ON x.tinh_ma = t.tinh_ma
            WHERE k.dvvc_ma = $1
        `;
        const values = [dvvc_ma];
        let index = 2;
        if (tinh_ma) { query += ` AND t.tinh_ma = $${index}`; values.push(tinh_ma); index++; }
        if (xa_ma) { query += ` AND x.xa_ma = $${index}`; values.push(xa_ma); index++; }
        query += ` ORDER BY k.kho_ma DESC`;
        const res = await pool.query(query, values);
        return res.rows;
    },

    createKho: async (dvvc_ma, data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Tự sinh mã địa chỉ (DC...)
            const dcRes = await client.query(`SELECT dc_ma FROM diachi ORDER BY CAST(SUBSTRING(dc_ma FROM 3) AS INTEGER) DESC LIMIT 1`);
            let newDcMa = 'DC00000001';
            if (dcRes.rows.length > 0) {
                const currentNumber = parseInt(dcRes.rows[0].dc_ma.replace('DC', ''), 10);
                newDcMa = 'DC' + (currentNumber + 1).toString().padStart(8, '0');
            }

            // 2. Insert Địa chỉ
            await client.query(
                `INSERT INTO diachi (dc_ma, dc_mota, dc_gps, xa_ma) VALUES ($1, $2, $3, $4)`,
                [newDcMa, data.DC_MoTa, data.DC_GPS, data.Xa_Ma]
            );

            // 3. Tự sinh mã kho (KH...)
            const khoRes = await client.query(`SELECT kho_ma FROM kho ORDER BY CAST(SUBSTRING(kho_ma FROM 3) AS INTEGER) DESC LIMIT 1`);
            let newKhoMa = 'KH00000001';
            if (khoRes.rows.length > 0) {
                const currentNumber = parseInt(khoRes.rows[0].kho_ma.replace('KH', ''), 10);
                newKhoMa = 'KH' + (currentNumber + 1).toString().padStart(8, '0');
            }

            // 4. Insert Kho (Thêm kho_hashpass)
            await client.query(
                `INSERT INTO kho (kho_ma, kho_ten, kho_hinhanh, dc_ma, dvvc_ma, kho_hashpass) VALUES ($1, $2, $3, $4, $5, $6)`,
                [newKhoMa, data.Kho_Ten, data.Kho_HinhAnh, newDcMa, dvvc_ma, data.Kho_HashPass]
            );

            await client.query('COMMIT');
            return { Kho_Ma: newKhoMa, message: 'Thêm kho thành công' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    updateKho: async (kho_ma, data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Cập nhật Địa chỉ
            const khoInfo = await client.query(`SELECT dc_ma FROM kho WHERE kho_ma = $1`, [kho_ma]);
            if (khoInfo.rows.length === 0) throw new Error("Không tìm thấy kho");
            const dc_ma = khoInfo.rows[0].dc_ma;

            await client.query(
                `UPDATE diachi SET dc_mota = $1, dc_gps = $2, xa_ma = $3 WHERE dc_ma = $4`,
                [data.DC_MoTa, data.DC_GPS, data.Xa_Ma, dc_ma]
            );

            // 2. Cập nhật Kho
            await client.query(
                `UPDATE kho SET kho_ten = $1, kho_hinhanh = COALESCE($2, kho_hinhanh) WHERE kho_ma = $3`,
                [data.Kho_Ten, data.Kho_HinhAnh, kho_ma]
            );

            await client.query('COMMIT');
            return { message: 'Cập nhật kho thành công' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    deleteKho: async (kho_ma) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lấy dc_ma để xóa
            const khoInfo = await client.query(`SELECT dc_ma FROM kho WHERE kho_ma = $1`, [kho_ma]);
            if (khoInfo.rows.length === 0) throw new Error("Không tìm thấy kho");
            const dc_ma = khoInfo.rows[0].dc_ma;

            // Xóa Kho trước (vì có khóa ngoại trỏ đến diachi)
            await client.query(`DELETE FROM kho WHERE kho_ma = $1`, [kho_ma]);
            // Xóa Địa chỉ
            await client.query(`DELETE FROM diachi WHERE dc_ma = $1`, [dc_ma]);

            await client.query('COMMIT');
            return { message: 'Xóa kho thành công' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = KhoModel;