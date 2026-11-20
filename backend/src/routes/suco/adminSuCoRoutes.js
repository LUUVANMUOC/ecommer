// backend/src/routes/suco/adminSuCoRoutes.js
const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/suco/suCoController');

router.get('/kpi', Controller.getKpi);
router.get('/', Controller.getDanhSachAdmin);
router.get('/:ycxlsc_ma', Controller.getChiTiet);

router.post('/:ycxlsc_ma/tiep-nhan', Controller.tiepNhan);
router.post('/:ycxlsc_ma/yeu-cau-bo-sung', Controller.yeuCauBoSung);
router.post('/:ycxlsc_ma/ket-luan', Controller.ketLuan);
router.post('/:ycxlsc_ma/tu-choi', Controller.tuChoi);
router.post('/:ycxlsc_ma/hoan-tat', Controller.hoanTat);

module.exports = router;