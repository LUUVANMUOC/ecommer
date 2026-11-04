// backend/src/models/gianhang/chiTietSanPhamModel.js
const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/products');

/**
 * Tính ctsp_gianban = gb_gia × (1 + psck_phantram)
 * - ctsp_gianban = giá KHÁCH TRẢ (đã cộng phí sàn)
 * - Giá gốc shop nhận (gb_gia) đã lưu trong bảng giabangoc
 *
 * psck_phantram chấp nhận cả 2 dạng:
 *   - Nếu > 1 → coi là % (VD: 5 = 5%) → chia 100
 *   - Nếu <= 1 → coi là thập phân (VD: 0.05 = 5%) → dùng trực tiếp
 */
const tinhGianBan = (gb_gia, psck_phantram) => {
    const giaGoc = Number(gb_gia) || 0;
    const psckRaw = Number(psck_phantram) || 0;
    const psckDecimal = psckRaw > 1 ? psckRaw / 100 : psckRaw;
    const ctsp_gianban = giaGoc * (1 + psckDecimal);
    return Math.round(ctsp_gianban * 100) / 100;
};

const ChiTietSanPhamModel = {
    getBySanPham: async (sp_ma) => {
        const query = `
            SELECT 
                ctsp.*, 
                nh.nh_ten,
                gb.gb_gia,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'hasp_ma', ha.hasp_ma, 
                        'hasp_link', ha.hasp_link, 
                        'hasp_mota', ha.hasp_mota, 
                        'hasp_laanhchinh', ha.hasp_laanhchinh,
                        'hasp_thutu', ha.hasp_thutu
                    ) ORDER BY ha.hasp_laanhchinh DESC, ha.hasp_thutu ASC) 
                    FROM hinhanhsanpham ha WHERE ha.ctsp_ma = ctsp.ctsp_ma),
                    '[]'::json
                ) AS images,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'ttsp_ma', gt.ttsp_ma,
                        'ttsp_ten', ttsp.thsp_ten,
                        'thsp_icon', ttsp.thsp_icon,
                        'gttt_giatridinhtinh', gt.gttt_giatridinhtinh,
                        'gttt_giatridinhluong', gt.gttt_giatridinhluong
                    ) ORDER BY ttsp.thsp_ten)
                    FROM giatrithuoctinh gt
                    LEFT JOIN thuoctinhsanpham ttsp ON gt.ttsp_ma = ttsp.thsp_ma
                    WHERE gt.ctsp_ma = ctsp.ctsp_ma),
                    '[]'::json
                ) AS thuoctinh,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'ttctsp_ma', t.ttctsp_ma,
                        'ttctsp_ten', t.ttctsp_ten,
                        'ctttsp_thoidiem', ct.ctttsp_thoidiem,
                        'ctttsp_phanhoi', ct.ctttsp_phanhoi,
                        'ctttsp_yeucau', ct.ctttsp_yeucau
                    ) ORDER BY ct.ctttsp_thoidiem DESC)
                    FROM chitiettrangthaisanpham ct
                    LEFT JOIN trangthaichitietsanpham t ON ct.ttctsp_ma = t.ttctsp_ma
                    WHERE ct.ctsp_ma = ctsp.ctsp_ma),
                    '[]'::json
                ) AS trangthai_lichsu
            FROM chitietsanpham ctsp
            LEFT JOIN nganhhang nh ON ctsp.nh_ma = nh.nh_ma
            LEFT JOIN LATERAL (
                SELECT gb_gia FROM giabangoc WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY gb_thoidiem DESC LIMIT 1
            ) gb ON true
            WHERE ctsp.sp_ma = $1
            ORDER BY ctsp.ctsp_ngaytao ASC, ctsp.ctsp_ma ASC
        `;
        const result = await pool.query(query, [sp_ma]);
        return result.rows;
    },

    getById: async (id) => {
        const query = 'SELECT * FROM chitietsanpham WHERE ctsp_ma = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    getLatestMa: async () => {
        const query = `
            SELECT ctsp_ma FROM chitietsanpham 
            WHERE ctsp_ma ~ '^CTSP[0-9]+$'
            ORDER BY CAST(SUBSTRING(ctsp_ma FROM 5) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ? result.rows[0].ctsp_ma : null;
    },

    createFullDetail: async (data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Tính ctsp_gianban trước khi INSERT
            const ctsp_gianban = tinhGianBan(data.gb_gia, data.psck_phantram);

            const insertCtspQuery = `
                INSERT INTO chitietsanpham (
                    ctsp_ma, ctsp_ten, ctsp_mota, ctsp_soluongton, 
                    ctsp_chieudai, ctsp_chieurong, ctsp_khoiluong, sp_ma, nh_ma,
                    ctsp_gianban
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
            `;
            await client.query(insertCtspQuery, [
                data.ctsp_ma, data.ctsp_ten, data.ctsp_mota, data.ctsp_soluongton,
                data.ctsp_chieudai, data.ctsp_chieurong, data.ctsp_khoiluong, data.sp_ma, data.nh_ma,
                ctsp_gianban
            ]);

            // Lưu giá gốc vào bảng giabangoc (source of truth)
            if (data.gb_gia !== undefined && data.gb_gia !== null) {
                const gb_ma = 'GB' + Math.random().toString(36).substring(2, 10);
                await client.query(
                    `INSERT INTO giabangoc (gb_ma, ctsp_ma, gb_thoidiem, gb_gia) VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
                    [gb_ma, data.ctsp_ma, data.gb_gia]
                );
            }

            // Ảnh
            if (data.images && data.images.length > 0) {
                for (let i = 0; i < data.images.length; i++) {
                    const img = data.images[i];
                    const hasp_ma = 'HA' + Math.random().toString(36).substring(2, 10);
                    await client.query(`
                        INSERT INTO hinhanhsanpham (hasp_ma, hasp_link, hasp_laanhchinh, hasp_thutu, ctsp_ma, hasp_mota)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [hasp_ma, img.hasp_link, img.hasp_laanhchinh, img.hasp_thutu, data.ctsp_ma, img.hasp_mota]);
                }
            }

            // Thuộc tính
            if (Array.isArray(data.thuoctinh) && data.thuoctinh.length > 0) {
                const seen = new Set();
                for (const tt of data.thuoctinh) {
                    if (!tt.ttsp_ma || seen.has(tt.ttsp_ma)) continue;
                    seen.add(tt.ttsp_ma);
                    await client.query(`
                        INSERT INTO giatrithuoctinh (ttsp_ma, ctsp_ma, gttt_giatridinhtinh, gttt_giatridinhluong)
                        VALUES ($1, $2, $3, $4)
                    `, [
                        tt.ttsp_ma,
                        data.ctsp_ma,
                        tt.gttt_giatridinhtinh || null,
                        tt.gttt_giatridinhluong ?? null
                    ]);
                }
            }

            await client.query('COMMIT');
            return { ctsp_ma: data.ctsp_ma };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    updateFullDetail: async (id, data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Cập nhật thông tin
            const updateCtspQuery = `
                UPDATE chitietsanpham 
                SET ctsp_ten = $1, ctsp_mota = $2, ctsp_soluongton = $3, 
                    ctsp_chieudai = $4, ctsp_chieurong = $5, ctsp_khoiluong = $6, nh_ma = $7
                WHERE ctsp_ma = $8 RETURNING *
            `;
            await client.query(updateCtspQuery, [
                data.ctsp_ten, data.ctsp_mota, data.ctsp_soluongton,
                data.ctsp_chieudai, data.ctsp_chieurong, data.ctsp_khoiluong, data.nh_ma, id
            ]);

            // 2. Giá gốc: chỉ thêm dòng lịch sử mới nếu giá thay đổi
            if (data.gb_gia !== undefined && data.gb_gia !== null) {
                const currentPriceRes = await client.query(
                    `SELECT gb_gia FROM giabangoc WHERE ctsp_ma = $1 ORDER BY gb_thoidiem DESC LIMIT 1`,
                    [id]
                );
                const currentPrice = currentPriceRes.rows[0] ? Number(currentPriceRes.rows[0].gb_gia) : null;
                const newPrice = Number(data.gb_gia);

                if (currentPrice !== newPrice) {
                    const gb_ma = 'GB' + Math.random().toString(36).substring(2, 10);
                    await client.query(
                        `INSERT INTO giabangoc (gb_ma, ctsp_ma, gb_thoidiem, gb_gia) VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
                        [gb_ma, id, newPrice]
                    );
                }
            }

            // 3. LUÔN tính lại ctsp_gianban từ giá mới nhất + phí sàn hiện tại
            const latestPriceRes = await client.query(
                `SELECT gb_gia FROM giabangoc WHERE ctsp_ma = $1 ORDER BY gb_thoidiem DESC LIMIT 1`,
                [id]
            );
            const latestGbGia = latestPriceRes.rows[0]?.gb_gia ?? data.gb_gia ?? 0;
            const ctsp_gianban = tinhGianBan(latestGbGia, data.psck_phantram);
            await client.query(
                `UPDATE chitietsanpham SET ctsp_gianban = $1 WHERE ctsp_ma = $2`,
                [ctsp_gianban, id]
            );

            // 4. Ảnh (xóa cũ, giữ mới, thêm mới)
            const currentImgsRes = await client.query('SELECT hasp_ma, hasp_link FROM hinhanhsanpham WHERE ctsp_ma = $1', [id]);
            const currentImgs = currentImgsRes.rows;
            const keepImgs = data.images.filter(img => img.hasp_ma);
            const keepImgIds = keepImgs.map(img => img.hasp_ma);

            for (const oldImg of currentImgs) {
                if (!keepImgIds.includes(oldImg.hasp_ma)) {
                    await client.query('DELETE FROM hinhanhsanpham WHERE hasp_ma = $1', [oldImg.hasp_ma]);
                    try {
                        const fileName = path.basename(oldImg.hasp_link);
                        const filePath = path.join(UPLOAD_DIR, fileName);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    } catch (err) {
                        console.error("Lỗi xóa file cũ:", err);
                    }
                }
            }

            for (const img of keepImgs) {
                await client.query(`
                    UPDATE hinhanhsanpham 
                    SET hasp_mota = $1, hasp_laanhchinh = $2, hasp_thutu = $3
                    WHERE hasp_ma = $4
                `, [img.hasp_mota, img.hasp_laanhchinh, img.hasp_thutu, img.hasp_ma]);
            }

            const newImgs = data.images.filter(img => !img.hasp_ma);
            for (let i = 0; i < newImgs.length; i++) {
                const img = newImgs[i];
                const hasp_ma = 'HA' + Math.random().toString(36).substring(2, 10);
                await client.query(`
                    INSERT INTO hinhanhsanpham (hasp_ma, hasp_link, hasp_laanhchinh, hasp_thutu, ctsp_ma, hasp_mota)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [hasp_ma, img.hasp_link, img.hasp_laanhchinh, img.hasp_thutu, id, img.hasp_mota]);
            }

            // 5. Thuộc tính: xóa hết + insert lại
            await client.query('DELETE FROM giatrithuoctinh WHERE ctsp_ma = $1', [id]);
            if (Array.isArray(data.thuoctinh) && data.thuoctinh.length > 0) {
                const seen = new Set();
                for (const tt of data.thuoctinh) {
                    if (!tt.ttsp_ma || seen.has(tt.ttsp_ma)) continue;
                    seen.add(tt.ttsp_ma);
                    await client.query(`
                        INSERT INTO giatrithuoctinh (ttsp_ma, ctsp_ma, gttt_giatridinhtinh, gttt_giatridinhluong)
                        VALUES ($1, $2, $3, $4)
                    `, [
                        tt.ttsp_ma,
                        id,
                        tt.gttt_giatridinhtinh || null,
                        tt.gttt_giatridinhluong ?? null
                    ]);
                }
            }

            await client.query('COMMIT');
            return { ctsp_ma: id };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    delete: async (id) => {
        const client = await pool.connect();
        const filePathsToDelete = [];

        try {
            await client.query('BEGIN');

            const imgsRes = await client.query(
                'SELECT hasp_ma, hasp_link FROM hinhanhsanpham WHERE ctsp_ma = $1',
                [id]
            );
            imgsRes.rows.forEach(img => {
                if (img.hasp_link) filePathsToDelete.push(img.hasp_link);
            });

            await client.query('DELETE FROM hinhanhsanpham WHERE ctsp_ma = $1', [id]);
            await client.query('DELETE FROM giabangoc WHERE ctsp_ma = $1', [id]);
            await client.query('DELETE FROM giatrithuoctinh WHERE ctsp_ma = $1', [id]);
            await client.query(
                'DELETE FROM chitiettrangthaisanpham WHERE ctsp_ma = $1',
                [id]
            );

            const result = await client.query(
                'DELETE FROM chitietsanpham WHERE ctsp_ma = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                throw new Error('Không tìm thấy chi tiết sản phẩm để xóa!');
            }

            await client.query('COMMIT');

            for (const link of filePathsToDelete) {
                try {
                    const fileName = path.basename(link);
                    const filePath = path.join(UPLOAD_DIR, fileName);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (err) {
                    console.error('Lỗi xóa file ảnh:', err);
                }
            }

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    increaseView: async (ctsp_ma) => {
        const query = `
            UPDATE chitietsanpham 
            SET ctsp_luotxem = ctsp_luotxem + 1 
            WHERE ctsp_ma = $1 
            RETURNING ctsp_luotxem
        `;
        const result = await pool.query(query, [ctsp_ma]);
        return result.rows[0];
    },

    // ✅ Thêm hàm tăng/giảm lượt thích
    toggleLike: async (ctsp_ma, isLiked) => {
        // Nếu isLiked = true (đang thích -> bấm hủy) => Trừ 1
        // Nếu isLiked = false (chưa thích -> bấm thích) => Cộng 1
        const action = isLiked ? '- 1' : '+ 1';
        const query = `
            UPDATE chitietsanpham 
            SET ctsp_luotthich = GREATEST(ctsp_luotthich ${action}, 0) 
            WHERE ctsp_ma = $1 
            RETURNING ctsp_luotthich
        `;
        const result = await pool.query(query, [ctsp_ma]);
        return result.rows[0];
    }
};

module.exports = ChiTietSanPhamModel;