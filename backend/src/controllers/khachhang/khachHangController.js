// backend/src/controllers/khachhang/khachHangController.js
const KhachHangService = require('../../services/khachhang/khachHangService');

const KhachHangController = {
  getProfile: async (req, res) => {
    try {
      const data = await KhachHangService.getProfile(req.params.id);
      if (!data) return res.status(404).json({ message: 'Không tìm thấy' });
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  updateProfile: async (req, res) => {
    try {
      const result = await KhachHangService.updateProfile(req.params.id, req.body, req.file);
      res.json({ message: 'Cập nhật thành công!', data: result });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  saveBankAccount: async (req, res) => {
    try {
      const result = await KhachHangService.saveBankAccount(req.params.id, req.body);
      res.json({ message: 'Lưu tài khoản thành công!', data: result });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  deleteBankAccount: async (req, res) => {
    try {
      await KhachHangService.deleteBankAccount(req.params.id);
      res.json({ message: 'Đã xóa tài khoản!' });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
  changePassword: async (req, res) => {
    try {
      const { kh_ma, oldPassword, newPassword } = req.body;
      
      if (!kh_ma || !oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
      }

      await KhachHangService.changePassword(kh_ma, oldPassword, newPassword);
      res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = KhachHangController;