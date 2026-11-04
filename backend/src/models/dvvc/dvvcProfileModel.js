const db = require('../../config/db');

const DvvcProfileModel = {
    getProfile: async (dvvc_ma) => {
        const query = `
            SELECT 
                d.dvvc_ma AS "DVVC_Ma", 
                d.dvvc_ten AS "DVVC_Ten", 
                d.dvvc_email AS "DVVC_Email", 
                d.dvvc_hinhanh AS "DVVC_HinhAnh",
                d.dvvc_mota AS "DVVC_MoTa",
                d.dvvc_hashpass AS "DVVC_HashPass",
                tt.nganhang_ma AS "NganHang_Ma", 
                tt.ttnt_dvvc_sotaikhoan AS "TTNT_DVVC_SoTaiKhoan", 
                tt.ttnt_dvvc_tentaikhoan AS "TTNT_DVVC_TenTaiKhoan",
                nh.nhg_ten AS "NHG_Ten", 
                nh.nhg_logo AS "NHG_Logo"
            FROM donvivanchuyen d
            LEFT JOIN thongtinnhantien_dvvc tt ON d.dvvc_ma = tt.dvvc_ma
            LEFT JOIN nganhang nh ON tt.nganhang_ma = nh.nhg_ma
            WHERE d.dvvc_ma = $1
        `;
        const result = await db.query(query, [dvvc_ma]);
        return result.rows[0];
    },

    updateProfile: async (dvvc_ma, data) => {
        const query = `
            UPDATE donvivanchuyen 
            SET dvvc_ten = $1, dvvc_mota = $2, dvvc_hinhanh = $3
            WHERE dvvc_ma = $4
            RETURNING dvvc_ma AS "DVVC_Ma", dvvc_ten AS "DVVC_Ten", dvvc_email AS "DVVC_Email", dvvc_hinhanh AS "DVVC_HinhAnh", dvvc_mota AS "DVVC_MoTa"
        `;
        const result = await db.query(query, [data.DVVC_Ten, data.DVVC_MoTa, data.DVVC_HinhAnh, dvvc_ma]);
        return result.rows[0];
    },

    saveBankAccount: async (dvvc_ma, data) => {
        const query = `
            INSERT INTO thongtinnhantien_dvvc (dvvc_ma, nganhang_ma, ttnt_dvvc_sotaikhoan, ttnt_dvvc_tentaikhoan)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (dvvc_ma, nganhang_ma) 
            DO UPDATE SET 
                ttnt_dvvc_sotaikhoan = EXCLUDED.ttnt_dvvc_sotaikhoan,
                ttnt_dvvc_tentaikhoan = EXCLUDED.ttnt_dvvc_tentaikhoan
            RETURNING *
        `;
        const values = [dvvc_ma, data.NganHang_Ma, data.TTNT_DVVC_SoTaiKhoan, data.TTNT_DVVC_TenTaiKhoan];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    deleteBankAccount: async (dvvc_ma) => {
        const query = `DELETE FROM thongtinnhantien_dvvc WHERE dvvc_ma = $1 RETURNING *`;
        const result = await db.query(query, [dvvc_ma]);
        return result.rows[0];
    },

    updatePassword: async (dvvc_ma, newPasswordHash) => {
        const query = `
            UPDATE donvivanchuyen 
            SET dvvc_hashpass = $1 
            WHERE dvvc_ma = $2 
            RETURNING dvvc_ma
        `;
        const result = await db.query(query, [newPasswordHash, dvvc_ma]);
        return result.rows[0];
    }
};

module.exports = DvvcProfileModel;