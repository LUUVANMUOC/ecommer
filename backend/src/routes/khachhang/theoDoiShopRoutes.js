const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/khachhang/theoDoiShopController');

router.post('/toggle', Controller.toggleFollow);
router.get('/check', Controller.checkStatus);
router.get('/:kh_ma', Controller.getFollowedShops);

module.exports = router;