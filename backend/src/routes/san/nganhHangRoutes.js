const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NganhHangController = require('../../controllers/san/nganhHangController');

// Thư mục lưu icon ngành hàng
const uploadDir = path.join(__dirname, '../../../public/uploads/categories');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'category-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Chỉ cho phép upload file ảnh JPG, PNG hoặc WEBP!"));
    }
});

// Bọc multer để trả lỗi JSON thay vì crash
const uploadSingle = (req, res, next) => {
    const uploadMiddleware = upload.single('icon');
    uploadMiddleware(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.get('/', NganhHangController.getAll);
router.post('/', uploadSingle, NganhHangController.create);
router.put('/:id', uploadSingle, NganhHangController.update);
router.delete('/:id', NganhHangController.delete);

module.exports = router;