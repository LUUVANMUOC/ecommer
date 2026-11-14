// backend/src/models/san/thanhPhanGiaoDienModel.js
const pool = require('../../config/db');
const path = require('path');
const { deleteUploadedFile } = require('../../utils/uploadHelper');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/giaodien');

const LOAI = ['link', 'text', 'image', 'icon'];

const nextThuTu = async (kvg_ma) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(tpg_thutu), 0) + 1 AS next
     FROM thanhphan_giaodien
     WHERE kvg_ma = $1`,
    [kvg_ma],
  );
  return rows[0].next;
};

const ThanhPhanGiaoDienModel = {
  // Dùng cho trang khách: lấy mục đang bật của toàn sàn
  getBySan: async (stmdt_ma, onlyVisible = false) => {
    const query = `
      SELECT tp.*
      FROM thanhphan_giaodien tp
      JOIN khuvuc_giaodien kv ON kv.kvg_ma = tp.kvg_ma
      WHERE kv.stmdt_ma = $1
        AND ($2::boolean = false OR tp.tpg_hienthi = true)
      ORDER BY kv.kvg_thutu ASC, tp.tpg_thutu ASC, tp.tpg_tao_luc ASC
    `;
    const { rows } = await pool.query(query, [stmdt_ma, onlyVisible]);
    return rows;
  },

  getByKhuVuc: async (kvg_ma, onlyVisible = false) => {
    const query = `
      SELECT *
      FROM thanhphan_giaodien
      WHERE kvg_ma = $1
        AND ($2::boolean = false OR tpg_hienthi = true)
      ORDER BY tpg_thutu ASC, tpg_tao_luc ASC
    `;
    const { rows } = await pool.query(query, [kvg_ma, onlyVisible]);
    return rows;
  },

  getById: async (tpg_ma) => {
    const { rows } = await pool.query(
      'SELECT * FROM thanhphan_giaodien WHERE tpg_ma = $1',
      [tpg_ma],
    );
    return rows[0] || null;
  },

  create: async (data) => {
    const thutu =
      data.tpg_thutu !== undefined && data.tpg_thutu !== null
        ? Number(data.tpg_thutu)
        : await nextThuTu(data.kvg_ma);

    const loai = LOAI.includes(data.tpg_loai) ? data.tpg_loai : 'link';

    const query = `
      INSERT INTO thanhphan_giaodien (
        tpg_ma, kvg_ma, tpg_loai, tpg_tieude, tpg_noidung,
        tpg_lienket, tpg_hinhanh, tpg_bieutuong,
        tpg_mo_tab_moi, tpg_thutu, tpg_hienthi
      )
      VALUES (
        'TPG' || LPAD((
          SELECT COALESCE(MAX(SUBSTRING(tpg_ma FROM 4)::int), 0) + 1
          FROM thanhphan_giaodien
          WHERE tpg_ma ~ '^TPG[0-9]+$'
        )::text, 7, '0'),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING *
    `;

    const values = [
      data.kvg_ma,
      loai,
      data.tpg_tieude || null,
      data.tpg_noidung || null,
      data.tpg_lienket || null,
      loai === 'image' ? data.tpg_hinhanh || null : null,
      loai === 'icon' ? data.tpg_bieutuong || null : null,
      Boolean(data.tpg_mo_tab_moi),
      thutu,
      data.tpg_hienthi === undefined ? true : Boolean(data.tpg_hienthi),
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  update: async (tpg_ma, data) => {
    const old = await ThanhPhanGiaoDienModel.getById(tpg_ma);
    if (!old) return null;

    const loai = LOAI.includes(data.tpg_loai) ? data.tpg_loai : old.tpg_loai;
    const hinhanh =
      data.tpg_hinhanh !== undefined ? data.tpg_hinhanh || null : old.tpg_hinhanh;

    const query = `
      UPDATE thanhphan_giaodien SET
        tpg_loai       = $1,
        tpg_tieude     = $2,
        tpg_noidung    = $3,
        tpg_lienket    = $4,
        tpg_hinhanh    = $5,
        tpg_bieutuong  = $6,
        tpg_mo_tab_moi = $7,
        tpg_thutu      = $8,
        tpg_hienthi    = $9
      WHERE tpg_ma = $10
      RETURNING *
    `;

    const values = [
      loai,
      data.tpg_tieude !== undefined ? data.tpg_tieude || null : old.tpg_tieude,
      data.tpg_noidung !== undefined
        ? data.tpg_noidung || null
        : old.tpg_noidung,
      data.tpg_lienket !== undefined
        ? data.tpg_lienket || null
        : old.tpg_lienket,
      loai === 'image' ? hinhanh : null,
      loai === 'icon'
        ? data.tpg_bieutuong !== undefined
          ? data.tpg_bieutuong || null
          : old.tpg_bieutuong
        : null,
      data.tpg_mo_tab_moi !== undefined
        ? Boolean(data.tpg_mo_tab_moi)
        : old.tpg_mo_tab_moi,
      data.tpg_thutu !== undefined ? Number(data.tpg_thutu) : old.tpg_thutu,
      data.tpg_hienthi !== undefined
        ? Boolean(data.tpg_hienthi)
        : old.tpg_hienthi,
      tpg_ma,
    ];

    const { rows } = await pool.query(query, values);
    const saved = rows[0];

    // Đổi ảnh hoặc đổi loại khỏi image => xóa file cũ
    if (old.tpg_hinhanh && old.tpg_hinhanh !== saved.tpg_hinhanh) {
      deleteUploadedFile(old.tpg_hinhanh, UPLOAD_DIR);
    }

    return saved;
  },

  remove: async (tpg_ma) => {
    const old = await ThanhPhanGiaoDienModel.getById(tpg_ma);
    const { rows } = await pool.query(
      'DELETE FROM thanhphan_giaodien WHERE tpg_ma = $1 RETURNING *',
      [tpg_ma],
    );

    if (old && old.tpg_hinhanh) {
      deleteUploadedFile(old.tpg_hinhanh, UPLOAD_DIR);
    }

    return rows[0] || null;
  },

  reorder: async (ids) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < ids.length; i++) {
        await client.query(
          'UPDATE thanhphan_giaodien SET tpg_thutu = $1 WHERE tpg_ma = $2',
          [i + 1, ids[i]],
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = ThanhPhanGiaoDienModel;