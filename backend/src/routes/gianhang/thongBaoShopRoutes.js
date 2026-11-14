// backend/src/routes/gianhang/thongBaoShopRoutes.js
const express = require('express');
const router = express.Router();
const { fields } = require('../../config/uploadThongBao');
const Controller = require('../../controllers/thongbao/thongBaoController');

const LOI_UPLOAD = {
  LIMIT_FILE_SIZE: 'Mỗi tệp đính kèm tối đa 10MB.',
  LIMIT_FILE_COUNT: 'Tối đa 5 tệp đính kèm cho mỗi thông báo.',
  LIMIT_UNEXPECTED_FILE: 'Chỉ được gửi tối đa 3 ảnh và 2 tệp PDF.',
};

// Bọc multer để trả lỗi 400 thay vì 500
const chayUpload = (req, res, next) =>
  fields(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      message:
        LOI_UPLOAD[error.code] ||
        error.message ||
        'Không tải được tệp đính kèm.',
    });
  });

// Danh sách khách đang theo dõi shop (để tick chọn)
router.get('/khach-hang-theo-doi/:gh_ma', Controller.getKhachHangTheoDoi);

// Gửi thông báo hàng loạt cho khách theo dõi
router.post('/gui', chayUpload, Controller.guiTuShop);

module.exports = router;