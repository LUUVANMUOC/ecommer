// backend/src/models/khachhang/khachHangModel.js
const pool = require('../../config/db');

const KhachHangModel = {
  findByEmail: async (email) => {
    const query = 'SELECT * FROM khachhang WHERE kh_email = $1';
    const res = await pool.query(query, [email]);
    return res.rows[0];
  },

  getLatestMa: async () => {
    const query = `
      SELECT kh_ma FROM khachhang 
      WHERE kh_ma ~ '^KH[0-9]+$'
      ORDER BY CAST(SUBSTRING(kh_ma FROM 3) AS INTEGER) DESC 
      LIMIT 1
    `;
    const res = await pool.query(query);
    return res.rows[0] ? res.rows[0].kh_ma : null;
  },

  create: async (data) => {
    const query = `
      INSERT INTO khachhang (
        kh_ma, kh_ten, kh_sdt, kh_ngaysinh, kh_gioitinh, kh_email, kh_hashpass, ct_ma, kh_avatar
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING kh_ma, kh_ten, kh_email, kh_sdt, kh_gioitinh, kh_avatar, kh_ngaytao
    `;
    const values = [
      data.kh_ma, data.kh_ten, data.kh_sdt, data.kh_ngaysinh, 
      data.kh_gioitinh, data.kh_email, data.kh_hashpass, 'CT04', data.kh_avatar
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  // ✅ Lấy thông tin cá nhân & Ngân hàng
  getProfile: async (kh_ma) => {
    const query = `
      SELECT 
        kh.kh_ma, kh.kh_ten, kh.kh_sdt, kh.kh_ngaysinh, kh.kh_gioitinh, 
        kh.kh_avatar, kh.kh_email, kh.kh_ngaytao,
        tt.nganhang_ma, tt.ttnt_kh_sotaikhoan, tt.ttnt_kh_tennguoinhan,
        nh.nhg_ten, nh.nhg_logo
      FROM khachhang kh
      LEFT JOIN thongtinnhantien_kh tt ON kh.kh_ma = tt.kh_ma
      LEFT JOIN nganhang nh ON tt.nganhang_ma = nh.nhg_ma
      WHERE kh.kh_ma = $1
    `;
    const res = await pool.query(query, [kh_ma]);
    return res.rows[0];
  },

  // ✅ Cập nhật thông tin cơ bản
  updateProfile: async (kh_ma, data) => {
    const query = `
      UPDATE khachhang 
      SET kh_ten = $1, kh_sdt = $2, kh_ngaysinh = $3, kh_gioitinh = $4, kh_avatar = $5
      WHERE kh_ma = $6
      RETURNING *
    `;
    const values = [data.kh_ten, data.kh_sdt, data.kh_ngaysinh, data.kh_gioitinh, data.kh_avatar, kh_ma];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  // ✅ Lưu tài khoản nhận tiền (Upsert)
  saveBankAccount: async (kh_ma, data) => {
    const query = `
      INSERT INTO thongtinnhantien_kh (kh_ma, nganhang_ma, ttnt_kh_sotaikhoan, ttnt_kh_tennguoinhan)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (kh_ma, nganhang_ma) 
      DO UPDATE SET 
        ttnt_kh_sotaikhoan = EXCLUDED.ttnt_kh_sotaikhoan,
        ttnt_kh_tennguoinhan = EXCLUDED.ttnt_kh_tennguoinhan
      RETURNING *
    `;
    const values = [kh_ma, data.nganhang_ma, data.ttnt_kh_sotaikhoan, data.ttnt_kh_tennguoinhan];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  // ✅ Xóa tài khoản nhận tiền
  deleteBankAccount: async (kh_ma) => {
    const query = `DELETE FROM thongtinnhantien_kh WHERE kh_ma = $1 RETURNING *`;
    const res = await pool.query(query, [kh_ma]);
    return res.rows[0];
  },
    updatePassword: async (kh_ma, newPasswordHash) => {
    const query = `
      UPDATE khachhang 
      SET kh_hashpass = $1 
      WHERE kh_ma = $2 
      RETURNING kh_ma
    `;
    const res = await pool.query(query, [newPasswordHash, kh_ma]);
    return res.rows[0];
  },
};

module.exports = KhachHangModel;