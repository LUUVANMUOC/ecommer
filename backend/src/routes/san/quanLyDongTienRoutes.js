const express = require('express');
const router = express.Router();
const QuanLyDongTienController = require('../../controllers/san/quanLyDongTienController');

// Route lấy danh sách số dư (Ví nội bộ) của các Shop đang chờ chi trả
router.get('/vi-shop', QuanLyDongTienController.getViShop);
router.post('/xac-nhan-da-tra', QuanLyDongTienController.xacNhanDaTra);
// Route thực hiện lệnh chi trả tự động qua SePay Payout
router.post('/payout-shop', QuanLyDongTienController.payoutShop);

module.exports = router;