const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DonHangController = require('../../controllers/khachhang/donHangController');

// Config Multer cho ảnh đánh giá
const uploadDir = path.join(__dirname, '../../../public/uploads/danhgia');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'danhgia-' + Date.now() + path.extname(file.originalname).toLowerCase()),
});
const upload = multer({ storage });

router.get('/:kh_ma', DonHangController.getMyOrders);
router.put('/huy/:dts_ma', DonHangController.cancelOrder);
router.put('/xac-nhan/:dts_ma', DonHangController.xacNhanDaNhanHang); // ⭐ MỚI
router.post('/danh-gia', upload.array('hinhanh', 5), DonHangController.guiDanhGia); // ⭐ MỚI

module.exports = router;