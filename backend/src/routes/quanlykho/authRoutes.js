const express = require('express');
const router = express.Router();
const QuanLyKhoAuthController = require('../../controllers/quanlykho/authController');

router.post('/login', QuanLyKhoAuthController.login);

module.exports = router;