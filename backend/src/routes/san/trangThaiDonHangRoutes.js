const express = require('express');
const router = express.Router();
const TrangThaiDonHangController = require('../../controllers/san/trangThaiDonHangController');

router.get('/', TrangThaiDonHangController.getAll);

module.exports = router;