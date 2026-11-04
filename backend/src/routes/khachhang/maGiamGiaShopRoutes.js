const express = require('express');
const router = express.Router();
const MaGiamGiaShopController = require('../../controllers/khachhang/maGiamGiaShopController');

router.get('/:gh_ma', MaGiamGiaShopController.getActiveVouchersByShop);
module.exports = router;