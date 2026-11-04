// backend/src/routes/khachhang/khachHangRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KhachHangController = require('../../controllers/khachhang/khachHangController');

// Cấu hình Upload Avatar
const uploadDir = path.join(__dirname, '../../../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'avatar-' + Date.now() + path.extname(file.originalname).toLowerCase())
})});

router.get('/profile/:id', KhachHangController.getProfile);
router.put('/profile/:id', upload.single('avatar'), KhachHangController.updateProfile);
router.post('/bank/:id', KhachHangController.saveBankAccount);
router.delete('/bank/:id', KhachHangController.deleteBankAccount);

module.exports = router;