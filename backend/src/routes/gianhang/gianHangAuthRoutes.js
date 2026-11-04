const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import Controller (Chỉ cần import 1 lần duy nhất)
const GianHangAuthController = require('../../controllers/gianhang/gianHangAuthController');

// Cấu hình thư mục lưu ảnh gian hàng (Lùi 3 cấp)
const uploadDir = path.join(__dirname, '../../../public/uploads/shops');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'shop-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// ================= ROUTES =================

// 1. Đăng ký & Đăng nhập
router.post('/register', upload.single('hinhanh'), GianHangAuthController.register);
router.post('/login', GianHangAuthController.login);

// 2. Thông tin cá nhân của Shop (Xem & Cập nhật)
router.get('/profile/:id', GianHangAuthController.getProfile);
router.put('/profile/:id', upload.single('hinhanh'), GianHangAuthController.updateProfile);

// Thêm dòng này
router.put('/change-password', GianHangAuthController.changePassword);
module.exports = router;