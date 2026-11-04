// backend/src/controllers/khachhang/gioHangController.js
const GioHangService = require('../../services/khachhang/gioHangService');

const GioHangController = {
  getCart: async (req, res) => {
    try {
      const data = await GioHangService.getCart(req.params.kh_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getCartCount: async (req, res) => {
    try {
      const count = await GioHangService.getCartCount(req.params.kh_ma);
      res.json({ total: Number(count) });
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  addToCart: async (req, res) => {
    try {
      const { kh_ma, ctsp_ma, soluong } = req.body;
      await GioHangService.addToCart(kh_ma, ctsp_ma, soluong);
      res.status(200).json({ message: 'Đã thêm vào giỏ hàng!' });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  updateQuantity: async (req, res) => {
    try {
      const { kh_ma, ctsp_ma, soluong } = req.body;
      const data = await GioHangService.updateQuantity(kh_ma, ctsp_ma, soluong);
      res.json({ message: 'Cập nhật thành công!', data });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  removeItem: async (req, res) => {
    try {
      const { kh_ma, ctsp_ma } = req.body;
      await GioHangService.removeItem(kh_ma, ctsp_ma);
      res.json({ message: 'Đã xóa khỏi giỏ hàng!' });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  clearCart: async (req, res) => {
    try {
      await GioHangService.clearCart(req.params.kh_ma);
      res.json({ message: 'Đã làm trống giỏ hàng!' });
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = GioHangController;