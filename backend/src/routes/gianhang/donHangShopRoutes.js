const express = require('express');
const router = express.Router();
const DonHangShopController = require('../../controllers/gianhang/donHangShopController');
// Thêm dòng này
router.put('/phan-hoi-danh-gia', DonHangShopController.phanHoiDanhGia);
router.get('/:gh_ma', DonHangShopController.getOrders);
router.get('/chi-tiet/:dts_ma', DonHangShopController.getOrderDetail);
router.put('/xac-nhan/:dts_ma', DonHangShopController.confirmOrder); // ✅ Route xác nhận
router.get('/chi-tiet/:dts_ma', DonHangShopController.getOrderDetail); // ✅ Route mới
module.exports = router;