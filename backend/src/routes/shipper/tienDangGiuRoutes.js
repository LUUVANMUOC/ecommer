// backend/src/routes/shipper/tienDangGiuRoutes.js
const express = require('express');
const router = express.Router();
const TienDangGiuController = require('../../controllers/shipper/tienDangGiuController');

router.get('/thong-tin/:shipper_ma', TienDangGiuController.getThongTin);
router.get('/dang-giu/:shipper_ma', TienDangGiuController.getDangGiu);
router.get('/thong-ke/:shipper_ma', TienDangGiuController.getThongKe);
router.get('/lich-su-nop/:shipper_ma', TienDangGiuController.getLichSuNop);

module.exports = router;