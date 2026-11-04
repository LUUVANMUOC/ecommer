const express = require('express');
const router = express.Router();
const TheoDoiController = require('../../controllers/dvvc/theoDoiController');

router.get('/:dvvc_ma', TheoDoiController.getDanhSach);
router.get('/chi-tiet/:dts_ma', TheoDoiController.getChiTiet);

module.exports = router;