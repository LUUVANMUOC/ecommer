const express = require('express');
const router = express.Router();
const DonHangController = require('../../controllers/khachhang/donHangController');

router.get('/:kh_ma', DonHangController.getMyOrders);
router.get('/:kh_ma', DonHangController.getMyOrders);
router.put('/huy/:dts_ma', DonHangController.cancelOrder);
module.exports = router;