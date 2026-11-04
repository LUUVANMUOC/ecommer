// backend/src/controllers/khachhang/authController.js
const AuthKhachHangService = require('../../services/khachhang/authService');

const AuthKhachHangController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập đủ Email và Mật khẩu!' });
      
      const result = await AuthKhachHangService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  register: async (req, res) => {
    try {
      // Truyền req.body và req.file xuống service
      const result = await AuthKhachHangService.register(req.body, req.file);
      res.status(201).json({ message: 'Đăng ký thành công!', data: result });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = AuthKhachHangController;