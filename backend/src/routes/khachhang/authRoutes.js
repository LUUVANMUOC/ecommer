// backend/src/routes/khachhang/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AuthKhachHangController = require('../../controllers/khachhang/authController');

// Cấu hình thư mục lưu ảnh Avatar
const uploadDir = path.join(__dirname, '../../../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Chỉ cho phép upload file ảnh!"));
  }
});

router.post('/login', AuthKhachHangController.login);
// Thêm upload.single('avatar') vào route register
router.post('/register', upload.single('avatar'), AuthKhachHangController.register);

module.exports = router;