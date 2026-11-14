const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/san/phiVanChuyenController');

// Thống kê
router.get('/admin/danh-muc', Controller.getDanhMuc);
router.get('/admin/tong-quan', Controller.getTongQuan);
router.get('/admin/danh-sach', Controller.getDanhSach);

// Giữ nguyên API cũ
router.get('/admin', Controller.getAdmin);
router.get('/dvvc/:dvvc_ma', Controller.getDVVC);

module.exports = router;