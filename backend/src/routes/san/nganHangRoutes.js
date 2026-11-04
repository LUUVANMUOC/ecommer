const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const NganHangController = require('../../controllers/san/nganHangController'); 

// 1. TỰ ĐỘNG TẠO THƯ MỤC LƯU LOGO NẾU CHƯA TỒN TẠI
const uploadDir = path.join(__dirname, '../../../public/uploads/logos'); 
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[MULTER] Đã tự động tạo thư mục: ${uploadDir}`);
}

// 2. CẤU HÌNH NƠI LƯU VÀ TÊN FILE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase(); 
    cb(null, 'logo-' + uniqueSuffix + ext); 
  }
});

// 3. CẤU HÌNH MULTER (Giới hạn dung lượng và định dạng)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)!"));
  }
});

// Hàm bọc (Wrapper) để bắt lỗi từ Multer (như sai định dạng, quá dung lượng)
const uploadSingle = (req, res, next) => {
    // 'logo' là tên key Frontend phải gửi lên trong FormData
    const uploadMiddleware = upload.single('logo'); 
    uploadMiddleware(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Lỗi do Multer (VD: File too large)
            return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
        } else if (err) {
            // Lỗi do fileFilter (Sai định dạng ảnh)
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// 4. ĐỊNH NGHĨA ROUTES
router.get('/', NganHangController.getAll);

// Sử dụng hàm uploadSingle thay vì upload.single trực tiếp
router.post('/', uploadSingle, NganHangController.create);
router.put('/:id', uploadSingle, NganHangController.update);
router.delete('/:id', NganHangController.delete);

module.exports = router;