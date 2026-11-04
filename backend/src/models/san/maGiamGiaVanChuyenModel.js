// backend/src/models/san/maGiamGiaVanChuyenModel.js
const pool = require('../../config/db'); 

const MaGiamGiaVanChuyenModel = {
  // 1. Lấy tất cả mã giảm giá vận chuyển
  getAll: async () => {
    const query = `
      SELECT 
        m.mgg_vc_ma AS "MGG_VC_Ma",
        m.mgg_vc_ten AS "MGG_VC_Ten",
        m.mgg_vc_mota AS "MGG_VC_Mota",
        m.mgg_vc_hinhanh AS "MGG_VC_HinhAnh",
        
        -- TỰ ĐỘNG TÍNH TOÁN TRẠNG THÁI THEO THỜI GIAN THỰC
        CASE 
            WHEN NOW() < m.mgg_vc_thoidiembatdau THEN FALSE
            WHEN m.mgg_vc_thoidiemketthuc IS NOT NULL AND NOW() > m.mgg_vc_thoidiemketthuc THEN FALSE
            WHEN m.mgg_vc_soluongconlai <= 0 THEN FALSE
            ELSE TRUE
        END AS "MGG_VC_TrangThai",

        m.mgg_vc_thoidiembatdau AS "MGG_VC_ThoiDiemBatDau",
        m.mgg_vc_thoidiemketthuc AS "MGG_VC_ThoiDiemKetThuc",
        m.mgg_vc_giatridontoithieu AS "MGG_VC_GiaTriDonToiThieu",
        m.mgg_vc_soluongconlai AS "MGG_VC_SoLuongConLai",
        m.mgg_vc_phantramgiam AS "MGG_VC_PhanTramGiam",
        m.mgg_vc_soluongbandau AS "MGG_VC_SoLuongBanDau",
        m.mgg_vc_sotiengiamtoidamoilan AS "MGG_VC_SoTienToiDaMoiLan", 
        m.stmdt_ma AS "STMDT_Ma",
        s.stmdt_ten AS "Ten_San"
      FROM magiamgia_vanchuyen m
      LEFT JOIN san_thuong_mai_dien_tu s ON m.stmdt_ma = s.stmdt_ma
      ORDER BY m.mgg_vc_thoidiembatdau DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // 2. Lấy chi tiết 1 mã giảm giá
  getById: async (id) => {
    const query = `
      SELECT 
        mgg_vc_ma AS "MGG_VC_Ma",
        mgg_vc_ten AS "MGG_VC_Ten",
        mgg_vc_mota AS "MGG_VC_Mota",
        mgg_vc_hinhanh AS "MGG_VC_HinhAnh",
        
        CASE 
            WHEN NOW() < mgg_vc_thoidiembatdau THEN FALSE
            WHEN mgg_vc_thoidiemketthuc IS NOT NULL AND NOW() > mgg_vc_thoidiemketthuc THEN FALSE
            WHEN mgg_vc_soluongconlai <= 0 THEN FALSE
            ELSE TRUE
        END AS "MGG_VC_TrangThai",

        mgg_vc_thoidiembatdau AS "MGG_VC_ThoiDiemBatDau",
        mgg_vc_thoidiemketthuc AS "MGG_VC_ThoiDiemKetThuc",
        mgg_vc_giatridontoithieu AS "MGG_VC_GiaTriDonToiThieu",
        mgg_vc_soluongconlai AS "MGG_VC_SoLuongConLai",
        mgg_vc_phantramgiam AS "MGG_VC_PhanTramGiam",
        mgg_vc_soluongbandau AS "MGG_VC_SoLuongBanDau",
        mgg_vc_sotiengiamtoidamoilan AS "MGG_VC_SoTienToiDaMoiLan",
        stmdt_ma AS "STMDT_Ma"
      FROM magiamgia_vanchuyen 
      WHERE mgg_vc_ma = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // 3. Tạo mới
  create: async (data) => {
    const {
      MGG_VC_Ma, MGG_VC_Ten, MGG_VC_Mota, MGG_VC_HinhAnh,
      MGG_VC_TrangThai, MGG_VC_ThoiDiemBatDau, MGG_VC_ThoiDiemKetThuc,
      MGG_VC_GiaTriDonToiThieu, MGG_VC_SoLuongConLai, MGG_VC_PhanTramGiam,
      MGG_VC_SoLuongBanDau, MGG_VC_SoTienToiDaMoiLan, STMDT_Ma 
    } = data;

    // ✅ TỰ ĐỘNG TÍNH TOÁN TRẠNG THÁI KHI TẠO MỚI
    const now = new Date();
    const start = MGG_VC_ThoiDiemBatDau ? new Date(MGG_VC_ThoiDiemBatDau) : null;
    const end = MGG_VC_ThoiDiemKetThuc ? new Date(MGG_VC_ThoiDiemKetThuc) : null;
    const qty = Number(MGG_VC_SoLuongConLai);

    let calculatedStatus = false;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      calculatedStatus = true;
    }

    const query = `
      INSERT INTO magiamgia_vanchuyen (
        mgg_vc_ma, mgg_vc_ten, mgg_vc_mota, mgg_vc_hinhanh, 
        mgg_vc_trangthai, mgg_vc_thoidiembatdau, mgg_vc_thoidiemketthuc, 
        mgg_vc_giatridontoithieu, mgg_vc_soluongconlai, mgg_vc_phantramgiam, 
        mgg_vc_soluongbandau, mgg_vc_sotiengiamtoidamoilan, stmdt_ma
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      MGG_VC_Ma, MGG_VC_Ten, MGG_VC_Mota, MGG_VC_HinhAnh,
      calculatedStatus, // ✅ Dùng trạng thái đã tính toán
      MGG_VC_ThoiDiemBatDau || null, MGG_VC_ThoiDiemKetThuc || null,
      MGG_VC_GiaTriDonToiThieu || 0, MGG_VC_SoLuongConLai || 0, MGG_VC_PhanTramGiam || 0,
      MGG_VC_SoLuongBanDau || 0, MGG_VC_SoTienToiDaMoiLan || 0, STMDT_Ma
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 4. Cập nhật
  update: async (id, data) => {
    const {
      MGG_VC_Ten, MGG_VC_Mota, MGG_VC_HinhAnh,
      MGG_VC_TrangThai, MGG_VC_ThoiDiemBatDau, MGG_VC_ThoiDiemKetThuc,
      MGG_VC_GiaTriDonToiThieu, MGG_VC_SoLuongConLai, MGG_VC_PhanTramGiam,
      MGG_VC_SoLuongBanDau, MGG_VC_SoTienToiDaMoiLan, STMDT_Ma 
    } = data;

    // ✅ TỰ ĐỘNG TÍNH TOÁN LẠI TRẠNG THÁI KHI CẬP NHẬT
    const now = new Date();
    const start = MGG_VC_ThoiDiemBatDau ? new Date(MGG_VC_ThoiDiemBatDau) : null;
    const end = MGG_VC_ThoiDiemKetThuc ? new Date(MGG_VC_ThoiDiemKetThuc) : null;
    const qty = Number(MGG_VC_SoLuongConLai);

    let finalStatus = MGG_VC_TrangThai;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      finalStatus = true;
    } else {
      finalStatus = false;
    }

    const query = `
      UPDATE magiamgia_vanchuyen 
      SET 
        mgg_vc_ten = $1, mgg_vc_mota = $2, mgg_vc_hinhanh = $3, 
        mgg_vc_trangthai = $4, mgg_vc_thoidiembatdau = $5, mgg_vc_thoidiemketthuc = $6, 
        mgg_vc_giatridontoithieu = $7, mgg_vc_soluongconlai = $8, mgg_vc_phantramgiam = $9, 
        mgg_vc_soluongbandau = $10, mgg_vc_sotiengiamtoidamoilan = $11, stmdt_ma = $12
      WHERE mgg_vc_ma = $13
      RETURNING *;
    `;
    const values = [
      MGG_VC_Ten, MGG_VC_Mota, MGG_VC_HinhAnh,
      finalStatus, // ✅ Dùng trạng thái đã tính toán
      MGG_VC_ThoiDiemBatDau || null, MGG_VC_ThoiDiemKetThuc || null,
      MGG_VC_GiaTriDonToiThieu, MGG_VC_SoLuongConLai, MGG_VC_PhanTramGiam,
      MGG_VC_SoLuongBanDau, MGG_VC_SoTienToiDaMoiLan, STMDT_Ma, id 
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 5. Xóa
  delete: async (id) => {
    const query = `DELETE FROM magiamgia_vanchuyen WHERE mgg_vc_ma = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = MaGiamGiaVanChuyenModel;