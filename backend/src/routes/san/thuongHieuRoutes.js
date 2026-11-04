const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const ThuongHieuController = require('../../controllers/san/thuongHieuController');

// Lùi 3 cấp từ src/routes/san ra ngoài backend
const uploadDir = path.join(__dirname, '../../../public/uploads/brands'); 
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
    cb(null, 'brand-' + uniqueSuffix + ext); 
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

const uploadSingle = (req, res, next) => {
    const uploadMiddleware = upload.single('icon'); // Key gửi từ Frontend là 'icon'
    uploadMiddleware(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.get('/', ThuongHieuController.getAll);
router.post('/', uploadSingle, ThuongHieuController.create);
router.put('/:id', uploadSingle, ThuongHieuController.update);
router.delete('/:id', ThuongHieuController.delete);

module.exports = router;