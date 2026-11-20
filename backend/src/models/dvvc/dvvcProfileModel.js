const db = require('../../config/db');
const { danhDauDaLuu } = require('../../config/secretSavedAt');

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
                -- Lấy secret của BẤT KỲ dòng ngân hàng nào của ĐVVC (không phụ thuộc dòng đang join)
                (SELECT s.sepay_webhook_secret
                   FROM thongtinnhantien_dvvc s
                  WHERE s.dvvc_ma = d.dvvc_ma
                    AND s.sepay_webhook_secret IS NOT NULL
                  LIMIT 1) AS "sepay_webhook_secret",
                -- Dùng to_jsonb để không lỗi nếu migration chưa chạy
                (SELECT to_jsonb(s3)->>'sepay_webhook_secret_saved_at'
                   FROM thongtinnhantien_dvvc s3
                  WHERE s3.dvvc_ma = d.dvvc_ma
                    AND s3.sepay_webhook_secret IS NOT NULL
                  LIMIT 1) AS "sepay_webhook_secret_saved_at",
                nh.nhg_ten AS "NHG_Ten", 
                nh.nhg_logo AS "NHG_Logo"
            FROM donvivanchuyen d
            LEFT JOIN LATERAL (
                -- Mỗi ĐVVC chỉ nên có 1 tài khoản; nếu dữ liệu cũ có nhiều dòng
                -- thì lấy dòng mới nhất, tránh hiển thị nhầm tài khoản cũ.
                SELECT * FROM thongtinnhantien_dvvc
                 WHERE dvvc_ma = d.dvvc_ma
                 ORDER BY ctid DESC
                 LIMIT 1
            ) tt ON true
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

    // 3. Lưu thông tin ngân hàng + Webhook Secret
    // Mỗi ĐVVC chỉ giữ 1 tài khoản: đổi ngân hàng = thay hẳn dòng cũ,
    // tránh sinh thêm dòng khiến trang hiển thị lại tài khoản cũ.
    saveBankAccount: async (dvvc_ma, data) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Giữ lại secret cũ nếu lần này để trống
            const cuRes = await client.query(
                `SELECT sepay_webhook_secret
                   FROM thongtinnhantien_dvvc
                  WHERE dvvc_ma = $1
                    AND sepay_webhook_secret IS NOT NULL
                  LIMIT 1`,
                [dvvc_ma]
            );

            const secretMoi =
                data.sepay_webhook_secret !== null &&
                data.sepay_webhook_secret !== undefined &&
                String(data.sepay_webhook_secret).trim() !== ''
                    ? String(data.sepay_webhook_secret).trim()
                    : null;

            const secretLuu = secretMoi || cuRes.rows[0]?.sepay_webhook_secret || null;

            await client.query(
                'DELETE FROM thongtinnhantien_dvvc WHERE dvvc_ma = $1',
                [dvvc_ma]
            );

            const result = await client.query(
                `INSERT INTO thongtinnhantien_dvvc (
                    dvvc_ma,
                    nganhang_ma,
                    ttnt_dvvc_sotaikhoan,
                    ttnt_dvvc_tentaikhoan,
                    sepay_webhook_secret
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [
                    dvvc_ma,
                    data.NganHang_Ma,
                    data.TTNT_DVVC_SoTaiKhoan,
                    data.TTNT_DVVC_TenTaiKhoan,
                    secretLuu
                ]
            );

            // Chỉ ghi mốc thời gian khi người dùng nhập secret mới
            if (secretMoi) {
                await danhDauDaLuu(
                    (sql, params) => client.query(sql, params),
                    'thongtinnhantien_dvvc',
                    'dvvc_ma',
                    dvvc_ma
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('LỖI LƯU THÔNG TIN NHẬN TIỀN ĐVVC:', error.message);
            throw error;
        } finally {
            client.release();
        }
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