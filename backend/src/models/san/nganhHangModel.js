const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Thư mục chứa icon ngành hàng
const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/categories');

// Xóa file ảnh vật lý (chỉ lấy basename để tránh path traversal)
const removeImageFile = (imagePath) => {
    if (!imagePath) return;
    try {
        const fileName = path.basename(imagePath);
        const filePath = path.join(UPLOAD_DIR, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[NGANH HANG] Đã xóa icon: ${fileName}`);
        }
    } catch (error) {
        console.error("Lỗi khi xóa file icon ngành hàng:", error.message);
    }
};

const NganhHangModel = {
    // Lấy tất cả danh mục (dạng phẳng)
    getAll: async () => {
        const query = 'SELECT * FROM nganhhang ORDER BY nh_ma ASC';
        const result = await pool.query(query);
        return result.rows;
    },

    // Lấy 1 ngành hàng theo mã
    getById: async (id) => {
        const query = 'SELECT * FROM nganhhang WHERE nh_ma = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Lấy mã lớn nhất để sinh mã tự động
    getLatestMa: async () => {
        const query = `
            SELECT nh_ma FROM nganhhang 
            WHERE nh_ma ~* '^NH_[0-9]+$'
            ORDER BY CAST(SUBSTRING(nh_ma FROM 4) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ? result.rows[0].nh_ma : null;
    },

    // Thêm ngành hàng
    create: async (data) => {
        try {
            let newMa = 'NH_001';
            const latestMa = await NganhHangModel.getLatestMa();

            if (latestMa) {
                const stringMa = latestMa.toString().toUpperCase();
                const currentNumber = parseInt(stringMa.replace('NH_', ''), 10);
                if (!isNaN(currentNumber)) {
                    newMa = 'NH_' + (currentNumber + 1).toString().padStart(3, '0');
                }
            }

            const { nh_ten, nh_mota, nh_cha, nh_hinhanh } = data;
            const finalParent = (nh_cha === "" || nh_cha === undefined) ? null : nh_cha;

            const query = `
                INSERT INTO nganhhang (nh_ma, nh_ten, nh_mota, nh_cha, nh_hinhanh) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *
            `;
            const result = await pool.query(query, [
                newMa,
                nh_ten,
                nh_mota || null,
                finalParent,
                nh_hinhanh || null
            ]);
            return result.rows[0];
        } catch (error) {
            console.error("LỖI THÊM NGÀNH HÀNG:", error.message);
            throw error;
        }
    },

    // Cập nhật ngành hàng
    update: async (id, data) => {
        try {
            const { nh_ten, nh_mota, nh_hinhanh } = data;

            const existing = await NganhHangModel.getById(id);
            if (!existing) throw new Error('Không tìm thấy ngành hàng để cập nhật!');

            // COALESCE: nếu không gửi ảnh mới thì giữ nguyên ảnh cũ
            const query = `
                UPDATE nganhhang 
                SET nh_ten = $1,
                    nh_mota = $2,
                    nh_hinhanh = COALESCE($3, nh_hinhanh)
                WHERE nh_ma = $4 
                RETURNING *
            `;
            const result = await pool.query(query, [
                nh_ten,
                nh_mota || null,
                nh_hinhanh || null,
                id
            ]);

            // Nếu có ảnh mới thay thế ảnh cũ thì xóa file cũ
            if (nh_hinhanh && existing.nh_hinhanh && nh_hinhanh !== existing.nh_hinhanh) {
                removeImageFile(existing.nh_hinhanh);
            }

            return result.rows[0];
        } catch (error) {
            console.error("LỖI CẬP NHẬT NGÀNH HÀNG:", error.message);
            throw error;
        }
    },

    /**
     * Xóa ngành hàng.
     * ✅ Khi xóa ngành cha => xóa toàn bộ ngành con (đệ quy nhiều cấp).
     * ✅ Xóa toàn bộ phí chiết khấu (phisanchieckhau) của cả cây.
     * ✅ Xóa file icon của cả cây.
     * Thứ tự xóa: từ lá lên gốc để không vi phạm FK tự tham chiếu (nh_cha).
     */
    delete: async (id) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Lấy toàn bộ cây con (gồm chính nó), kèm độ sâu
            const treeRes = await client.query(`
                WITH RECURSIVE subtree AS (
                    SELECT nh_ma, nh_hinhanh, 0 AS depth
                    FROM nganhhang
                    WHERE nh_ma = $1
                    UNION ALL
                    SELECT c.nh_ma, c.nh_hinhanh, s.depth + 1
                    FROM nganhhang c
                    JOIN subtree s ON c.nh_cha = s.nh_ma
                )
                SELECT nh_ma, nh_hinhanh, depth
                FROM subtree
                ORDER BY depth DESC
            `, [id]);

            if (treeRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return null; // Không tìm thấy ngành hàng
            }

            const ids = treeRes.rows.map((r) => r.nh_ma);
            const images = treeRes.rows.map((r) => r.nh_hinhanh).filter(Boolean);

            // 2. Xóa phí chiết khấu của toàn bộ cây
            await client.query(
                'DELETE FROM phisanchieckhau WHERE nh_ma = ANY($1::text[])',
                [ids]
            );

            // 3. Xóa ngành hàng từ lá lên gốc
            for (const row of treeRes.rows) {
                await client.query('DELETE FROM nganhhang WHERE nh_ma = $1', [row.nh_ma]);
            }

            await client.query('COMMIT');

            // 4. Chỉ xóa file sau khi DB đã commit thành công
            images.forEach(removeImageFile);

            return { nh_ma: id, deleted_count: ids.length, deleted_ids: ids };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("LỖI XÓA NGÀNH HÀNG:", error.message);
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * ✅ Kiểm tra một ngành hàng có phải "ngành con cuối cùng" (leaf) không.
     */
    isLeaf: async (nh_ma) => {
        const query = `
            SELECT 
                EXISTS(SELECT 1 FROM nganhhang WHERE nh_ma = $1) AS "exists",
                NOT EXISTS(SELECT 1 FROM nganhhang WHERE nh_cha = $1) AS "is_leaf"
        `;
        const result = await pool.query(query, [nh_ma]);
        const row = result.rows[0] || {};
        return row.exists === true && row.is_leaf === true;
    }
};

module.exports = NganhHangModel;