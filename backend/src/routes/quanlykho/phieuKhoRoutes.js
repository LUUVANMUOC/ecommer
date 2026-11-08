const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PhieuKhoController = require('../../controllers/quanlykho/phieuKhoController');

const uploadDir = path.join(__dirname, '../../../public/uploads/phieukho');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'phieukho-' + Date.now() + path.extname(file.originalname).toLowerCase()),
});
const upload = multer({ storage });

router.get('/cho-xac-nhan/:kho_ma', PhieuKhoController.getChoXacNhan);
router.get('/lich-su/:kho_ma', PhieuKhoController.getLichSu);
router.put('/xac-nhan/:pk_ma', upload.single('hinhanh'), PhieuKhoController.xacNhanNhap);
router.put('/xac-nhan-xuat/:pk_ma', upload.single('hinhanh'), PhieuKhoController.xacNhanXuat);
router.get('/:pk_ma', PhieuKhoController.getChiTiet);

module.exports = router;