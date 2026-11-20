// backend/src/models/sanThuongMaiModel.js
const db = require('../../config/db');
const { danhDauDaLuu } = require('../../config/secretSavedAt');

// Cột sepay_webhook_secret chỉ có sau khi chạy migration.
// Kiểm tra 1 lần rồi ghi nhớ, để trang vẫn lưu được tài khoản nếu chưa migrate.
let coCotSecretCache = null;
const kiemTraCotSecret = async (client) => {
    if (coCotSecretCache !== null) return coCotSecretCache;

    const res = await client.query(
        `SELECT 1
           FROM information_schema.columns
          WHERE table_name = 'thongtinnhantien_stmdt'
            AND column_name = 'sepay_webhook_secret'
          LIMIT 1`
    );
    coCotSecretCache = res.rowCount > 0;
    return coCotSecretCache;
};

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
                -- Lấy secret của BẤT KỲ dòng ngân hàng nào của Sàn (không phụ thuộc dòng đang join).
                -- Dùng to_jsonb để không lỗi nếu migration chưa chạy.
                (SELECT to_jsonb(s)->>'sepay_webhook_secret'
                   FROM thongtinnhantien_stmdt s
                  WHERE s.stmdt_ma = st.stmdt_ma
                    AND to_jsonb(s)->>'sepay_webhook_secret' IS NOT NULL
                  LIMIT 1) AS "sepay_webhook_secret",
                (SELECT to_jsonb(s3)->>'sepay_webhook_secret_saved_at'
                   FROM thongtinnhantien_stmdt s3
                  WHERE s3.stmdt_ma = st.stmdt_ma
                    AND to_jsonb(s3)->>'sepay_webhook_secret' IS NOT NULL
                  LIMIT 1) AS "sepay_webhook_secret_saved_at",
                nh.nhg_ten AS "NHG_Ten", 
                nh.nhg_logo AS "NHG_Logo"
            FROM san_thuong_mai_dien_tu st
            LEFT JOIN LATERAL (
                SELECT * FROM thongtinnhantien_stmdt
                 WHERE stmdt_ma = st.stmdt_ma
                 ORDER BY ctid DESC
                 LIMIT 1
            ) tt ON true
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

    // ✅ Lưu / Cập nhật tài khoản nhận tiền (mỗi Sàn chỉ giữ 1 tài khoản)
    // Đổi ngân hàng = thay hẳn tài khoản cũ, tránh nhiều dòng khiến nơi khác đọc nhầm.
    saveBankAccount: async (STMDT_Ma, data) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Giữ lại secret cũ nếu lần này để trống
            const cuRes = await client.query(
                `SELECT to_jsonb(s)->>'sepay_webhook_secret' AS secret
                   FROM thongtinnhantien_stmdt s
                  WHERE s.stmdt_ma = $1
                    AND to_jsonb(s)->>'sepay_webhook_secret' IS NOT NULL
                  LIMIT 1`,
                [STMDT_Ma]
            );

            const secretMoi =
                data.sepay_webhook_secret !== null &&
                data.sepay_webhook_secret !== undefined &&
                String(data.sepay_webhook_secret).trim() !== ''
                    ? String(data.sepay_webhook_secret).trim()
                    : null;

            const secretLuu = secretMoi || cuRes.rows[0]?.secret || null;
            const coCotSecret = await kiemTraCotSecret(client);

            if (secretMoi && !coCotSecret) {
                console.warn(
                    '[sanThuongMaiModel] Chưa có cột sepay_webhook_secret — hãy chạy migration ' +
                    'backend/scripts/sql/2026-11-23_them_webhook_secret_stmdt.sql'
                );
            }

            await client.query(
                'DELETE FROM thongtinnhantien_stmdt WHERE stmdt_ma = $1',
                [STMDT_Ma]
            );

            const cot = [
                'stmdt_ma',
                'nganhang_ma',
                'ttnt_stmdt_sotaikhoan',
                'ttnt_stmdt_tentaikhoan'
            ];
            const giaTri = [
                STMDT_Ma,
                data.NganHang_Ma,
                data.TTNT_STMDT_SoTaiKhoan,
                data.TTNT_STMDT_TenTaiKhoan
            ];

            if (coCotSecret) {
                cot.push('sepay_webhook_secret');
                giaTri.push(secretLuu);
            }

            const query = `
                INSERT INTO thongtinnhantien_stmdt (${cot.join(', ')})
                VALUES (${cot.map((_, i) => '$' + (i + 1)).join(', ')})
                RETURNING stmdt_ma AS "STMDT_Ma", nganhang_ma AS "NganHang_Ma",
                          ttnt_stmdt_sotaikhoan AS "TTNT_STMDT_SoTaiKhoan",
                          ttnt_stmdt_tentaikhoan AS "TTNT_STMDT_TenTaiKhoan"
            `;
            const result = await client.query(query, giaTri);

            // Chỉ ghi mốc thời gian khi người dùng nhập secret mới
            if (secretMoi && coCotSecret) {
                await danhDauDaLuu(
                    (sql, params) => client.query(sql, params),
                    'thongtinnhantien_stmdt',
                    'stmdt_ma',
                    STMDT_Ma
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('LỖI LƯU THÔNG TIN NHẬN TIỀN SÀN:', error.message);
            throw error;
        } finally {
            client.release();
        }
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