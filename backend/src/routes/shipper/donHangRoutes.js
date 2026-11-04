const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ShipperDonHangController = require('../../controllers/shipper/donHangController');

// Cấu hình Multer lưu ảnh
const uploadDir = path.join(__dirname, '../../../public/uploads/layhang');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, 'layhang-' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage });

// Truyền shipper_ma qua URL Param (Option 1A)
router.get('/cho-lay/:shipper_ma', ShipperDonHangController.getChoLay);
router.get('/lich-su/:shipper_ma', ShipperDonHangController.getLichSu);

router.put(
  '/:dts_ma/lay-hang/:shipper_ma',
  upload.single('hinhanh'),
  ShipperDonHangController.layHang
);

module.exports = router;