const express = require('express');
const router = express.Router();
const Controller = require('../../controllers/san/phiVanChuyenController');

router.get('/admin', Controller.getAdmin);
router.get('/dvvc/:dvvc_ma', Controller.getDVVC);

module.exports = router;