const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ChiTietSanPhamController = require('../../controllers/gianhang/chiTietSanPhamController');

const uploadDir = path.join(__dirname, '../../../public/uploads/products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'product-' + Date.now() + '-' + Math.floor(Math.random()*1000) + ext);
  }
});
const upload = multer({ storage });

router.get('/:sp_ma', ChiTietSanPhamController.getBySanPham);
router.post('/', upload.array('hinhanh', 10), ChiTietSanPhamController.create); 
router.put('/:id', upload.array('hinhanh', 10), ChiTietSanPhamController.update); // Chỉ khai báo 1 lần duy nhất
router.delete('/:id', ChiTietSanPhamController.delete);
router.put('/:id/view', ChiTietSanPhamController.increaseView);
router.put('/:id/like', ChiTietSanPhamController.toggleLike);
module.exports = router;