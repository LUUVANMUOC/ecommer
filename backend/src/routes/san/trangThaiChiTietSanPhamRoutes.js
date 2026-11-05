const express = require('express');
const router = express.Router();
const TrangThaiChiTietSanPhamController = require('../../controllers/san/trangThaiChiTietSanPhamController');

// ==========================================================
// ADMIN ROUTES
// ==========================================================
router.get('/admin/cho-duyet', TrangThaiChiTietSanPhamController.getChoDuyet);
router.get('/admin/tat-ca-san-pham', TrangThaiChiTietSanPhamController.getAllSanPham);
router.post('/admin/:ctsp_ma/duyet', TrangThaiChiTietSanPhamController.approve);
router.post('/admin/:ctsp_ma/dinh-chi', TrangThaiChiTietSanPhamController.suspend);

// ==========================================================
// SELLER ROUTES
// ==========================================================
router.post('/gui-duyet', TrangThaiChiTietSanPhamController.submitForApproval);

// ==========================================================
// TRUY VẤN LỊCH SỬ / TRẠNG THÁI HIỆN TẠI
// ==========================================================
router.get('/:ctsp_ma/lichsu', TrangThaiChiTietSanPhamController.getByCtsp);
router.get('/:ctsp_ma/latest', TrangThaiChiTietSanPhamController.getLatestByCtsp);

// ==========================================================
// REFERENCE DATA
// ==========================================================
router.get('/', TrangThaiChiTietSanPhamController.getAll);
router.get('/:id', TrangThaiChiTietSanPhamController.getById);

// ==========================================================
// SELLER ROUTES
// ==========================================================
router.post('/gui-duyet', TrangThaiChiTietSanPhamController.submitForApproval);
router.post('/gui-duyet-hang-loat', TrangThaiChiTietSanPhamController.submitAllForApproval); // 🟢 Thêm dòng này
module.exports = router;