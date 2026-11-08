const AdminDonHangModel = require('../../models/san/adminDonHangModel');

const AdminDonHangController = {
  getFilters: async (req, res) => {
    try {
      const data = await AdminDonHangModel.getFilterData();
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getOrders: async (req, res) => {
    try {
      const data = await AdminDonHangModel.getAllOrders(req.query);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getOrderDetail: async (req, res) => {
    try {
      const data = await AdminDonHangModel.getOrderDetail(req.params.dts_ma);
      if (!data) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
};

module.exports = AdminDonHangController;