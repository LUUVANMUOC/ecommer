// backend/src/routes/san/dongTienRoutes.js
const express = require('express');
const router = express.Router();
const DongTienController = require('../../controllers/san/dongTienController');

// ===== Thống kê mới cho Admin =====
router.get('/admin/danh-muc', DongTienController.getDanhMucDongTien);
router.get('/admin/tong-quan', DongTienController.getTongQuanDongTien);
router.get('/admin/giao-dich', DongTienController.getGiaoDichDongTien);
router.get('/admin/phieu/:ptt_ma', DongTienController.getPhieuChiTietDongTien);

// ===== API cũ (giữ nguyên) =====
router.get('/admin', DongTienController.getDongTienAdmin);
router.get('/shop/:gh_ma', DongTienController.getDongTienShop);

module.exports = router;