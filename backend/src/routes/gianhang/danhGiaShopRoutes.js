const express = require('express');
const router = express.Router();
const DanhGiaShopController = require('../../controllers/gianhang/danhGiaShopController');

// PUT phải khai báo trước GET /:gh_ma
router.put('/phan-hoi', DanhGiaShopController.phanHoi);
router.get('/:gh_ma', DanhGiaShopController.getDanhSach);

module.exports = router;