const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // File này nằm ở src/config/ nên phải lùi 2 cấp (../../) để ra ngoài thư mục src
        // và trỏ vào thư mục public ở ngoài cùng
        const dir = path.join(__dirname, '../../public/uploads/logos'); 
        
        // Tự động tạo thư mục nếu chưa có (để không bị lỗi ENOENT)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;