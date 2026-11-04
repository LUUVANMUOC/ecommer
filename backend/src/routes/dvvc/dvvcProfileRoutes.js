const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DvvcProfileController = require('../../controllers/dvvc/dvvcProfileController');

// Cấu hình Upload Ảnh
const uploadDir = path.join(__dirname, '../../../public/uploads/dvvc');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'dvvc-' + Date.now() + path.extname(file.originalname).toLowerCase())
})});

router.get('/profile/:id', DvvcProfileController.getProfile);
router.put('/profile/:id', upload.single('hinhanh'), DvvcProfileController.updateProfile);
router.put('/change-password', DvvcProfileController.changePassword);
router.post('/bank/:id', DvvcProfileController.saveBankAccount);
router.delete('/bank/:id', DvvcProfileController.deleteBankAccount);

module.exports = router;