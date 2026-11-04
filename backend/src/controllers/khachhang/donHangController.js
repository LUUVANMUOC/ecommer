const DonHangModel = require('../../models/khachhang/donHangModel');

const DonHangController = {
  getMyOrders: async (req, res) => {
    try {
      const data = await DonHangModel.getOrdersByCustomer(req.params.kh_ma);
      res.status(200).json(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
      res.status(500).json({ message: error.message });
    }
  },
  getMyOrders: async (req, res) => {
    try {
      const data = await DonHangModel.getOrdersByCustomer(req.params.kh_ma);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ✅ Thêm hàm hủy đơn
  cancelOrder: async (req, res) => {
    try {
      const result = await DonHangModel.cancelOrder(req.params.dts_ma);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = DonHangController;