// backend/src/routes/gianhang/maGiamGiaShopRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MaGiamGiaShopController = require('../../controllers/gianhang/maGiamGiaShopController');

// Cấu hình thư mục lưu ảnh
const uploadDir = path.join(__dirname, '../../../public/uploads/vouchers');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'voucher-shop-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Chỉ cho phép upload file ảnh!"));
  }
});

router.get('/:gh_ma', MaGiamGiaShopController.getAllByShop);
router.get('/detail/:id', MaGiamGiaShopController.getById);
router.post('/', upload.single('image'), MaGiamGiaShopController.create);
router.put('/:id', upload.single('image'), MaGiamGiaShopController.update);
router.delete('/:id', MaGiamGiaShopController.delete);

module.exports = router;