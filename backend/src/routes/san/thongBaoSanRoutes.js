// backend/src/routes/san/thongBaoSanRoutes.js
const express = require('express');
const router = express.Router();
const { fields } = require('../../config/uploadThongBao');
const Controller = require('../../controllers/thongbao/thongBaoController');

const LOI_UPLOAD = {
  LIMIT_FILE_SIZE: 'Mỗi tệp đính kèm tối đa 10MB.',
  LIMIT_FILE_COUNT: 'Tối đa 5 tệp đính kèm cho mỗi thông báo.',
  LIMIT_UNEXPECTED_FILE: 'Chỉ được gửi tối đa 3 ảnh và 2 tệp PDF.',
};

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

// Danh sách shop để chọn người nhận
router.get('/shop', Controller.getShopDeGui);

// Gửi thông báo hàng loạt cho shop
router.post('/gui', chayUpload, Controller.guiTuSan);

module.exports = router;