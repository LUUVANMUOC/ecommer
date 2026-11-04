const DatHangService = require('../../services/khachhang/datHangService');

const DatHangController = {
  createOrder: async (req, res) => {
    try {
      const payload = req.body;
      if (!payload.kh_ma || !payload.ttnh_ma || !payload.orders || payload.orders.length === 0) {
        return res.status(400).json({ message: "Thiếu thông tin đặt hàng." });
      }

      const result = await DatHangService.createOrder(payload);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = DatHangController;