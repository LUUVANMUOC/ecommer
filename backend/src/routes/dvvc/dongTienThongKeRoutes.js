// backend/src/routes/dvvc/dongTienThongKeRoutes.js
const express = require('express');
const router = express.Router();
const DongTienThongKeController = require('../../controllers/dvvc/dongTienThongKeController');

router.get('/danh-muc/:dvvc_ma', DongTienThongKeController.getDanhMuc);
router.get('/tong-quan/:dvvc_ma', DongTienThongKeController.getTongQuan);
router.get('/don-dang-giu/:dvvc_ma', DongTienThongKeController.getDonDangGiu);
router.get('/don-chua-lap/:dvvc_ma', DongTienThongKeController.getDonChuaLap);
router.get('/phieu/:dvvc_ma', DongTienThongKeController.getDanhSachPhieu);
router.get('/phieu/:dvvc_ma/:pcd_ma', DongTienThongKeController.getPhieuChiTiet);

module.exports = router;