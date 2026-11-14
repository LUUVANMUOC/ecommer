// backend/src/routes/san/publicGiaoDienRoutes.js
const express = require('express');
const router = express.Router();
const GiaoDienController = require('../../controllers/san/giaoDienController');

// GET /api/giao-dien
router.get('/', GiaoDienController.getPublic);

module.exports = router;