const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KhoController = require('../../controllers/dvvc/khoController');

const uploadDir = path.join(__dirname, '../../../public/uploads/kho');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, 'kho-' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage });

router.get('/:dvvc_ma', KhoController.getAll);
router.post('/', upload.single('hinhanh'), KhoController.create);
router.put('/:kho_ma', upload.single('hinhanh'), KhoController.update);
router.delete('/:kho_ma', KhoController.delete);

module.exports = router;