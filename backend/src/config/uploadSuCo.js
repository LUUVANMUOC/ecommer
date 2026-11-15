// backend/src/config/uploadSuCo.js
// Tệp minh chứng sự cố: tối đa 3 ảnh + 2 PDF, mỗi tệp <= 10MB
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads/suco');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const LOAI_TEP = {
  'image/jpeg': 'IMAGE',
  'image/jpg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/gif': 'IMAGE',
  'application/pdf': 'PDF',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const duoi = ext || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
    cb(null, `sc-${Date.now()}-${Math.round(Math.random() * 1e9)}${duoi}`);
  },
});

const uploadSuCo = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const loai = LOAI_TEP[file.mimetype];
    if (!loai) {
      return cb(new Error('Chỉ chấp nhận ảnh JPG/PNG/WEBP/GIF hoặc tệp PDF.'));
    }
    if (file.fieldname === 'anh' && loai !== 'IMAGE') {
      return cb(new Error('Trường "anh" chỉ nhận tệp ảnh.'));
    }
    if (file.fieldname === 'pdf' && loai !== 'PDF') {
      return cb(new Error('Trường "pdf" chỉ nhận tệp PDF.'));
    }
    return cb(null, true);
  },
});

const fields = uploadSuCo.fields([
  { name: 'anh', maxCount: 3 },
  { name: 'pdf', maxCount: 2 },
]);

// Chuyển req.files -> mảng tệp cho suCoService
const gomTepSuCo = (files = {}) => {
  const ds = [];
  for (const f of files.anh || []) {
    ds.push({
      loai: 'IMAGE',
      ten: f.originalname,
      duongdan: `/uploads/suco/${f.filename}`,
      kichthuoc: f.size,
    });
  }
  for (const f of files.pdf || []) {
    ds.push({
      loai: 'PDF',
      ten: f.originalname,
      duongdan: `/uploads/suco/${f.filename}`,
      kichthuoc: f.size,
    });
  }
  return ds;
};

module.exports = { uploadSuCo, fields, uploadDir, gomTepSuCo };