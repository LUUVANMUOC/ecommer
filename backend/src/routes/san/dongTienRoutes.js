const express = require('express');
const router = express.Router();
const DongTienController = require('../../controllers/san/dongTienController');

// Route cho Admin
router.get('/admin', DongTienController.getDongTienAdmin);

// Route cho Shop
router.get('/shop/:gh_ma', DongTienController.getDongTienShop);

module.exports = router;