const DonHangShopModel = require('../../models/gianhang/donHangShopModel');

const DonHangShopController = {
  getOrders: async (req, res) => {
    try {
      const data = await DonHangShopModel.getOrdersByShop(req.params.gh_ma);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const items = await DonHangShopModel.getOrderItems(req.params.dts_ma);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  confirmOrder: async (req, res) => {
    try {
      const result = await DonHangShopModel.confirmOrder(req.params.dts_ma);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  getOrderDetail: async (req, res) => {
    try {
      const data = await DonHangShopModel.getOrderDetailByShop(req.params.dts_ma);
      if (!data) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  confirmOrder: async (req, res) => {
    try {
      const result = await DonHangShopModel.confirmOrder(req.params.dts_ma);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  // Thêm hàm mới vào object
  phanHoiDanhGia: async (req, res) => {
    try {
      const { dts_ma, ctsp_ma, kh_ma, phanhoi } = req.body;
      const result = await DonHangShopModel.phanHoiDanhGia(dts_ma, ctsp_ma, kh_ma, phanhoi);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = DonHangShopController;