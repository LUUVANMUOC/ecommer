const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/khachhang/thongTinNhanHangController');

router.get('/:kh_ma', Controller.getAll);
router.post('/', Controller.create);
router.put('/:ttnh_ma', Controller.update);
router.delete('/:ttnh_ma', Controller.delete);
router.put('/mac-dinh/:ttnh_ma', Controller.setDefault);

module.exports = router;