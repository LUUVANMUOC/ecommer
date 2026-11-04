const express = require('express');
const router = express.Router();
const DatHangController = require('../../controllers/khachhang/datHangController');

router.post('/', DatHangController.createOrder);

module.exports = router;