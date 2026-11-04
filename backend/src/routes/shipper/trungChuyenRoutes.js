const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ShipperTrungChuyenController = require('../../controllers/shipper/trungChuyenController');

const uploadDir = path.join(__dirname, '../../../public/uploads/trungchuyen');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'trungchuyen-' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage });

router.get('/dang-di-duong/:shipper_ma', ShipperTrungChuyenController.getDonDangTrungChuyen);
router.get('/lich-su/:shipper_ma', ShipperTrungChuyenController.getLichSu); // Route lấy lịch sử
router.put('/:dts_ma/giao-toi-kho/:shipper_ma', upload.single('hinhanh'), ShipperTrungChuyenController.giaoHangToiKho);

module.exports = router;