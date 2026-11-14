// backend/src/routes/gianhang/thongKeShopRoutes.js
const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/gianhang/thongKeShopController');

router.get('/danh-muc/:gh_ma', Controller.getDanhMuc);
router.get('/tong-quan/:gh_ma', Controller.getTongQuan);
router.get('/theo-danh-muc/:gh_ma', Controller.getTheoDanhMuc);
router.get('/theo-thuong-hieu/:gh_ma', Controller.getTheoThuongHieu);
router.get('/theo-san-pham/:gh_ma', Controller.getTheoSanPham);

module.exports = router;