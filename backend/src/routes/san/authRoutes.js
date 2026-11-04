//Định tuyến API
const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/san/authController');

// Route: POST /api/auth/admin/register
router.post('/admin/register', AuthController.register);

// Route: POST /api/auth/admin/login
router.post('/admin/login', AuthController.login);

module.exports = router;