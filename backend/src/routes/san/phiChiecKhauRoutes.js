const express = require('express');
const router = express.Router();
const phiChiecKhauController = require('../../controllers/san/phiChiecKhauController');

// Chỉ giữ lại 2 API liên quan đến phí
router.get('/', phiChiecKhauController.getTableData); 
router.post('/', phiChiecKhauController.updateFee);

module.exports = router;