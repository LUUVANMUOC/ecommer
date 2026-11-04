const express = require('express');
const router = express.Router();
const ThuTienShipperController = require('../../controllers/quanlykho/thuTienShipperController');

router.get('/:kho_ma', ThuTienShipperController.getDonChuaNop);
router.post('/xac-nhan', ThuTienShipperController.xacNhanThuTien);

module.exports = router;