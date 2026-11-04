// backend/src/routes/maGiamGiaSanRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MaGiamGiaSanController = require('../../controllers/san/maGiamGiaSanController');

// 1. Tự động tạo thư mục lưu ảnh voucher nếu chưa có
const uploadDir = path.join(__dirname, '../../../public/uploads/vouchers');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Đã tự động tạo thư mục: ${uploadDir}`);
}

// 2. Cấu hình lưu trữ Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Đặt tên file: voucher-timestamp-random.png
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'voucher-' + uniqueSuffix + ext);
  }
});

// 3. Cấu hình giới hạn file
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)!"));
  }
});

// 4. Định nghĩa Routes (Thêm middleware upload.single('image'))
router.get('/', MaGiamGiaSanController.getAll);
router.get('/:id', MaGiamGiaSanController.getById);
// Lưu ý: Trường 'image' này phải khớp với tên trường ở FormData bên Frontend
router.post('/', upload.single('image'), MaGiamGiaSanController.create);
router.put('/:id', upload.single('image'), MaGiamGiaSanController.update);
router.delete('/:id', MaGiamGiaSanController.delete);

module.exports = router;