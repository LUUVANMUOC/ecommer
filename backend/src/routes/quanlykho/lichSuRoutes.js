const express = require('express');
const router = express.Router();
const LichSuController = require('../../controllers/quanlykho/lichSuController');
router.get('/:kho_ma', LichSuController.getLichSuKho);
module.exports = router;