const express = require('express');
const router = express.Router();
const QLKPhanCongController = require('../../controllers/quanlykho/phanCongController');

router.get('/don-cho-lay/:kho_ma', QLKPhanCongController.getPendingOrders);
router.get('/shipper-theo-kho/:kho_ma', QLKPhanCongController.getShippersByKho);
router.post('/phan-cong', QLKPhanCongController.assignShipper);

module.exports = router;