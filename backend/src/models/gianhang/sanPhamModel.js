const pool = require('../../config/db');

const SanPhamModel = {
    // 1. Lấy tất cả sản phẩm của 1 Shop (Kèm tên Thương hiệu và Danh mục)
    getByGianHang: async (gh_ma) => {
        const query = `
            SELECT 
                sp.sp_ma, sp.sp_ten, sp.sp_mota, 
                sp.sp_luotxem, sp.sp_luotthich, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
                sp.gh_ma, sp.th_ma, sp.dmsp_ma,
                th.th_ten, 
                dm.dmsp_ten
            FROM sanpham sp
            LEFT JOIN thuonghieu th ON sp.th_ma = th.th_ma
            LEFT JOIN danhmucsanpham dm ON sp.dmsp_ma = dm.dmsp_ma
            WHERE sp.gh_ma = $1
            ORDER BY sp.sp_ma DESC
        `;
        const result = await pool.query(query, [gh_ma]);
        return result.rows;
    },

    // 2. Lấy 1 sản phẩm
    getById: async (id) => {
        const query = `SELECT * FROM sanpham WHERE sp_ma = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // 3. Sinh mã tự động (SP01, SP02...)
    getLatestMa: async () => {
        const query = `
            SELECT sp_ma FROM sanpham 
            WHERE sp_ma ~ '^SP[0-9]+$'
            ORDER BY CAST(SUBSTRING(sp_ma FROM 3) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ? result.rows[0].sp_ma : null;
    },

    // 4. Thêm mới sản phẩm
    create: async (data) => {
        const query = `
            INSERT INTO sanpham (
                sp_ma, sp_ten, sp_mota, gh_ma, th_ma, dmsp_ma
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
        const values = [
            data.sp_ma, 
            data.sp_ten, 
            data.sp_mota, 
            data.gh_ma, 
            data.th_ma || null, 
            data.dmsp_ma || null
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 5. Cập nhật sản phẩm (Chỉ cập nhật các trường cho phép)
    update: async (id, data) => {
        const query = `
            UPDATE sanpham 
            SET sp_ten = $1, sp_mota = $2, th_ma = $3, dmsp_ma = $4 
            WHERE sp_ma = $5 
            RETURNING *
        `;
        const values = [
            data.sp_ten, 
            data.sp_mota, 
            data.th_ma || null, 
            data.dmsp_ma || null, 
            id
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 6. Xóa sản phẩm
    delete: async (id) => {
        const query = 'DELETE FROM sanpham WHERE sp_ma = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = SanPhamModel;