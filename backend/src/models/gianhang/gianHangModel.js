const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Đường dẫn tới thư mục lưu ảnh của Gian hàng
const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/shops');

const GianHangModel = {
    findByEmail: async (email) => {
        const query = 'SELECT * FROM gianhang WHERE gh_email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    getLatestMa: async () => {
        const query = `
            SELECT gh_ma FROM gianhang 
            WHERE gh_ma ~ '^GH[0-9]+$'
            ORDER BY CAST(SUBSTRING(gh_ma FROM 3) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ? result.rows[0].gh_ma : null;
    },

    createGianHangWithAddress: async (shopData, addressData) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); 

            const dc_ma = 'DC' + Date.now().toString().slice(-8);
            
            const insertAddressQuery = `
                INSERT INTO diachi (dc_ma, dc_mota, dc_gps, xa_ma)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(insertAddressQuery, [
                dc_ma, 
                addressData.DC_MoTa || addressData.dc_mota, 
                null, 
                addressData.XA_Ma || addressData.xa_ma
            ]);

            const insertShopQuery = `
                INSERT INTO gianhang (
                    gh_ma, gh_ten, gh_mota, gh_hinhanh, gh_email, gh_hashpass, 
                    ct_ma, dc_ma, gh_danhgia, gh_theodoi
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0) 
                RETURNING gh_ma, gh_ten, gh_email
            `;
            const shopValues = [
                shopData.gh_ma, shopData.gh_ten, shopData.gh_mota || null, shopData.gh_hinhanh || null,
                shopData.gh_email, shopData.gh_hashpass, 
                'CT02', 
                dc_ma
            ];
            const result = await client.query(insertShopQuery, shopValues);

            await client.query('COMMIT'); 
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK'); 
            console.error("LỖI INSERT GIAN HÀNG:", error);
            throw error;
        } finally {
            client.release(); 
        }
    },

    getAll: async () => {
        const query = 'SELECT * FROM gianhang ORDER BY gh_ma DESC';
        const result = await pool.query(query);
        return result.rows;
    },

    updatePassword: async (gh_ma, newPasswordHash) => {
        const query = `
            UPDATE gianhang 
            SET gh_hashpass = $1 
            WHERE gh_ma = $2 
            RETURNING gh_ma
        `;
        const result = await pool.query(query, [newPasswordHash, gh_ma]);
        return result.rows[0];
    },

    getById: async (id) => {
        try {
            const query = `
                SELECT 
                    gh.gh_ma, gh.gh_ten, gh.gh_mota, gh.gh_hinhanh, 
                    gh.gh_email, gh.gh_danhgia, gh.gh_theodoi, gh.dc_ma,
                    gh.gh_hashpass,
                    dc.dc_mota, 
                    dc.xa_ma,
                    xap.tinh_ma
                FROM gianhang gh
                LEFT JOIN diachi dc ON gh.dc_ma = dc.dc_ma
                LEFT JOIN XAphuong xap ON dc.xa_ma = xap.xa_ma
                WHERE gh.gh_ma = $1
            `;
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error("LỖI SQL GET PROFILE:", error.message);
            throw error;
        }
    },

    update: async (id, data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const shopRes = await client.query('SELECT dc_ma, gh_hinhanh FROM gianhang WHERE gh_ma = $1', [id]);
            const oldData = shopRes.rows[0];
            const dc_ma = oldData?.dc_ma;
            const oldImage = oldData?.gh_hinhanh;

            const finalImage = data.gh_hinhanh || oldImage;

            if (dc_ma && data.xa_ma) {
                const updateAddressQuery = `
                    UPDATE diachi 
                    SET dc_mota = $1, xa_ma = $2 
                    WHERE dc_ma = $3
                `;
                await client.query(updateAddressQuery, [data.dc_mota, data.xa_ma, dc_ma]);
            }

            const updateShopQuery = `
                UPDATE gianhang 
                SET gh_ten = $1, gh_mota = $2, gh_hinhanh = $3 
                WHERE gh_ma = $4 
                RETURNING *
            `;
            const result = await client.query(updateShopQuery, [data.gh_ten, data.gh_mota || null, finalImage, id]);

            await client.query('COMMIT');

            // LOGIC XÓA ẢNH CŨ
            if (data.gh_hinhanh && oldImage && data.gh_hinhanh !== oldImage) {
                try {
                    const oldFileName = path.basename(oldImage);
                    const oldFilePath = path.join(UPLOAD_DIR, oldFileName);

                    console.log(`[UPDATE DEBUG] Ảnh cũ: ${oldImage}`);
                    console.log(`[UPDATE DEBUG] Đường dẫn file cần xóa: ${oldFilePath}`);

                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                        console.log(`[UPDATE] Đã xóa ảnh cũ thành công: ${oldFileName}`);
                    } else {
                        console.log(`[UPDATE LỖI] KHÔNG TÌM THẤY FILE ẢNH CŨ TẠI ĐƯỜNG DẪN TRÊN!`);
                    }
                } catch (fsError) {
                    console.error("Lỗi khi xóa ảnh cũ:", fsError);
                }
            } else {
                console.log(`[UPDATE DEBUG] Không xóa ảnh vì không có ảnh mới hoặc đường dẫn ảnh không đổi.`);
            }

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("LỖI UPDATE GIAN HÀNG:", error);
            throw error;
        } finally {
            client.release();
        }
    },

    delete: async (id) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const shopRes = await client.query('SELECT dc_ma, gh_hinhanh FROM gianhang WHERE gh_ma = $1', [id]);
            const oldData = shopRes.rows[0];
            const dc_ma = oldData?.dc_ma;
            const oldImage = oldData?.gh_hinhanh;

            const result = await client.query('DELETE FROM gianhang WHERE gh_ma = $1 RETURNING *', [id]);

            if (dc_ma) {
                await client.query('DELETE FROM diachi WHERE dc_ma = $1', [dc_ma]);
            }

            await client.query('COMMIT');

            if (oldImage) {
                try {
                    const fileName = path.basename(oldImage);
                    const filePath = path.join(UPLOAD_DIR, fileName);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`[DELETE] Đã xóa file ảnh: ${fileName}`);
                    }
                } catch (fsError) {
                    console.error("Lỗi khi xóa file ảnh:", fsError);
                }
            }

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = GianHangModel;