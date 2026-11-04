// backend/src/models/gianhang/maGiamGiaShopModel.js
const pool = require('../../config/db');

const MaGiamGiaShopModel = {
  // 1. Lấy tất cả mã giảm giá của một Shop
  getAllByShop: async (gh_ma) => {
    const query = `
      SELECT 
        mgg_shop_ma AS "MGG_Shop_Ma",
        mgg_shop_ten AS "MGG_Shop_Ten",
        mgg_shop_mota AS "MGG_Shop_Mota",
        mgg_shop_hinhanh AS "MGG_Shop_HinhAnh",
        
        -- TỰ ĐỘNG TÍNH TOÁN TRẠNG THÁI THEO THỜI GIAN THỰC
        CASE 
            WHEN NOW() < mgg_shop_thoidiembatdau THEN FALSE
            WHEN mgg_shop_thoidiemketthuc IS NOT NULL AND NOW() > mgg_shop_thoidiemketthuc THEN FALSE
            WHEN mgg_shop_soluongconlai <= 0 THEN FALSE
            ELSE TRUE
        END AS "MGG_Shop_TrangThai",

        mgg_shop_thoidiembatdau AS "MGG_Shop_ThoiDiemBatDau",
        mgg_shop_thoidiemketthuc AS "MGG_Shop_ThoiDiemKetThuc",
        mgg_shop_giatridontoithieu AS "MGG_Shop_GiaTriDonToiThieu",
        mgg_shop_soluongconlai AS "MGG_Shop_SoLuongConLai",
        mgg_shop_phantramgiam AS "MGG_Shop_PhanTramGiam",
        mgg_shop_soluongbandau AS "MGG_Shop_SoLuongBanDau",
        mgg_shop_sotiengiamtoidamoilan AS "MGG_Shop_SoTienToiDaMoiLan", 
        gh_ma AS "GH_Ma"
      FROM magiamgia_shop 
      WHERE gh_ma = $1
      ORDER BY mgg_shop_thoidiembatdau DESC
    `;
    const result = await pool.query(query, [gh_ma]);
    return result.rows;
  },

  // 2. Lấy chi tiết 1 mã giảm giá
  getById: async (id) => {
    const query = `
      SELECT 
        mgg_shop_ma AS "MGG_Shop_Ma",
        mgg_shop_ten AS "MGG_Shop_Ten",
        mgg_shop_mota AS "MGG_Shop_Mota",
        mgg_shop_hinhanh AS "MGG_Shop_HinhAnh",
        
        CASE 
            WHEN NOW() < mgg_shop_thoidiembatdau THEN FALSE
            WHEN mgg_shop_thoidiemketthuc IS NOT NULL AND NOW() > mgg_shop_thoidiemketthuc THEN FALSE
            WHEN mgg_shop_soluongconlai <= 0 THEN FALSE
            ELSE TRUE
        END AS "MGG_Shop_TrangThai",

        mgg_shop_thoidiembatdau AS "MGG_Shop_ThoiDiemBatDau",
        mgg_shop_thoidiemketthuc AS "MGG_Shop_ThoiDiemKetThuc",
        mgg_shop_giatridontoithieu AS "MGG_Shop_GiaTriDonToiThieu",
        mgg_shop_soluongconlai AS "MGG_Shop_SoLuongConLai",
        mgg_shop_phantramgiam AS "MGG_Shop_PhanTramGiam",
        mgg_shop_soluongbandau AS "MGG_Shop_SoLuongBanDau",
        mgg_shop_sotiengiamtoidamoilan AS "MGG_Shop_SoTienToiDaMoiLan",
        gh_ma AS "GH_Ma"
      FROM magiamgia_shop 
      WHERE mgg_shop_ma = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // 3. Tạo mới
  create: async (data) => {
    const {
      MGG_Shop_Ma, MGG_Shop_Ten, MGG_Shop_Mota, MGG_Shop_HinhAnh,
      MGG_Shop_TrangThai, MGG_Shop_ThoiDiemBatDau, MGG_Shop_ThoiDiemKetThuc,
      MGG_Shop_GiaTriDonToiThieu, MGG_Shop_SoLuongConLai, MGG_Shop_PhanTramGiam,
      MGG_Shop_SoLuongBanDau, MGG_Shop_SoTienToiDaMoiLan, GH_Ma 
    } = data;

    // ✅ TỰ ĐỘNG TÍNH TOÁN TRẠNG THÁI KHI TẠO MỚI
    const now = new Date();
    const start = MGG_Shop_ThoiDiemBatDau ? new Date(MGG_Shop_ThoiDiemBatDau) : null;
    const end = MGG_Shop_ThoiDiemKetThuc ? new Date(MGG_Shop_ThoiDiemKetThuc) : null;
    const qty = Number(MGG_Shop_SoLuongConLai);

    let calculatedStatus = false;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      calculatedStatus = true;
    }

    const query = `
      INSERT INTO magiamgia_shop (
        mgg_shop_ma, mgg_shop_ten, mgg_shop_mota, mgg_shop_hinhanh, 
        mgg_shop_trangthai, mgg_shop_thoidiembatdau, mgg_shop_thoidiemketthuc, 
        mgg_shop_giatridontoithieu, mgg_shop_soluongconlai, mgg_shop_phantramgiam, 
        gh_ma, mgg_shop_soluongbandau, mgg_shop_sotiengiamtoidamoilan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      MGG_Shop_Ma, MGG_Shop_Ten, MGG_Shop_Mota, MGG_Shop_HinhAnh,
      calculatedStatus, // ✅ Dùng trạng thái đã tính toán
      MGG_Shop_ThoiDiemBatDau || null, MGG_Shop_ThoiDiemKetThuc || null,
      MGG_Shop_GiaTriDonToiThieu || 0, MGG_Shop_SoLuongConLai || 0, MGG_Shop_PhanTramGiam || 0,
      GH_Ma, MGG_Shop_SoLuongBanDau || 0, MGG_Shop_SoTienToiDaMoiLan || 0
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 4. Cập nhật
  update: async (id, data) => {
    const {
      MGG_Shop_Ten, MGG_Shop_Mota, MGG_Shop_HinhAnh,
      MGG_Shop_TrangThai, MGG_Shop_ThoiDiemBatDau, MGG_Shop_ThoiDiemKetThuc,
      MGG_Shop_GiaTriDonToiThieu, MGG_Shop_SoLuongConLai, MGG_Shop_PhanTramGiam,
      MGG_Shop_SoLuongBanDau, MGG_Shop_SoTienToiDaMoiLan 
    } = data;

    // ✅ TỰ ĐỘNG TÍNH TOÁN LẠI TRẠNG THÁI KHI CẬP NHẬT
    const now = new Date();
    const start = MGG_Shop_ThoiDiemBatDau ? new Date(MGG_Shop_ThoiDiemBatDau) : null;
    const end = MGG_Shop_ThoiDiemKetThuc ? new Date(MGG_Shop_ThoiDiemKetThuc) : null;
    const qty = Number(MGG_Shop_SoLuongConLai);

    let finalStatus = MGG_Shop_TrangThai;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      finalStatus = true;
    } else {
      finalStatus = false;
    }

    const query = `
      UPDATE magiamgia_shop 
      SET 
        mgg_shop_ten = $1, mgg_shop_mota = $2, mgg_shop_hinhanh = $3, 
        mgg_shop_trangthai = $4, mgg_shop_thoidiembatdau = $5, mgg_shop_thoidiemketthuc = $6, 
        mgg_shop_giatridontoithieu = $7, mgg_shop_soluongconlai = $8, mgg_shop_phantramgiam = $9, 
        mgg_shop_soluongbandau = $10, mgg_shop_sotiengiamtoidamoilan = $11
      WHERE mgg_shop_ma = $12
      RETURNING *;
    `;
    const values = [
      MGG_Shop_Ten, MGG_Shop_Mota, MGG_Shop_HinhAnh,
      finalStatus, // ✅ Dùng trạng thái đã tính toán
      MGG_Shop_ThoiDiemBatDau || null, MGG_Shop_ThoiDiemKetThuc || null,
      MGG_Shop_GiaTriDonToiThieu, MGG_Shop_SoLuongConLai, MGG_Shop_PhanTramGiam,
      MGG_Shop_SoLuongBanDau, MGG_Shop_SoTienToiDaMoiLan, id 
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 5. Xóa
  delete: async (id) => {
    const query = `DELETE FROM magiamgia_shop WHERE mgg_shop_ma = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = MaGiamGiaShopModel;