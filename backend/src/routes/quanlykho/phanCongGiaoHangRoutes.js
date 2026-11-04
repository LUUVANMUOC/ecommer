const express = require('express');
const router = express.Router();
const PhanCongGiaoHangController = require('../../controllers/quanlykho/phanCongGiaoHangController');

router.get('/don-cho-phan-cong/:kho_ma', PhanCongGiaoHangController.getDonChoPhanCong);
router.get('/shipper-lsp03/:kho_ma', PhanCongGiaoHangController.getShippersLSP03);
router.post('/phan-cong', PhanCongGiaoHangController.phanCongGiaoHang);

module.exports = router;