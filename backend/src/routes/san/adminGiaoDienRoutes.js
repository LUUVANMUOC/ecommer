// backend/src/routes/san/adminGiaoDienRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GiaoDienController = require('../../controllers/san/giaoDienController');

const uploadDir = path.join(__dirname, '../../../public/uploads/giaodien');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `giao-dien-${uniqueSuffix}${ext}`);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|svg/;
    const okMime = filetypes.test(file.mimetype);
    const okExt = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (okMime && okExt) return cb(null, true);
    cb(new Error('Chỉ cho phép ảnh jpeg, jpg, png, gif, webp, svg!'));
  },
});

const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okMime = file.mimetype === 'application/pdf';
    const okExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (okMime && okExt) return cb(null, true);
    cb(new Error('Chỉ cho phép tệp PDF!'));
  },
});

// Cấu hình chung
router.get('/', GiaoDienController.getAdmin);
router.put('/', GiaoDienController.updateCaiDat);

// Upload ảnh
router.post('/upload', uploadImage.single('image'), GiaoDienController.uploadImage);

// Upload PDF (dùng cho mục liên kết: Điều khoản, Chính sách...)
router.post('/upload-file', (req, res, next) => {
  uploadPdf.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    return GiaoDienController.uploadImage(req, res, next);
  });
});

// Sắp xếp (đặt trước /khu-vuc/:id và /thanh-phan/:id)
router.put('/sap-xep', GiaoDienController.reorder);

// Khu vực
router.get('/khu-vuc', GiaoDienController.listKhuVuc);
router.post('/khu-vuc', GiaoDienController.createKhuVuc);
router.put('/khu-vuc/:id', GiaoDienController.updateKhuVuc);
router.delete('/khu-vuc/:id', GiaoDienController.deleteKhuVuc);

// Thành phần
router.get('/thanh-phan', GiaoDienController.listThanhPhan);
router.post('/thanh-phan', GiaoDienController.createThanhPhan);
router.put('/thanh-phan/:id', GiaoDienController.updateThanhPhan);
router.delete('/thanh-phan/:id', GiaoDienController.deleteThanhPhan);

module.exports = router;