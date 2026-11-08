const express = require('express');
const router = express.Router();
const AdminDonHangController = require('../../controllers/san/adminDonHangController');

router.get('/filters', AdminDonHangController.getFilters);
router.get('/chi-tiet/:dts_ma', AdminDonHangController.getOrderDetail);
router.get('/', AdminDonHangController.getOrders);

module.exports = router;