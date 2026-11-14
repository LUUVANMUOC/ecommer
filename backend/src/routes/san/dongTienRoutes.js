// backend/src/routes/san/dongTienRoutes.js
const express = require('express');
const router = express.Router();
const DongTienController = require('../../controllers/san/dongTienController');

// ===== Thống kê DOANH THU SÀN (trang Doanh thu sàn) =====
router.get(
  '/admin/doanh-thu-san/danh-muc',
  DongTienController.getDanhMucDoanhThuSan
);
router.get(
  '/admin/doanh-thu-san/tong-quan',
  DongTienController.getTongQuanDoanhThuSan
);
router.get(
  '/admin/doanh-thu-san/giao-dich',
  DongTienController.getGiaoDichDoanhThuSan
);
router.get(
  '/admin/doanh-thu-san/phieu/:ptt_ma',
  DongTienController.getPhieuChiTietDoanhThuSan
);

// ===== Thống kê DÒNG TIỀN KHO (trang Vận chuyển & dòng tiền kho) =====
router.get('/admin/danh-muc', DongTienController.getDanhMucDongTien);
router.get('/admin/tong-quan', DongTienController.getTongQuanDongTien);
router.get('/admin/giao-dich', DongTienController.getGiaoDichDongTien);
router.get('/admin/phieu/:ptt_ma', DongTienController.getPhieuChiTietDongTien);

// ===== API cũ (giữ nguyên) =====
router.get('/admin', DongTienController.getDongTienAdmin);
router.get('/shop/:gh_ma', DongTienController.getDongTienShop);

module.exports = router;