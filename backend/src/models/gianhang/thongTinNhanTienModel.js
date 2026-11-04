const pool = require('../../config/db');

const ThongTinNhanTienModel = {
    // 1. Lấy thông tin nhận tiền (Chỉ lấy 1 dòng duy nhất)
    getByGianHang: async (gh_ma) => {
        try {
            const query = `
                SELECT 
                    tt.gh_ma, 
                    tt.nh_ma, 
                    tt.ttnt_gianhang_tentaikhoan,
                    tt.ttnt_gianhang_sotaikhoan,
                    nh.nhg_ten,
                    nh.nhg_logo
                FROM thongtinnhantien_gianhang tt
                LEFT JOIN nganhang nh ON tt.nh_ma = nh.nhg_ma
                WHERE tt.gh_ma = $1
                LIMIT 1
            `;
            const result = await pool.query(query, [gh_ma]);
            return result.rows[0] || null; 
        } catch (error) {
            console.error("LỖI SQL GET BANK:", error.message);
            throw error;
        }
    },

    // 2. Lưu thông tin (Xóa tài khoản cũ của shop, thêm tài khoản mới)
    createOrUpdate: async (data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Xóa tài khoản cũ (nếu có) để đảm bảo mỗi shop chỉ có 1 tài khoản
            await client.query('DELETE FROM thongtinnhantien_gianhang WHERE gh_ma = $1', [data.gh_ma]);

            // Thêm tài khoản mới
            const query = `
                INSERT INTO thongtinnhantien_gianhang (
                    gh_ma, 
                    nh_ma, 
                    ttnt_gianhang_tentaikhoan, 
                    ttnt_gianhang_sotaikhoan
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const result = await client.query(query, [
                data.gh_ma, 
                data.nh_ma, 
                data.ttnt_gianhang_tentaikhoan,
                data.ttnt_gianhang_sotaikhoan
            ]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("LỖI LƯU THÔNG TIN NHẬN TIỀN:", error.message);
            throw error;
        } finally {
            client.release();
        }
    },

    // 3. Xóa tài khoản nhận tiền
    delete: async (gh_ma) => {
        try {
            const query = `DELETE FROM thongtinnhantien_gianhang WHERE gh_ma = $1 RETURNING *`;
            const result = await pool.query(query, [gh_ma]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
};

module.exports = ThongTinNhanTienModel;