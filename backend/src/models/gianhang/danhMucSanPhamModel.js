const pool = require('../../config/db');

const DanhMucSanPhamModel = {
    // Lấy tất cả danh mục của 1 gian hàng
    getByGianHang: async (gh_ma) => {
        const query = 'SELECT * FROM danhmucsanpham WHERE gh_ma = $1 ORDER BY dmsp_ma DESC';
        const result = await pool.query(query, [gh_ma]);
        return result.rows;
    },

    // Lấy 1 danh mục (dùng để check trước khi sửa/xóa)
    getById: async (id) => {
        const query = 'SELECT * FROM danhmucsanpham WHERE dmsp_ma = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Sinh mã tự động (VD: DMSP01, DMSP02...)
    getLatestMa: async () => {
        const query = `
            SELECT dmsp_ma FROM danhmucsanpham 
            WHERE dmsp_ma ~ '^DMSP[0-9]+$'
            ORDER BY CAST(SUBSTRING(dmsp_ma FROM 5) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ? result.rows[0].dmsp_ma : null;
    },

    create: async (data) => {
        const query = `
            INSERT INTO danhmucsanpham (dmsp_ma, dmsp_ten, dmsp_mota, dmsp_hinhanh, gh_ma) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `;
        const values = [data.dmsp_ma, data.dmsp_ten, data.dmsp_mota, data.dmsp_hinhanh, data.gh_ma];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE danhmucsanpham 
            SET dmsp_ten = $1, dmsp_mota = $2, dmsp_hinhanh = $3 
            WHERE dmsp_ma = $4 
            RETURNING *
        `;
        const values = [data.dmsp_ten, data.dmsp_mota, data.dmsp_hinhanh, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM danhmucsanpham WHERE dmsp_ma = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = DanhMucSanPhamModel;