const express = require('express');
const router = express.Router();
const ShipperAuthController = require('../../controllers/shipper/authController');

router.post('/login', ShipperAuthController.login);
// 🟢 Thêm route đổi mật khẩu
router.put('/change-password', ShipperAuthController.changePassword);

module.exports = router;