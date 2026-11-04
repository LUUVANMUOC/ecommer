const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GianHangController = require('../../controllers/gianhang/gianHangController');

// Cấu hình upload ảnh
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

// Routes
router.get('/', GianHangController.getAll);
router.put('/:id', upload.single('hinhanh'), GianHangController.update);
router.delete('/:id', GianHangController.delete);

module.exports = router;