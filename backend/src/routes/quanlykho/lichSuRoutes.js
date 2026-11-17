const express = require('express');
const router = express.Router();
const LichSuController = require('../../controllers/quanlykho/lichSuController');

// Chi tiết 1 đơn — PHẢI khai báo TRƯỚC '/:kho_ma', nếu không sẽ bị route 1 segment nuốt mất
router.get('/chi-tiet/:dts_ma', LichSuController.getChiTiet);

// Danh sách lịch sử theo kho
router.get('/:kho_ma', LichSuController.getLichSuKho);

module.exports = router;