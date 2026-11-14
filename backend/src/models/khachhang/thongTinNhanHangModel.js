// backend/src/models/khachhang/thongTinNhanHangModel.js
const pool = require('../../config/db');

// Sinh mã kế tiếp dạng <PREFIX><số>, dùng được trong transaction
const nextCode = async (client, table, column, prefix, pad) => {
  const { rows } = await client.query(
    `SELECT ${column} AS ma
     FROM ${table}
     WHERE ${column} ~ $1
     ORDER BY CAST(SUBSTRING(${column} FROM ${prefix.length + 1}) AS INTEGER) DESC
     LIMIT 1`,
    [`^${prefix}[0-9]+$`],
  );
  const num = rows[0]
    ? parseInt(rows[0].ma.substring(prefix.length), 10) + 1
    : 1;
  return `${prefix}${String(num).padStart(pad, '0')}`;
};

const ThongTinNhanHangModel = {
  // Sổ địa chỉ của khách: bỏ qua bản ghi lưu trữ (địa chỉ của đơn cũ)
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
        AND ttnh.ttnh_luu_tru = false
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
        await client.query(
          `UPDATE thongtinnhanhang SET ttnh_lamacdinh = false
           WHERE kh_ma = $1 AND ttnh_luu_tru = false`,
          [data.kh_ma],
        );
      }

      // 3. Thêm vào bảng thongtinnhanhang (ttnh_luu_tru mặc định false)
      const insertTtnhQuery = `
        INSERT INTO thongtinnhanhang (
          ttnh_ma, dc_ma, kh_ma, ttnh_ten, ttnh_sdt,
          ttnh_ghichu, ttnh_diachisnapshot, ttnh_lamacdinh
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

      // 1. Cập nhật bảng diachi.
      //    Nếu client không gửi dc_ma, tự tra theo ttnh_ma (trước đây bị bỏ qua âm thầm).
      const updateDcQuery = `
        UPDATE diachi d
        SET dc_mota = $1, xa_ma = $2
        WHERE d.dc_ma = COALESCE(
          $3,
          (SELECT dc_ma FROM thongtinnhanhang WHERE ttnh_ma = $4)
        )
      `;
      await client.query(updateDcQuery, [
        data.dc_mota,
        data.xa_ma,
        data.dc_ma || null,
        ttnh_ma,
      ]);

      // 2. Nếu là mặc định, bỏ mặc định của các địa chỉ khác
      if (data.ttnh_lamacdinh) {
        await client.query(
          `UPDATE thongtinnhanhang SET ttnh_lamacdinh = false
           WHERE kh_ma = $1 AND ttnh_luu_tru = false`,
          [data.kh_ma],
        );
      }

      // 3. Cập nhật bảng thongtinnhanhang (chỉ địa chỉ đang dùng trong sổ)
      const updateTtnhQuery = `
        UPDATE thongtinnhanhang 
        SET ttnh_ten = $1, ttnh_sdt = $2, ttnh_ghichu = $3,
            ttnh_diachisnapshot = $4, ttnh_lamacdinh = $5
        WHERE ttnh_ma = $6
          AND ttnh_luu_tru = false
          AND ($7::varchar IS NULL OR kh_ma = $7)
        RETURNING *
      `;
      const values = [
        data.ttnh_ten, data.ttnh_sdt, data.ttnh_ghichu,
        data.ttnh_diachisnapshot, data.ttnh_lamacdinh,
        ttnh_ma, data.kh_ma || null,
      ];
      const res = await client.query(updateTtnhQuery, values);

      if (!res.rows[0]) {
        throw new Error('Không tìm thấy địa chỉ nhận hàng để cập nhật.');
      }

      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
  },

  // Địa chỉ đã gắn với đơn hàng thì không xóa cứng, chỉ chuyển sang lưu trữ
  delete: async (ttnh_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const usedRes = await client.query(
        'SELECT 1 FROM donhangkhachmua WHERE ttnh_ma = $1 LIMIT 1',
        [ttnh_ma],
      );

      if (usedRes.rowCount > 0) {
        const soft = await client.query(
          `UPDATE thongtinnhanhang
           SET ttnh_luu_tru = true, ttnh_lamacdinh = false
           WHERE ttnh_ma = $1 RETURNING *`,
          [ttnh_ma],
        );
        await client.query('COMMIT');
        return soft.rows[0] ? { ...soft.rows[0], da_luu_tru: true } : null;
      }

      // Lấy dc_ma để xóa địa chỉ
      const getDcQuery = 'SELECT dc_ma FROM thongtinnhanhang WHERE ttnh_ma = $1';
      const dcRes = await client.query(getDcQuery, [ttnh_ma]);
      const dc_ma = dcRes.rows[0]?.dc_ma;

      // Xóa thông tin nhận hàng
      const res = await client.query(
        'DELETE FROM thongtinnhanhang WHERE ttnh_ma = $1 RETURNING *',
        [ttnh_ma],
      );

      // Xóa địa chỉ (mỗi địa chỉ nhận hàng tương ứng 1-1 với bảng diachi)
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

      const check = await client.query(
        `SELECT 1 FROM thongtinnhanhang
         WHERE ttnh_ma = $1 AND kh_ma = $2 AND ttnh_luu_tru = false`,
        [ttnh_ma, kh_ma],
      );
      if (check.rowCount === 0) {
        throw new Error('Địa chỉ không thuộc khách hàng này.');
      }

      await client.query(
        `UPDATE thongtinnhanhang SET ttnh_lamacdinh = false
         WHERE kh_ma = $1 AND ttnh_luu_tru = false`,
        [kh_ma],
      );
      const res = await client.query(
        'UPDATE thongtinnhanhang SET ttnh_lamacdinh = true WHERE ttnh_ma = $1 RETURNING *',
        [ttnh_ma],
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
  },

  // Đóng băng địa chỉ cho 1 đơn hàng: clone ttnh + diachi, trả về ttnh_ma mới.
  // Phải gọi bên trong transaction của datHangService (truyền client vào).
  cloneForOrder: async (client, ttnh_ma, kh_ma) => {
    const srcRes = await client.query(
      `SELECT t.*, dc.dc_mota, dc.xa_ma, dc.dc_gps
       FROM thongtinnhanhang t
       JOIN diachi dc ON dc.dc_ma = t.dc_ma
       WHERE t.ttnh_ma = $1
         AND t.kh_ma = $2
         AND t.ttnh_luu_tru = false`,
      [ttnh_ma, kh_ma],
    );
    const src = srcRes.rows[0];
    if (!src) {
      throw new Error(
        'Địa chỉ nhận hàng không hợp lệ hoặc không thuộc khách hàng này.',
      );
    }

    const newDcMa = await nextCode(client, 'diachi', 'dc_ma', 'DC', 2);
    const newTtnhMa = await nextCode(
      client, 'thongtinnhanhang', 'ttnh_ma', 'TTNH', 2,
    );

    await client.query(
      `INSERT INTO diachi (dc_ma, dc_mota, dc_gps, xa_ma)
       VALUES ($1, $2, $3, $4)`,
      [newDcMa, src.dc_mota, src.dc_gps, src.xa_ma],
    );

    await client.query(
      `INSERT INTO thongtinnhanhang (
         ttnh_ma, dc_ma, kh_ma, ttnh_ten, ttnh_sdt,
         ttnh_ghichu, ttnh_diachisnapshot, ttnh_lamacdinh, ttnh_luu_tru
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, true)`,
      [
        newTtnhMa, newDcMa, src.kh_ma, src.ttnh_ten,
        src.ttnh_sdt, src.ttnh_ghichu, src.ttnh_diachisnapshot,
      ],
    );

    return newTtnhMa;
  },
};

module.exports = ThongTinNhanHangModel;