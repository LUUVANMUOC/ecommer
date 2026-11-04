const express = require('express');
const router = express.Router();
const MaGiamGiaVanChuyenController = require('../../controllers/khachhang/maGiamGiaVanChuyenController');

router.get('/', MaGiamGiaVanChuyenController.getActiveVouchers);
module.exports = router;