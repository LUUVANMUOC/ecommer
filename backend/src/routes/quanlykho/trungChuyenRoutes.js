const express = require('express');
const router = express.Router();
const TrungChuyenController = require('../../controllers/quanlykho/trungChuyenController');

// Dành cho Kho Đi (Gửi)
router.get('/cho-gui/:kho_di_ma', TrungChuyenController.getDonChoGui);
router.get('/shipper-lsp02/:kho_di_ma', TrungChuyenController.getShippersLSP02);
router.post('/gui', TrungChuyenController.guiTrungChuyen);

// Dành cho Kho Đích (Nhận)
router.get('/cho-nhan/:kho_den_ma', TrungChuyenController.getDonChoNhan);
router.put('/nhan/:dts_ma', TrungChuyenController.nhanHang);

module.exports = router;