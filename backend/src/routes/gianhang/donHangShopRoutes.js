const express = require('express');
const router = express.Router();
const DonHangShopController = require('../../controllers/gianhang/donHangShopController');
// Thêm dòng này
router.get('/:gh_ma', DonHangShopController.getOrders);
router.get('/chi-tiet/:dts_ma', DonHangShopController.getOrderDetail);
// Đặt trước '/xac-nhan/:dts_ma' cho rõ thứ tự
router.put('/xac-nhan-hang-loat', DonHangShopController.confirmOrdersBatch);
router.put('/xac-nhan/:dts_ma', DonHangShopController.confirmOrder); // ✅ Route xác nhận
router.get('/chi-tiet/:dts_ma', DonHangShopController.getOrderDetail); // ✅ Route mới
module.exports = router;