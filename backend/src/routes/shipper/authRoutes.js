// backend/src/routes/shipper/authRoutes.js
const express = require('express');
const router = express.Router();
const ShipperAuthController = require('../../controllers/shipper/authController');

router.post('/login', ShipperAuthController.login);

module.exports = router;