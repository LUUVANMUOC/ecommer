const pool = require('../../config/db');

const PublicGianHangModel = {
    // Lấy thông tin cơ bản của Shop
    getShopInfo: async (gh_ma) => {
        const query = `
            SELECT gh_ma, gh_ten, gh_hinhanh, gh_theodoi, gh_danhgia, gh_mota
            FROM gianhang 
            WHERE gh_ma = $1
        `;
        const result = await pool.query(query, [gh_ma]);
        return result.rows[0] || null;
    },

    // Lấy danh sách danh mục của Shop
    getShopCategories: async (gh_ma) => {
        const query = `
            SELECT dmsp_ma, dmsp_ten, dmsp_hinhanh
            FROM danhmucsanpham 
            WHERE gh_ma = $1
            ORDER BY dmsp_ten ASC
        `;
        const result = await pool.query(query, [gh_ma]);
        return result.rows;
    },
        // 🟢 Lấy danh sách Voucher đang hoạt động của Shop (Public)
        // 🟢 Lấy danh sách Voucher đang hoạt động của Shop (Public)
    getShopVouchers: async (gh_ma) => {
        const query = `
            SELECT 
                MGG_Shop_Ma AS "MGG_Shop_Ma",
                MGG_Shop_Ten AS "MGG_Shop_Ten",
                MGG_Shop_HinhAnh AS "MGG_Shop_HinhAnh",
                MGG_Shop_PhanTramGiam AS "MGG_Shop_PhanTramGiam",
                MGG_Shop_SoLuongConLai AS "MGG_Shop_SoLuongConLai",
                MGG_Shop_SoLuongBanDau AS "MGG_Shop_SoLuongBanDau",
                MGG_Shop_GiaTriDonToiThieu AS "MGG_Shop_GiaTriDonToiThieu",
                MGG_Shop_TrangThai AS "MGG_Shop_TrangThai",
                MGG_Shop_ThoiDiemBatDau AS "MGG_Shop_ThoiDiemBatDau",
                MGG_Shop_ThoiDiemKetThuc AS "MGG_Shop_ThoiDiemKetThuc",
                0 AS "MGG_Shop_SoTienToiDaMoiLan" -- 🟢 Thay thế cột không tồn tại bằng 0
            FROM magiamgia_shop 
            WHERE gh_ma = $1 
              AND MGG_Shop_TrangThai = true 
              AND MGG_Shop_SoLuongConLai > 0
              AND (MGG_Shop_ThoiDiemKetThuc IS NULL OR MGG_Shop_ThoiDiemKetThuc >= NOW())
            ORDER BY MGG_Shop_PhanTramGiam DESC
        `;
        const result = await pool.query(query, [gh_ma]);
        return result.rows;
    }
};

module.exports = PublicGianHangModel;