// backend/src/models/sanThuongMaiModel.js
const db = require('../../config/db');

const SanThuongMaiModel = {
    // 1. Tìm sàn bằng Email
    findByEmail: async (email) => {
        const query = 'SELECT * FROM san_thuong_mai_dien_tu WHERE stmdt_email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    },

    // 2. Lấy mã sàn lớn nhất hiện tại trong Database
    getLatestMa: async () => {
        const query = `
            SELECT stmdt_ma FROM san_thuong_mai_dien_tu 
            ORDER BY CAST(SUBSTRING(stmdt_ma FROM 3) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await db.query(query);
        return result.rows[0] ? result.rows[0].stmdt_ma : null; 
    },

    // 3. Tạo sàn mới
    createSan: async (data) => {
        const query = `
            INSERT INTO san_thuong_mai_dien_tu 
            (stmdt_ma, stmdt_ten, stmdt_email, stmdt_sdt, stmdt_hashpass, ct_ma) 
            VALUES ($1, $2, $3, $4, $5, 'CT01') 
            RETURNING stmdt_ma AS "STMDT_Ma", stmdt_ten AS "STMDT_Ten", stmdt_email AS "STMDT_Email", stmdt_sdt AS "STMDT_SDT"
        `;
        const values = [
            data.STMDT_Ma,
            data.STMDT_Ten,
            data.STMDT_Email,
            data.STMDT_SDT,
            data.STMDT_HashPass
        ];
        
        const result = await db.query(query, values);
        return result.rows[0];
    },

    // ✅ Lấy thông tin Profile bao gồm cả Ngân hàng (Dùng Alias viết hoa)
    getProfile: async (STMDT_Ma) => {
        const query = `
            SELECT 
                st.stmdt_ma AS "STMDT_Ma", 
                st.stmdt_ten AS "STMDT_Ten", 
                st.stmdt_email AS "STMDT_Email", 
                st.stmdt_sdt AS "STMDT_SDT",
                st.stmdt_hashpass AS "STMDT_HashPass",
                tt.nganhang_ma AS "NganHang_Ma", 
                tt.ttnt_stmdt_sotaikhoan AS "TTNT_STMDT_SoTaiKhoan", 
                tt.ttnt_stmdt_tentaikhoan AS "TTNT_STMDT_TenTaiKhoan",
                nh.nhg_ten AS "NHG_Ten", 
                nh.nhg_logo AS "NHG_Logo"
            FROM san_thuong_mai_dien_tu st
            LEFT JOIN thongtinnhantien_stmdt tt ON st.stmdt_ma = tt.stmdt_ma
            LEFT JOIN nganhang nh ON tt.nganhang_ma = nh.nhg_ma
            WHERE st.stmdt_ma = $1
        `;
        const result = await db.query(query, [STMDT_Ma]);
        return result.rows[0];
    },

    // ✅ Cập nhật thông tin cơ bản
    updateProfile: async (STMDT_Ma, data) => {
        const query = `
            UPDATE san_thuong_mai_dien_tu 
            SET stmdt_ten = $1, stmdt_sdt = $2
            WHERE stmdt_ma = $3
            RETURNING stmdt_ma AS "STMDT_Ma", stmdt_ten AS "STMDT_Ten", stmdt_email AS "STMDT_Email", stmdt_sdt AS "STMDT_SDT"
        `;
        const result = await db.query(query, [data.STMDT_Ten, data.STMDT_SDT, STMDT_Ma]);
        return result.rows[0];
    },

    // ✅ Lưu / Cập nhật tài khoản nhận tiền (Upsert)
    saveBankAccount: async (STMDT_Ma, data) => {
        const query = `
            INSERT INTO thongtinnhantien_stmdt (stmdt_ma, nganhang_ma, ttnt_stmdt_sotaikhoan, ttnt_stmdt_tentaikhoan)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (stmdt_ma, nganhang_ma) 
            DO UPDATE SET 
                ttnt_stmdt_sotaikhoan = EXCLUDED.ttnt_stmdt_sotaikhoan,
                ttnt_stmdt_tentaikhoan = EXCLUDED.ttnt_stmdt_tentaikhoan
            RETURNING stmdt_ma AS "STMDT_Ma", nganhang_ma AS "NganHang_Ma", ttnt_stmdt_sotaikhoan AS "TTNT_STMDT_SoTaiKhoan", ttnt_stmdt_tentaikhoan AS "TTNT_STMDT_TenTaiKhoan"
        `;
        const values = [STMDT_Ma, data.NganHang_Ma, data.TTNT_STMDT_SoTaiKhoan, data.TTNT_STMDT_TenTaiKhoan];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    // ✅ Xóa tài khoản nhận tiền
    deleteBankAccount: async (STMDT_Ma) => {
        const query = `DELETE FROM thongtinnhantien_stmdt WHERE stmdt_ma = $1 RETURNING *`;
        const result = await db.query(query, [STMDT_Ma]);
        return result.rows[0];
    },

    // ✅ Cập nhật mật khẩu
    updatePassword: async (STMDT_Ma, newPasswordHash) => {
        const query = `
            UPDATE san_thuong_mai_dien_tu 
            SET stmdt_hashpass = $1 
            WHERE stmdt_ma = $2 
            RETURNING stmdt_ma
        `;
        const result = await db.query(query, [newPasswordHash, STMDT_Ma]);
        return result.rows[0];
    }
};

module.exports = SanThuongMaiModel;