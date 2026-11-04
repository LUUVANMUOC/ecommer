const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/san/gianHangKienNghiController');

// Dành cho Gian hàng
router.get('/shop/:gh_ma', Controller.getByShop);
router.post('/shop', Controller.create);

// Dành cho Sàn (Admin)
router.get('/admin', Controller.getAllForSan);
router.put('/admin/:id/reply', Controller.reply);

module.exports = router;