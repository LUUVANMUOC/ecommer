const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GiaoHangController = require('../../controllers/shipper/giaoHangController');

// Cấu hình Multer
const uploadDir = path.join(__dirname, '../../../public/uploads/giaohang');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'giaohang-' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage });

router.get('/can-giao/:shipper_ma', GiaoHangController.getDonCanGiao);
router.put('/:dts_ma/giao-hang/:shipper_ma', upload.single('hinhanh'), GiaoHangController.giaoHang);
router.get('/lich-su/:shipper_ma', GiaoHangController.getLichSu);
module.exports = router;