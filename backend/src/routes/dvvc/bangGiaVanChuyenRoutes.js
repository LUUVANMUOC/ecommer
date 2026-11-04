// backend/src/routes/dvvc/bangGiaVanChuyenRoutes.js
const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/dvvc/bangGiaVanChuyenController');

router.get('/form-data', Controller.getFormData);
router.get('/:dvvc_ma', Controller.getBangGia);
router.post('/update', Controller.updateGia);

router.post('/khoi-luong', Controller.createKhoiLuong);
router.put('/khoi-luong/:id', Controller.updateKhoiLuong);
router.delete('/khoi-luong/:id', Controller.deleteKhoiLuong);

module.exports = router;