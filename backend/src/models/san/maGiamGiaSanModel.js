// backend/src/models/san/maGiamGiaSanModel.js
const pool = require('../../config/db'); 

const MaGiamGiaSanModel = {
  // 1. Lấy tất cả mã giảm giá
  getAll: async () => {
    const query = `
      SELECT 
        m.MGG_San_Ma AS "MGG_San_Ma",
        m.MGG_San_Ten AS "MGG_San_Ten",
        m.MGG_San_Mota AS "MGG_San_Mota",
        m.MGG_San_HinhAnh AS "MGG_San_HinhAnh",
        
        -- TỰ ĐỘNG TÍNH TOÁN TRẠNG THÁI THEO THỜI GIAN THỰC
        CASE 
            WHEN NOW() < m.MGG_San_ThoiDiemBatDau THEN FALSE
            WHEN m.MGG_San_ThoiDiemKetThuc IS NOT NULL AND NOW() > m.MGG_San_ThoiDiemKetThuc THEN FALSE
            WHEN m.MGG_San_SoLuongConLai <= 0 THEN FALSE
            ELSE TRUE
        END AS "MGG_San_TrangThai",

        m.MGG_San_ThoiDiemBatDau AS "MGG_San_ThoiDiemBatDau",
        m.MGG_San_ThoiDiemKetThuc AS "MGG_San_ThoiDiemKetThuc",
        m.MGG_San_GiaTriDonToiThieu AS "MGG_San_GiaTriDonToiThieu",
        m.MGG_San_SoLuongConLai AS "MGG_San_SoLuongConLai",
        m.MGG_San_PhanTramGiam AS "MGG_San_PhanTramGiam",
        m.MGG_San_SoLuongBanDau AS "MGG_San_SoLuongBanDau",
        m.mgg_san_sotiengiamtoidamoilan AS "MGG_San_SoTienToiDaMoiLan", 
        m.STMDT_Ma AS "STMDT_Ma",
        s.STMDT_Ten AS "Ten_San"
      FROM MaGiamGiaSan m
      LEFT JOIN san_thuong_mai_dien_tu s ON m.STMDT_Ma = s.STMDT_Ma
      ORDER BY m.MGG_San_ThoiDiemBatDau DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // 2. Lấy chi tiết 1 mã giảm giá
  getById: async (id) => {
    const query = `
      SELECT 
        MGG_San_Ma AS "MGG_San_Ma",
        MGG_San_Ten AS "MGG_San_Ten",
        MGG_San_Mota AS "MGG_San_Mota",
        MGG_San_HinhAnh AS "MGG_San_HinhAnh",
        
        -- TỰ ĐỘNG TÍNH TOÁN TRẠNG THÁI THEO THỜI GIAN THỰC
        CASE 
            WHEN NOW() < MGG_San_ThoiDiemBatDau THEN FALSE
            WHEN MGG_San_ThoiDiemKetThuc IS NOT NULL AND NOW() > MGG_San_ThoiDiemKetThuc THEN FALSE
            WHEN MGG_San_SoLuongConLai <= 0 THEN FALSE
            ELSE TRUE
        END AS "MGG_San_TrangThai",

        MGG_San_ThoiDiemBatDau AS "MGG_San_ThoiDiemBatDau",
        MGG_San_ThoiDiemKetThuc AS "MGG_San_ThoiDiemKetThuc",
        MGG_San_GiaTriDonToiThieu AS "MGG_San_GiaTriDonToiThieu",
        MGG_San_SoLuongConLai AS "MGG_San_SoLuongConLai",
        MGG_San_PhanTramGiam AS "MGG_San_PhanTramGiam",
        MGG_San_SoLuongBanDau AS "MGG_San_SoLuongBanDau",
        mgg_san_sotiengiamtoidamoilan AS "MGG_San_SoTienToiDaMoiLan",
        STMDT_Ma AS "STMDT_Ma"
      FROM MaGiamGiaSan 
      WHERE MGG_San_Ma = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // 3. Tạo mới mã giảm giá (Giữ nguyên)
  create: async (data) => {
    const {
      MGG_San_Ma, MGG_San_Ten, MGG_San_Mota, MGG_San_HinhAnh,
      MGG_San_TrangThai, MGG_San_ThoiDiemBatDau, MGG_San_ThoiDiemKetThuc,
      MGG_San_GiaTriDonToiThieu, MGG_San_SoLuongConLai, MGG_San_PhanTramGiam,
      MGG_San_SoLuongBanDau, MGG_San_SoTienToiDaMoiLan, STMDT_Ma 
    } = data;

    // Tự động tính lại trạng thái
    const now = new Date();
    const start = MGG_San_ThoiDiemBatDau ? new Date(MGG_San_ThoiDiemBatDau) : null;
    const end = MGG_San_ThoiDiemKetThuc ? new Date(MGG_San_ThoiDiemKetThuc) : null;
    const qty = Number(MGG_San_SoLuongConLai);

    let calculatedStatus = false;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      calculatedStatus = true;
    }

    const query = `
      INSERT INTO MaGiamGiaSan (
        MGG_San_Ma, MGG_San_Ten, MGG_San_Mota, MGG_San_HinhAnh, 
        MGG_San_TrangThai, MGG_San_ThoiDiemBatDau, MGG_San_ThoiDiemKetThuc, 
        MGG_San_GiaTriDonToiThieu, MGG_San_SoLuongConLai, MGG_San_PhanTramGiam, 
        MGG_San_SoLuongBanDau, mgg_san_sotiengiamtoidamoilan, STMDT_Ma
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      MGG_San_Ma, MGG_San_Ten, MGG_San_Mota, MGG_San_HinhAnh,
      calculatedStatus, // Lưu trạng thái đã tính
      MGG_San_ThoiDiemBatDau || null, MGG_San_ThoiDiemKetThuc || null,
      MGG_San_GiaTriDonToiThieu || 0, MGG_San_SoLuongConLai || 0, MGG_San_PhanTramGiam || 0,
      MGG_San_SoLuongBanDau || 0, MGG_San_SoTienToiDaMoiLan || 0, STMDT_Ma
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 4. Cập nhật mã giảm giá (Giữ nguyên)
    // 4. Cập nhật mã giảm giá
  update: async (id, data) => {
    const {
      MGG_San_Ten, MGG_San_Mota, MGG_San_HinhAnh,
      MGG_San_TrangThai, MGG_San_ThoiDiemBatDau, MGG_San_ThoiDiemKetThuc,
      MGG_San_GiaTriDonToiThieu, MGG_San_SoLuongConLai, MGG_San_PhanTramGiam,
      MGG_San_SoLuongBanDau, MGG_San_SoTienToiDaMoiLan, STMDT_Ma 
    } = data;

    // ✅ TỰ ĐỘNG TÍNH TOÁN LẠI TRẠNG THÁI
    // Nếu thời gian và số lượng hợp lệ, tự động bật thành true
    const now = new Date();
    const start = MGG_San_ThoiDiemBatDau ? new Date(MGG_San_ThoiDiemBatDau) : null;
    const end = MGG_San_ThoiDiemKetThuc ? new Date(MGG_San_ThoiDiemKetThuc) : null;
    const qty = Number(MGG_San_SoLuongConLai);

    let finalStatus = MGG_San_TrangThai;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      finalStatus = true; // Tự động bật nếu thỏa mãn
    } else {
      finalStatus = false;
    }

    const query = `
      UPDATE MaGiamGiaSan 
      SET 
        MGG_San_Ten = $1, MGG_San_Mota = $2, MGG_San_HinhAnh = $3, 
        MGG_San_TrangThai = $4, MGG_San_ThoiDiemBatDau = $5, MGG_San_ThoiDiemKetThuc = $6, 
        MGG_San_GiaTriDonToiThieu = $7, MGG_San_SoLuongConLai = $8, MGG_San_PhanTramGiam = $9, 
        MGG_San_SoLuongBanDau = $10, mgg_san_sotiengiamtoidamoilan = $11, STMDT_Ma = $12
      WHERE MGG_San_Ma = $13
      RETURNING *;
    `;
    const values = [
      MGG_San_Ten, MGG_San_Mota, MGG_San_HinhAnh,
      finalStatus, // ✅ Truyền trạng thái đã tính toán vào
      MGG_San_ThoiDiemBatDau || null, MGG_San_ThoiDiemKetThuc || null,
      MGG_San_GiaTriDonToiThieu, MGG_San_SoLuongConLai, MGG_San_PhanTramGiam,
      MGG_San_SoLuongBanDau, MGG_San_SoTienToiDaMoiLan, STMDT_Ma, id 
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 5. Xóa mã giảm giá (Giữ nguyên)
  delete: async (id) => {
    const query = `DELETE FROM MaGiamGiaSan WHERE MGG_San_Ma = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = MaGiamGiaSanModel;