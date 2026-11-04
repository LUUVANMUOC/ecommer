const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DanhMucSanPhamController = require('../../controllers/gianhang/danhMucSanPhamController');

const uploadDir = path.join(__dirname, '../../../public/uploads/categories');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'category-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

router.get('/:gh_ma', DanhMucSanPhamController.getByGianHang);
router.post('/', upload.single('hinhanh'), DanhMucSanPhamController.create);
router.put('/:id', upload.single('hinhanh'), DanhMucSanPhamController.update);
router.delete('/:id', DanhMucSanPhamController.delete);

module.exports = router;