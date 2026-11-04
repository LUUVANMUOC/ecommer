// backend/src/routes/dvvc/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AuthDVVCController = require('../../controllers/dvvc/authController');

// Cấu hình thư mục lưu ảnh logo ĐVVC
const uploadDir = path.join(__dirname, '../../../public/uploads/dvvc');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'dvvc-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// Các Route API
// Chú ý: upload.single('hinhanh') phải khớp với tên key từ FormData của Frontend gửi lên
router.post('/register', upload.single('hinhanh'), AuthDVVCController.register);
router.post('/login', AuthDVVCController.login);

module.exports = router;