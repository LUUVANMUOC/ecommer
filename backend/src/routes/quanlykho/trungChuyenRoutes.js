const express = require('express');
const router = express.Router();
const TrungChuyenController = require('../../controllers/quanlykho/trungChuyenController');

// Dành cho Kho Đi (Gửi)
router.get('/cho-gui/:kho_di_ma', TrungChuyenController.getDonChoGui);
router.get('/shipper-lsp02/:kho_di_ma', TrungChuyenController.getShippersLSP02);
router.post('/gui', TrungChuyenController.guiTrungChuyen);
router.post('/gui-hang-loat', TrungChuyenController.guiTrungChuyenBatch);

// Kho đích xác nhận nhận hàng: dùng chung màn hình Quản lý phiếu kho (phiếu NHAP/TRUNG_CHUYEN_DEN)
// để tránh 2 nơi cùng ghi trạng thái nhận hàng.

module.exports = router;