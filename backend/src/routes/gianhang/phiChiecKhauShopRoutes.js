const express = require('express');
const router = express.Router();
const PhiChiecKhauShopController = require('../../controllers/gianhang/phiChiecKhauShopController');

router.get('/:gh_ma', PhiChiecKhauShopController.get);

module.exports = router;
