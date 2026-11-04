// backend/src/routes/san/loaiShipperRoutes.js
const express = require('express');
const router = express.Router();
const LoaiShipperController = require('../../controllers/san/loaiShipperController');

router.get('/', LoaiShipperController.getAll);

module.exports = router;