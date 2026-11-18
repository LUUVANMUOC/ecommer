// backend/src/middlewares/phucVuAnh.js
// Phục vụ /uploads/*: có file trên đĩa -> trả file; không có -> 302 sang Supabase.
// Dùng thay cho express.static('public/uploads') trong server.js.
'use strict';

const fs = require('fs');
const path = require('path');
const storage = require('../config/supabaseStorage');

const THU_MUC_GOC = path.resolve(__dirname, '../../public/uploads');

// Không bao giờ phục vụ các định dạng có thể chạy script từ origin của mình
const DUOI_CHAN = new Set([
  '.html',
  '.htm',
  '.xhtml',
  '.js',
  '.mjs',
  '.cjs',
  '.xml',
  '.json',
  '.php',
  '.asp',
]);

const phucVuAnh = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  let duongDan = req.originalUrl || req.url || '';
  const viTri = duongDan.search(/[?#]/);
  if (viTri >= 0) duongDan = duongDan.slice(0, viTri);

  try {
    duongDan = decodeURIComponent(duongDan);
  } catch (_) {
    return res.status(400).type('text/plain').send('Đường dẫn không hợp lệ');
  }

  const tuongDoi = duongDan.replace(/^\/uploads\/?/, '').replace(/\\/g, '/');
  if (!tuongDoi) return res.status(404).type('text/plain').send('Không tìm thấy ảnh');

  const phan = tuongDoi.split('/');
  if (phan.some((p) => p === '..' || p === '.' || p.includes('\0'))) {
    return res.status(400).type('text/plain').send('Đường dẫn không hợp lệ');
  }

  const tuyetDoi = path.resolve(THU_MUC_GOC, tuongDoi);
  if (tuyetDoi !== THU_MUC_GOC && !tuyetDoi.startsWith(THU_MUC_GOC + path.sep)) {
    return res.status(400).type('text/plain').send('Đường dẫn không hợp lệ');
  }

  if (DUOI_CHAN.has(path.extname(tuyetDoi).toLowerCase())) {
    return res.status(404).type('text/plain').send('Không tìm thấy ảnh');
  }

  let thongTin = null;
  try {
    thongTin = fs.statSync(tuyetDoi);
  } catch (_) {
    thongTin = null;
  }

  if (thongTin && thongTin.isFile() && thongTin.size > 0) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    return res.sendFile(tuyetDoi, { etag: true, lastModified: true }, (err) => {
      if (err && !res.headersSent) next();
    });
  }

  if (storage.daBat()) {
    const url = storage.urlCongKhai(tuongDoi);
    if (url) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(302, url);
    }
  }

  return res.status(404).type('text/plain').send('Không tìm thấy ảnh');
};

module.exports = phucVuAnh;
