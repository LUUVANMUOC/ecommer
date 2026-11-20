// backend/src/routes/suco/suCoRoutes.js
// Dùng chung cho 4 chủ thể: shop (CT02), ĐVVC (CT03), khách (CT04), shipper (CT05)
const express = require('express');
const router = express.Router();
const { fields } = require('../../config/uploadSuCo');
const Controller = require('../../controllers/suco/suCoController');

const LOI_UPLOAD = {
  LIMIT_FILE_SIZE: 'Mỗi tệp minh chứng tối đa 10MB.',
  LIMIT_FILE_COUNT: 'Tối đa 5 tệp minh chứng cho mỗi lần gửi.',
  LIMIT_UNEXPECTED_FILE: 'Chỉ được gửi tối đa 3 ảnh và 2 tệp PDF.',
};

const chayUpload = (req, res, next) =>
  fields(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      message:
        LOI_UPLOAD[error.code] ||
        error.message ||
        'Không tải được tệp minh chứng.',
    });
  });

router.get('/loai', Controller.getLoaiSuCo);
router.get('/trang-thai', Controller.getTrangThai);
router.get('/don-hang/:dts_ma', Controller.getDonHang);

router.get('/', Controller.getDanhSach);
router.post('/', chayUpload, Controller.taoPhieu);

router.get('/:ycxlsc_ma', Controller.getChiTiet);
router.get(
  '/:ycxlsc_ma/hoan-tien/:ht_ma/thanh-toan',
  Controller.getThongTinThanhToan
);
router.post(
  '/:ycxlsc_ma/hoan-tien/:ht_ma/bao-chuyen',
  chayUpload,
  Controller.baoDaChuyen
);
router.post('/:ycxlsc_ma/minh-chung', chayUpload, Controller.themMinhChung);
router.post('/:ycxlsc_ma/huy', Controller.huy);

module.exports = router;