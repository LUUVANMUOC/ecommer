const express = require('express');
const router = express.Router();
const MaGiamGiaController = require('../../controllers/khachhang/maGiamGiaController');

router.get('/', MaGiamGiaController.getActiveVouchers);

module.exports = router;