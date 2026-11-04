// backend/src/services/khachhang/gioHangService.js
const GioHangModel = require('../../models/khachhang/gioHangModel');

const GioHangService = {
  getCart: async (kh_ma) => {
    if (!kh_ma) throw new Error('Thiếu mã khách hàng');
    return await GioHangModel.getCartByCustomer(kh_ma);
  },

  getCartCount: async (kh_ma) => {
    if (!kh_ma) return 0;
    return await GioHangModel.getCartCount(kh_ma);
  },

  addToCart: async (kh_ma, ctsp_ma, soluong) => {
    if (!kh_ma || !ctsp_ma) throw new Error('Thiếu thông tin!');
    if (soluong <= 0) throw new Error('Số lượng phải lớn hơn 0');
    return await GioHangModel.addToCart(kh_ma, ctsp_ma, soluong);
  },

  updateQuantity: async (kh_ma, ctsp_ma, soluong) => {
    if (soluong <= 0) throw new Error('Số lượng phải lớn hơn 0');
    return await GioHangModel.updateQuantity(kh_ma, ctsp_ma, soluong);
  },

  removeItem: async (kh_ma, ctsp_ma) => {
    return await GioHangModel.removeItem(kh_ma, ctsp_ma);
  },

  clearCart: async (kh_ma) => {
    return await GioHangModel.clearCart(kh_ma);
  }
};

module.exports = GioHangService;