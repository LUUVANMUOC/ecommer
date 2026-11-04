const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QLKShipperController = require('../../controllers/quanlykho/shipperController');

// Lưu ảnh vào cùng thư mục với DVVC (dùng chung)
const uploadDir = path.join(__dirname, '../../../public/uploads/shippers');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      'shipper-' + Date.now() + path.extname(file.originalname).toLowerCase()
    ),
});
const upload = multer({ storage });

router.get('/:kho_ma', QLKShipperController.getAll);
router.post('/', upload.single('hinhanh'), QLKShipperController.create);
router.put('/:shipper_ma', upload.single('hinhanh'), QLKShipperController.update);
router.delete('/:shipper_ma', QLKShipperController.delete);

module.exports = router;