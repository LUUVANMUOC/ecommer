const ShipperAuthService = require('../../services/shipper/authService');

const ShipperAuthController = {
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
  },

  // 🟢 API Đổi mật khẩu
  changePassword: async (req, res) => {
    try {
      const { shipper_ma, oldPassword, newPassword } = req.body;
      
      if (!shipper_ma || !oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
      }

      const result = await ShipperAuthService.changePassword(shipper_ma, oldPassword, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = ShipperAuthController;