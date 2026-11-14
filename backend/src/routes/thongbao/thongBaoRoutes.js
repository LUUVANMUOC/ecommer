// backend/src/routes/thongbao/thongBaoRoutes.js
const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/thongbao/thongBaoController');

// Lưu ý: /chua-doc phải khai báo TRƯỚC /:tb_ma để không bị bắt nhầm
router.get('/:nn_loai/:nn_ma/chua-doc', Controller.demChuaDoc);
router.get('/:nn_loai/:nn_ma', Controller.getHopThu);
router.get('/:nn_loai/:nn_ma/:tb_ma', Controller.getChiTiet);

router.patch('/:nn_loai/:nn_ma/:tb_ma/da-doc', Controller.danhDauDaDoc);
router.post('/:nn_loai/:nn_ma/da-doc-tat-ca', Controller.danhDauDaDocTatCa);

module.exports = router;