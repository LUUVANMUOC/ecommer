const pool = require('../../config/db');

const VanChuyenShopModel = {
    // Lấy tất cả ĐVVC hiện có trên hệ thống
    getAllDVVC: async () => {
        const query = `
            SELECT dvvc_ma AS "DVVC_Ma", dvvc_ten AS "DVVC_Ten", 
                   dvvc_hinhanh AS "DVVC_HinhAnh", dvvc_mota AS "DVVC_MoTa"
            FROM donvivanchuyen
            ORDER BY dvvc_ten ASC
        `;
        const res = await pool.query(query);
        return res.rows;
    },

    // Lấy danh sách mã ĐVVC mà Shop đã chọn
    getSelectedDVVC: async (gh_ma) => {
        const query = `SELECT dvvc_ma FROM gianhang_donvivanchuyen WHERE gh_ma = $1`;
        const res = await pool.query(query, [gh_ma]);
        return res.rows.map(row => row.dvvc_ma);
    },

    // Cập nhật danh sách ĐVVC cho Shop (Xóa cũ - Thêm mới)
    updateSelectedDVVC: async (gh_ma, dvvc_list) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Xóa toàn bộ ĐVVC cũ của shop này
            await client.query('DELETE FROM gianhang_donvivanchuyen WHERE gh_ma = $1', [gh_ma]);
            
            // 2. Thêm danh sách ĐVVC mới
            if (dvvc_list && dvvc_list.length > 0) {
                for (const dvvc_ma of dvvc_list) {
                    await client.query(
                        'INSERT INTO gianhang_donvivanchuyen (gh_ma, dvvc_ma) VALUES ($1, $2)',
                        [gh_ma, dvvc_ma]
                    );
                }
            }
            
            await client.query('COMMIT');
            return { message: 'Cập nhật đơn vị vận chuyển thành công!' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = VanChuyenShopModel;