const express = require('express');
const router = express.Router();
const PhanCongController = require('../../controllers/dvvc/phanCongController');

router.get('/don-cho-lay/:dvvc_ma', PhanCongController.getPendingOrders);
router.get('/shipper-theo-kho/:kho_ma', PhanCongController.getShippersByKho);
router.post('/phan-cong', PhanCongController.assignShipper);

module.exports = router;