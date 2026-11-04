const pool = require('../../config/db');

const NganhHangModel = {
    // Lấy tất cả danh mục (dạng phẳng)
    getAll: async () => {
        const query = 'SELECT * FROM nganhhang ORDER BY nh_ma ASC';
        const result = await pool.query(query);
        return result.rows;
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

            const { nh_ten, nh_mota, nh_cha } = data;
            const finalParent = (nh_cha === "" || nh_cha === undefined) ? null : nh_cha;

            const query = `
                INSERT INTO nganhhang (nh_ma, nh_ten, nh_mota, nh_cha) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `;
            const result = await pool.query(query, [newMa, nh_ten, nh_mota || null, finalParent]);
            return result.rows[0];
        } catch (error) {
            console.error("LỖI THÊM NGÀNH HÀNG:", error.message);
            throw error; 
        }
    },

    // Cập nhật ngành hàng
    update: async (id, data) => {
        const { nh_ten, nh_mota } = data;
        const query = `
            UPDATE nganhhang 
            SET nh_ten = $1, nh_mota = $2 
            WHERE nh_ma = $3 
            RETURNING *
        `;
        const result = await pool.query(query, [nh_ten, nh_mota || null, id]);
        return result.rows[0];
    },

    // Xóa ngành hàng
    delete: async (id) => {
        await pool.query('DELETE FROM phisanchieckhau WHERE nh_ma = $1', [id]);
        const result = await pool.query('DELETE FROM nganhhang WHERE nh_ma = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    /**
     * ✅ MỚI: Kiểm tra một ngành hàng có phải "ngành con cuối cùng" (leaf) không.
     * Trả về true chỉ khi: ngành hàng TỒN TẠI và KHÔNG có ngành hàng nào trỏ nh_cha về nó.
     * Đây là điều kiện bắt buộc khi gán ngành hàng cho chi tiết sản phẩm,
     * vì chỉ ngành lá mới được ghi phí chiết khấu trong phisanchieckhau.
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