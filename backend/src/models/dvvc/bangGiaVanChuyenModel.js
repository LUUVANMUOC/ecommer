// backend/src/models/dvvc/bangGiaVanChuyenModel.js
const pool = require('../../config/db');

const BangGiaVanChuyenModel = {
  // ... (Các hàm getKhoiLuong, getKhuVuc, getTuyen, getBangGia, updateGia giữ nguyên)

  getKhoiLuong: async () => {
    const res = await pool.query('SELECT * FROM khoiluongkienhang ORDER BY klkh_trongluongmin ASC');
    return res.rows;
  },

  getKhuVuc: async () => {
    const res = await pool.query('SELECT * FROM khuvucvanchuyen ORDER BY kvvc_ma ASC');
    return res.rows;
  },

  getTuyen: async () => {
    const res = await pool.query('SELECT * FROM tuyenvanchuyen ORDER BY tvc_ma ASC');
    return res.rows;
  },

  getBangGia: async (dvvc_ma) => {
    const query = `
      SELECT DISTINCT ON (kvvc_ma, tvc_ma, klkh_ma) 
        kvvc_ma, tvc_ma, klkh_ma, cpvc_gia, cpvc_thoidiem
      FROM cuocphivanchuyen
      WHERE dvvc_ma = $1
      ORDER BY kvvc_ma, tvc_ma, klkh_ma, cpvc_thoidiem DESC
    `;
    const res = await pool.query(query, [dvvc_ma]);
    return res.rows;
  },

  updateGia: async (data) => {
    const query = `
      INSERT INTO cuocphivanchuyen (kvvc_ma, tvc_ma, klkh_ma, dvvc_ma, cpvc_thoidiem, cpvc_gia)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      RETURNING *
    `;
    const values = [data.kvvc_ma, data.tvc_ma, data.klkh_ma, data.dvvc_ma, data.cpvc_gia];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  getLatestMa: async () => {
    const query = `
      SELECT klkh_ma FROM khoiluongkienhang 
      WHERE klkh_ma ~ '^KL[0-9]+$'
      ORDER BY CAST(SUBSTRING(klkh_ma FROM 3) AS INTEGER) DESC 
      LIMIT 1
    `;
    const res = await pool.query(query);
    return res.rows[0] ? res.rows[0].klkh_ma : null;
  },

  createKhoiLuong: async (data) => {
    const res = await pool.query(
      `INSERT INTO khoiluongkienhang (klkh_ma, klkh_ten, klkh_mota, klkh_trongluongmin, klkh_trongluongmax) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.klkh_ma, data.klkh_ten, data.klkh_mota, data.klkh_trongluongmin, data.klkh_trongluongmax]
    );
    return res.rows[0];
  },
  
  updateKhoiLuong: async (id, data) => {
    const res = await pool.query(
      `UPDATE khoiluongkienhang 
       SET klkh_ten = $1, klkh_mota = $2, klkh_trongluongmin = $3, klkh_trongluongmax = $4 
       WHERE klkh_ma = $5 RETURNING *`,
      [data.klkh_ten, data.klkh_mota, data.klkh_trongluongmin, data.klkh_trongluongmax, id]
    );
    return res.rows[0];
  },
  
  // ✅ CẬP NHẬT HÀM XÓA: Xóa cước phí trước, sau đó mới xóa khối lượng
  deleteKhoiLuong: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Xóa tất cả cước phí tham chiếu tới khối lượng này
      await client.query('DELETE FROM cuocphivanchuyen WHERE klkh_ma = $1', [id]);

      // 2. Xóa khối lượng
      const res = await client.query('DELETE FROM khoiluongkienhang WHERE klkh_ma = $1 RETURNING *', [id]);
      
      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = BangGiaVanChuyenModel;