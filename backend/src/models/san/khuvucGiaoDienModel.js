// backend/src/models/san/khuvucGiaoDienModel.js
const pool = require('../../config/db');
const path = require('path');
const { deleteUploadedFile } = require('../../utils/uploadHelper');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/giaodien');

const KIEU_BOC_CUC = [
  'menu_ngang',
  'danh_sach_doc',
  'luoi_anh',
  'hang_icon',
  'doan_text',
];

const nextThuTu = async (stmdt_ma, vitri) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(kvg_thutu), 0) + 1 AS next
     FROM khuvuc_giaodien
     WHERE stmdt_ma = $1 AND kvg_vitri = $2`,
    [stmdt_ma, vitri],
  );
  return rows[0].next;
};

const KhuvucGiaoDienModel = {
  // onlyVisible = true: chỉ lấy khu vực đang bật (dùng cho trang khách)
  getAll: async (stmdt_ma, onlyVisible = false) => {
    const query = `
      SELECT *
      FROM khuvuc_giaodien
      WHERE stmdt_ma = $1
        AND ($2::boolean = false OR kvg_hienthi = true)
      ORDER BY kvg_vitri ASC, kvg_thutu ASC, kvg_tao_luc ASC
    `;
    const { rows } = await pool.query(query, [stmdt_ma, onlyVisible]);
    return rows;
  },

  getById: async (kvg_ma) => {
    const { rows } = await pool.query(
      'SELECT * FROM khuvuc_giaodien WHERE kvg_ma = $1',
      [kvg_ma],
    );
    return rows[0] || null;
  },

  create: async (data) => {
    const thutu =
      data.kvg_thutu !== undefined && data.kvg_thutu !== null
        ? Number(data.kvg_thutu)
        : await nextThuTu(data.stmdt_ma, data.kvg_vitri);

    const kieu = KIEU_BOC_CUC.includes(data.kvg_kieubocuc)
      ? data.kvg_kieubocuc
      : 'danh_sach_doc';

    const query = `
      INSERT INTO khuvuc_giaodien (
        kvg_ma, stmdt_ma, kvg_vitri, kvg_ten, kvg_tieude,
        kvg_kieubocuc, kvg_thutu, kvg_hienthi
      )
      VALUES (
        'KVG' || LPAD((
          SELECT COALESCE(MAX(SUBSTRING(kvg_ma FROM 4)::int), 0) + 1
          FROM khuvuc_giaodien
          WHERE kvg_ma ~ '^KVG[0-9]+$'
        )::text, 7, '0'),
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING *
    `;

    const values = [
      data.stmdt_ma,
      data.kvg_vitri,
      data.kvg_ten,
      data.kvg_tieude || null,
      kieu,
      thutu,
      data.kvg_hienthi === undefined ? true : Boolean(data.kvg_hienthi),
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  update: async (kvg_ma, data) => {
    const old = await KhuvucGiaoDienModel.getById(kvg_ma);
    if (!old) return null;

    const kieu = KIEU_BOC_CUC.includes(data.kvg_kieubocuc)
      ? data.kvg_kieubocuc
      : old.kvg_kieubocuc;

    const query = `
      UPDATE khuvuc_giaodien SET
        kvg_vitri     = $1,
        kvg_ten       = $2,
        kvg_tieude    = $3,
        kvg_kieubocuc = $4,
        kvg_thutu     = $5,
        kvg_hienthi   = $6
      WHERE kvg_ma = $7
      RETURNING *
    `;

    const values = [
      data.kvg_vitri ?? old.kvg_vitri,
      data.kvg_ten ?? old.kvg_ten,
      data.kvg_tieude !== undefined ? data.kvg_tieude || null : old.kvg_tieude,
      kieu,
      data.kvg_thutu !== undefined ? Number(data.kvg_thutu) : old.kvg_thutu,
      data.kvg_hienthi !== undefined
        ? Boolean(data.kvg_hienthi)
        : old.kvg_hienthi,
      kvg_ma,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Xóa khu vực: xóa luôn mục con (CASCADE) và dọn ảnh của các mục con
  remove: async (kvg_ma) => {
    const { rows: images } = await pool.query(
      `SELECT tpg_hinhanh
       FROM thanhphan_giaodien
       WHERE kvg_ma = $1 AND tpg_hinhanh IS NOT NULL`,
      [kvg_ma],
    );

    const { rows } = await pool.query(
      'DELETE FROM khuvuc_giaodien WHERE kvg_ma = $1 RETURNING *',
      [kvg_ma],
    );

    if (rows[0]) {
      images.forEach((item) => deleteUploadedFile(item.tpg_hinhanh, UPLOAD_DIR));
    }

    return rows[0] || null;
  },

  // Lưu thứ tự mới sau khi kéo thả
  reorder: async (ids) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < ids.length; i++) {
        await client.query(
          'UPDATE khuvuc_giaodien SET kvg_thutu = $1 WHERE kvg_ma = $2',
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

module.exports = KhuvucGiaoDienModel;