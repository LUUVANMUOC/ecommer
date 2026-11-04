const PhanCongService = require('../../services/dvvc/phanCongService');

const PhanCongController = {
  getPendingOrders: async (req, res) => {
    try {
      const data = await PhanCongService.getPendingOrders(req.params.dvvc_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getShippersByKho: async (req, res) => {
    try {
      const data = await PhanCongService.getShippersByKho(req.params.kho_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  assignShipper: async (req, res) => {
    try {
      const { dts_ma, shipper_ma } = req.body;
      const result = await PhanCongService.assignShipper(dts_ma, shipper_ma);
      res.status(201).json({ message: "Phân công thành công!", data: result });
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = PhanCongController;