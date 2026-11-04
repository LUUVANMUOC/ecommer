const pool = require('../../config/db');

const ShipperModel = {
  getAllByDVVC: async (dvvc_ma) => {
    const query = `
      SELECT 
        s.shipper_ma AS "Shipper_Ma",
        s.shipper_ten AS "Shipper_Ten",
        s.shipper_sdt AS "Shipper_SDT",
        s.shipper_hinhanh AS "Shipper_HinhAnh",
        s.shipper_gioitinh AS "Shipper_GioiTinh",
        s.shipper_ngaysinh AS "Shipper_NgaySinh",
        s.shipper_diemdanhgiatrungbinh AS "Shipper_DiemDanhGia",
        s.lsp_ma AS "Lsp_Ma",
        ls.lshipper_ten AS "Lshipper_Ten",
        
        k.kho_ma AS "Kho_Ma",
        k.kho_ten AS "Kho_Ten",
        
        x.xa_ma AS "Xa_Ma",
        x.xa_ten AS "Xa_Ten",
        t.tinh_ma AS "Tinh_Ma",
        t.tinh_ten AS "Tinh_Ten"
        
      FROM shipper s
      JOIN kho k ON s.kho_ma = k.kho_ma
      JOIN diachi dc ON k.dc_ma = dc.dc_ma
      JOIN xaphuong x ON dc.xa_ma = x.xa_ma
      JOIN tinhtp t ON x.tinh_ma = t.tinh_ma
      LEFT JOIN loai_shipper ls ON s.lsp_ma = ls.lshipper_ma
      WHERE k.dvvc_ma = $1
      ORDER BY s.shipper_ma DESC
    `;
    const res = await pool.query(query, [dvvc_ma]);
    return res.rows;
  },

  create: async (data) => {
    const query = `
      INSERT INTO shipper (
        shipper_ma, shipper_ten, shipper_sdt, shipper_hinhanh, 
        shipper_gioitinh, shipper_ngaysinh, shipper_diemdanhgiatrungbinh, 
        kho_ma, shipper_hashpass, lsp_ma
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.Shipper_Ma,
      data.Shipper_Ten,
      data.Shipper_SDT,
      data.Shipper_HinhAnh,
      data.Shipper_GioiTinh,
      data.Shipper_NgaySinh,
      data.Kho_Ma,
      data.Shipper_HashPass,
      data.Lsp_Ma
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  update: async (shipper_ma, data) => {
    // ⚠️ KHÔNG update lsp_ma — theo yêu cầu (không cho đổi loại sau khi tạo)
    const query = `
      UPDATE shipper 
      SET shipper_ten = $1, shipper_sdt = $2, shipper_gioitinh = $3, 
          shipper_ngaysinh = $4, kho_ma = $5,
          shipper_hinhanh = COALESCE($6, shipper_hinhanh)
      WHERE shipper_ma = $7
      RETURNING *
    `;
    const values = [
      data.Shipper_Ten, data.Shipper_SDT, data.Shipper_GioiTinh, data.Shipper_NgaySinh,
      data.Kho_Ma, data.Shipper_HinhAnh, shipper_ma
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  delete: async (shipper_ma) => {
    const query = `DELETE FROM shipper WHERE shipper_ma = $1 RETURNING *`;
    const res = await pool.query(query, [shipper_ma]);
    return res.rows[0];
  },

  getLatestMa: async () => {
    const query = `
      SELECT shipper_ma FROM shipper 
      WHERE shipper_ma LIKE 'SHP%' 
      ORDER BY CAST(SUBSTRING(shipper_ma FROM 4) AS INTEGER) DESC 
      LIMIT 1
    `;
    const res = await pool.query(query);
    return res.rows[0] ? res.rows[0].shipper_ma : null;
  }
};

module.exports = ShipperModel;