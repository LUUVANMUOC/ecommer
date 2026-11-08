const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/san/thanhToanVanChuyenController');

router.get('/danh-sach-no', Controller.getDanhSachNo);
router.get('/chi-tiet-no/:dvvc_ma', Controller.getChiTietNo);
router.post('/tao-phieu/:dvvc_ma', Controller.taoPhieuChi);
router.delete('/huy-phieu/:pcd_ma', Controller.huyPhieuChi);
router.get('/trang-thai/:pcd_ma', Controller.checkTrangThai);

// Lịch sử
router.get('/lich-su/admin', Controller.getLichSuAdmin);
router.get('/lich-su/dvvc/:dvvc_ma', Controller.getLichSuDVVC);
router.get('/lich-su/chi-tiet/:pcd_ma', Controller.getChiTietLichSu);

module.exports = router;