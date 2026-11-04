const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ShipperController = require('../../controllers/dvvc/shipperController');

const uploadDir = path.join(__dirname, '../../../public/uploads/shippers');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'shipper-' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage });

router.get('/:dvvc_ma', ShipperController.getAll);
router.post('/', upload.single('hinhanh'), ShipperController.create);
router.put('/:shipper_ma', upload.single('hinhanh'), ShipperController.update);
router.delete('/:shipper_ma', ShipperController.delete);

module.exports = router;