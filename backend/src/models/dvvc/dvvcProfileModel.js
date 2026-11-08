const db = require('../../config/db');

const DvvcProfileModel = {
    // 1. Lấy thông tin Profile (Đã thêm sepay_webhook_secret)
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
                tt.sepay_webhook_secret AS "sepay_webhook_secret", -- 🟢 Đã thêm cột này
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

    // 2. Cập nhật thông tin cơ bản (Tên, Mô tả, Hình ảnh)
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

    // 3. Lưu thông tin ngân hàng và Webhook Secret (Đã cập nhật)
    saveBankAccount: async (dvvc_ma, data) => {
        const query = `
            INSERT INTO thongtinnhantien_dvvc (
                dvvc_ma, 
                nganhang_ma, 
                ttnt_dvvc_sotaikhoan, 
                ttnt_dvvc_tentaikhoan,
                sepay_webhook_secret
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (dvvc_ma, nganhang_ma) 
            DO UPDATE SET 
                ttnt_dvvc_sotaikhoan = EXCLUDED.ttnt_dvvc_sotaikhoan,
                ttnt_dvvc_tentaikhoan = EXCLUDED.ttnt_dvvc_tentaikhoan,
                sepay_webhook_secret = EXCLUDED.sepay_webhook_secret -- 🟢 Cập nhật thêm Secret
            RETURNING *
        `;
        const values = [
            dvvc_ma, 
            data.NganHang_Ma, 
            data.TTNT_DVVC_SoTaiKhoan, 
            data.TTNT_DVVC_TenTaiKhoan,
            data.sepay_webhook_secret || null // 🟢 Truyền dữ liệu Secret
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    // 4. Xóa tài khoản ngân hàng
    deleteBankAccount: async (dvvc_ma) => {
        const query = `DELETE FROM thongtinnhantien_dvvc WHERE dvvc_ma = $1 RETURNING *`;
        const result = await db.query(query, [dvvc_ma]);
        return result.rows[0];
    },

    // 5. Cập nhật mật khẩu
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