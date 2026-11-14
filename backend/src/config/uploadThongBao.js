// backend/src/config/uploadThongBao.js
// Upload tệp đính kèm thông báo: tối đa 3 ảnh + 2 PDF, mỗi tệp <= 10MB
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads/thongbao');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const LOAI_TEP = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'application/pdf': 'pdf',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const duoi = ext || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
    cb(null, `tb-${Date.now()}-${Math.round(Math.random() * 1e9)}${duoi}`);
  },
});

const uploadThongBao = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const loai = LOAI_TEP[file.mimetype];
    if (!loai) {
      return cb(new Error('Chỉ chấp nhận ảnh JPG/PNG/WEBP/GIF hoặc tệp PDF.'));
    }
    if (file.fieldname === 'anh' && loai !== 'image') {
      return cb(new Error('Trường "anh" chỉ nhận tệp ảnh.'));
    }
    if (file.fieldname === 'pdf' && loai !== 'pdf') {
      return cb(new Error('Trường "pdf" chỉ nhận tệp PDF.'));
    }
    return cb(null, true);
  },
});

const fields = uploadThongBao.fields([
  { name: 'anh', maxCount: 3 },
  { name: 'pdf', maxCount: 2 },
]);

module.exports = { uploadThongBao, fields, uploadDir };