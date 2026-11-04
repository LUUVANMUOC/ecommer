// backend/src/models/khachhang/thongTinNhanHangModel.js
const pool = require('../../config/db');

const ThongTinNhanHangModel = {
  // Lấy danh sách địa chỉ nhận hàng (kèm thông tin tỉnh/xã)
  getAllByCustomer: async (kh_ma) => {
    const query = `
      SELECT 
        ttnh.*, 
        dc.dc_mota, 
        dc.xa_ma, 
        xa.xa_ten, 
        tinh.tinh_ma, 
        tinh.tinh_ten
      FROM thongtinnhanhang ttnh
      JOIN diachi dc ON ttnh.dc_ma = dc.dc_ma
      JOIN xaphuong xa ON dc.xa_ma = xa.xa_ma
      JOIN tinhtp tinh ON xa.tinh_ma = tinh.tinh_ma
      WHERE ttnh.kh_ma = $1
      ORDER BY ttnh.ttnh_lamacdinh DESC, ttnh.ttnh_ma DESC
    `;
    const res = await pool.query(query, [kh_ma]);
    return res.rows;
  },

  getLatestTTNHMa: async () => {
    const query = `
      SELECT ttnh_ma FROM thongtinnhanhang 
      WHERE ttnh_ma ~ '^TTNH[0-9]+$'
      ORDER BY CAST(SUBSTRING(ttnh_ma FROM 5) AS INTEGER) DESC LIMIT 1
    `;
    const res = await pool.query(query);
    return res.rows[0] ? res.rows[0].ttnh_ma : null;
  },

  getLatestDCMa: async () => {
    const query = `
      SELECT dc_ma FROM diachi 
      WHERE dc_ma ~ '^DC[0-9]+$'
      ORDER BY CAST(SUBSTRING(dc_ma FROM 3) AS INTEGER) DESC LIMIT 1
    `;
    const res = await pool.query(query);
    return res.rows[0] ? res.rows[0].dc_ma : null;
  },

  create: async (data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Thêm vào bảng diachi
      const insertDcQuery = `
        INSERT INTO diachi (dc_ma, dc_mota, xa_ma) VALUES ($1, $2, $3)
      `;
      await client.query(insertDcQuery, [data.dc_ma, data.dc_mota, data.xa_ma]);

      // 2. Nếu là mặc định, bỏ mặc định của các địa chỉ khác
      if (data.ttnh_lamacdinh) {
        await client.query('UPDATE thongtinnhanhang SET ttnh_lamacdinh = false WHERE kh_ma = $1', [data.kh_ma]);
      }

      // 3. Thêm vào bảng thongtinnhanhang
      const insertTtnhQuery = `
        INSERT INTO thongtinnhanhang (
          ttnh_ma, dc_ma, kh_ma, ttnh_ten, ttnh_sdt, ttnh_ghichu, ttnh_diachisnapshot, ttnh_lamacdinh
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `;
      const values = [
        data.ttnh_ma, data.dc_ma, data.kh_ma, data.ttnh_ten, data.ttnh_sdt, 
        data.ttnh_ghichu, data.ttnh_diachisnapshot, data.ttnh_lamacdinh
      ];
      const res = await client.query(insertTtnhQuery, values);

      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
  },

  update: async (ttnh_ma, data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Cập nhật bảng diachi
      const updateDcQuery = `UPDATE diachi SET dc_mota = $1, xa_ma = $2 WHERE dc_ma = $3`;
      await client.query(updateDcQuery, [data.dc_mota, data.xa_ma, data.dc_ma]);

      // 2. Nếu là mặc định, bỏ mặc định của các địa chỉ khác
      if (data.ttnh_lamacdinh) {
        await client.query('UPDATE thongtinnhanhang SET ttnh_lamacdinh = false WHERE kh_ma = $1', [data.kh_ma]);
      }

      // 3. Cập nhật bảng thongtinnhanhang
      const updateTtnhQuery = `
        UPDATE thongtinnhanhang 
        SET ttnh_ten = $1, ttnh_sdt = $2, ttnh_ghichu = $3, ttnh_diachisnapshot = $4, ttnh_lamacdinh = $5
        WHERE ttnh_ma = $6 RETURNING *
      `;
      const values = [
        data.ttnh_ten, data.ttnh_sdt, data.ttnh_ghichu, data.ttnh_diachisnapshot, data.ttnh_lamacdinh, ttnh_ma
      ];
      const res = await client.query(updateTtnhQuery, values);

      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
  },

  delete: async (ttnh_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lấy dc_ma để xóa địa chỉ
      const getDcQuery = 'SELECT dc_ma FROM thongtinnhanhang WHERE ttnh_ma = $1';
      const dcRes = await client.query(getDcQuery, [ttnh_ma]);
      const dc_ma = dcRes.rows[0]?.dc_ma;

      // Xóa thông tin nhận hàng
      const res = await client.query('DELETE FROM thongtinnhanhang WHERE ttnh_ma = $1 RETURNING *', [ttnh_ma]);

      // Xóa địa chỉ (vì mỗi địa chỉ nhận hàng tương ứng 1-1 với bảng diachi)
      if (dc_ma) {
        await client.query('DELETE FROM diachi WHERE dc_ma = $1', [dc_ma]);
      }

      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
  },

  setDefault: async (kh_ma, ttnh_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE thongtinnhanhang SET ttnh_lamacdinh = false WHERE kh_ma = $1', [kh_ma]);
      const res = await client.query('UPDATE thongtinnhanhang SET ttnh_lamacdinh = true WHERE ttnh_ma = $1 RETURNING *', [ttnh_ma]);
      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
  }
};

module.exports = ThongTinNhanHangModel;