const express = require('express');
const router = express.Router();
const VanChuyenShopController = require('../../controllers/gianhang/vanChuyenShopController');

router.get('/:gh_ma', VanChuyenShopController.getSettings);
router.post('/:gh_ma', VanChuyenShopController.updateSettings);

module.exports = router;