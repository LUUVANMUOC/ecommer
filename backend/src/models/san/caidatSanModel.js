// backend/src/models/san/caidatSanModel.js
const pool = require('../../config/db');
const path = require('path');
const { deleteUploadedFile } = require('../../utils/uploadHelper');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/giaodien');

const emptyToNull = (value) =>
  value === '' || value === undefined ? null : value;

const CaidatSanModel = {
  // Lấy cấu hình của sàn
  get: async (stmdt_ma) => {
    const { rows } = await pool.query(
      'SELECT * FROM caidat_san WHERE stmdt_ma = $1',
      [stmdt_ma],
    );
    return rows[0] || null;
  },

  // Thêm mới hoặc cập nhật (mỗi sàn chỉ 1 dòng)
  upsert: async (stmdt_ma, data = {}) => {
    const old = await CaidatSanModel.get(stmdt_ma);

    // Trường text: ưu tiên dữ liệu mới, không có thì giữ cũ
    const pick = (key) =>
      data[key] !== undefined
        ? emptyToNull(data[key])
        : old
          ? old[key]
          : null;

    // Trường boolean: mặc định true
    const bool = (key, fallback = true) =>
      data[key] === undefined
        ? old
          ? old[key]
          : fallback
        : data[key] === true || data[key] === 'true' || data[key] === 1;

    const kieuHeader =
      data.cds_kieu_header ?? (old ? old.cds_kieu_header : 'logo_trai');

    const values = [
      stmdt_ma,
      pick('cds_ten_hien_thi'),
      pick('cds_khau_hieu'),
      pick('cds_logo'),
      pick('cds_favicon'),
      pick('cds_hotline'),
      pick('cds_email'),
      pick('cds_dia_chi'),
      pick('cds_ban_quyen'),
      kieuHeader === 'logo_giua' ? 'logo_giua' : 'logo_trai',
      bool('cds_header_dinh', true),
      bool('cds_hien_header', true),
      bool('cds_hien_footer', true),
    ];

    const query = `
      INSERT INTO caidat_san (
        stmdt_ma, cds_ten_hien_thi, cds_khau_hieu, cds_logo, cds_favicon,
        cds_hotline, cds_email, cds_dia_chi, cds_ban_quyen,
        cds_kieu_header, cds_header_dinh, cds_hien_header, cds_hien_footer
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (stmdt_ma) DO UPDATE SET
        cds_ten_hien_thi = EXCLUDED.cds_ten_hien_thi,
        cds_khau_hieu    = EXCLUDED.cds_khau_hieu,
        cds_logo         = EXCLUDED.cds_logo,
        cds_favicon      = EXCLUDED.cds_favicon,
        cds_hotline      = EXCLUDED.cds_hotline,
        cds_email        = EXCLUDED.cds_email,
        cds_dia_chi      = EXCLUDED.cds_dia_chi,
        cds_ban_quyen    = EXCLUDED.cds_ban_quyen,
        cds_kieu_header  = EXCLUDED.cds_kieu_header,
        cds_header_dinh  = EXCLUDED.cds_header_dinh,
        cds_hien_header  = EXCLUDED.cds_hien_header,
        cds_hien_footer  = EXCLUDED.cds_hien_footer,
        cds_cap_nhat_luc = now()
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    const saved = rows[0];

    // Dọn ảnh cũ nếu bị thay
    if (old) {
      if (old.cds_logo && old.cds_logo !== saved.cds_logo) {
        deleteUploadedFile(old.cds_logo, UPLOAD_DIR);
      }
      if (old.cds_favicon && old.cds_favicon !== saved.cds_favicon) {
        deleteUploadedFile(old.cds_favicon, UPLOAD_DIR);
      }
    }

    return saved;
  },
};

module.exports = CaidatSanModel;