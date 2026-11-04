// backend/src/controllers/shipper/authController.js
const ShipperAuthService = require('../../services/shipper/authService');

const ShipperAuthController = {
  // POST /api/dvvc/shipper/auth/login
  login: async (req, res) => {
    try {
      const { sdt, password } = req.body;

      if (!sdt || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu!' });
      }

      const result = await ShipperAuthService.loginShipper(sdt, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
};

module.exports = ShipperAuthController;