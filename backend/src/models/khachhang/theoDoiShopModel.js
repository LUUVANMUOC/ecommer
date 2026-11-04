// backend/src/models/khachhang/theoDoiShopModel.js
const pool = require('../../config/db');

const TheoDoiShopModel = {
  checkFollow: async (kh_ma, gh_ma) => {
    const res = await pool.query(
      'SELECT * FROM khachhang_theodoi_shop WHERE kh_ma = $1 AND gh_ma = $2',
      [kh_ma, gh_ma]
    );
    return res.rows.length > 0;
  },

  follow: async (kh_ma, gh_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        'INSERT INTO khachhang_theodoi_shop (kh_ma, gh_ma) VALUES ($1, $2) RETURNING *',
        [kh_ma, gh_ma]
      );
      await client.query(
        'UPDATE gianhang SET gh_theodoi = gh_theodoi + 1 WHERE gh_ma = $1',
        [gh_ma]
      );
      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  unfollow: async (kh_ma, gh_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        'DELETE FROM khachhang_theodoi_shop WHERE kh_ma = $1 AND gh_ma = $2 RETURNING *',
        [kh_ma, gh_ma]
      );
      await client.query(
        'UPDATE gianhang SET gh_theodoi = GREATEST(gh_theodoi - 1, 0) WHERE gh_ma = $1',
        [gh_ma]
      );
      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getFollowedShops: async (kh_ma) => {
    const query = `
      SELECT g.gh_ma, g.gh_ten, g.gh_hinhanh, g.gh_theodoi, t.td_thoidiem
      FROM khachhang_theodoi_shop t
      JOIN gianhang g ON t.gh_ma = g.gh_ma
      WHERE t.kh_ma = $1
      ORDER BY t.td_thoidiem DESC
    `;
    const res = await pool.query(query, [kh_ma]);
    return res.rows;
  }
};

module.exports = TheoDoiShopModel;