const PhanCongGiaoHangService = require('../../services/quanlykho/phanCongGiaoHangService');

const PhanCongGiaoHangController = {
  getDonChoPhanCong: async (req, res) => {
    try {
      const data = await PhanCongGiaoHangService.getDonChoPhanCong(req.params.kho_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getShippersLSP03: async (req, res) => {
    try {
      const data = await PhanCongGiaoHangService.getShippersLSP03(req.params.kho_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  phanCongGiaoHang: async (req, res) => {
    try {
      const { dts_ma, shipper_ma } = req.body;
      const result = await PhanCongGiaoHangService.phanCongGiaoHang(dts_ma, shipper_ma);
      res.status(201).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = PhanCongGiaoHangController;