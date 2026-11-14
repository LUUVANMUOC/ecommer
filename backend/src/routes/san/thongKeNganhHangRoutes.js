// backend/src/routes/san/thongKeNganhHangRoutes.js
const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/san/thongKeNganhHangController');

router.get('/danh-muc', Controller.getDanhMuc);
router.get('/tong-quan', Controller.getTongQuan);
router.get('/theo-nganh', Controller.getTheoNganh);
router.get('/theo-thuong-hieu', Controller.getTheoThuongHieu);
router.get('/theo-shop', Controller.getTheoShop);
router.get('/theo-san-pham', Controller.getTheoSanPham);
router.get('/shop-thoi-gian', Controller.getShopThoiGian);

module.exports = router;