const GiaoHangService = require('../../services/shipper/giaoHangService');

const GiaoHangController = {
  getDonCanGiao: async (req, res) => {
    try {
      const data = await GiaoHangService.getDonCanGiao(req.params.shipper_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  giaoHang: async (req, res) => {
    try {
      const { dts_ma, shipper_ma } = req.params;
      const { ghichu } = req.body;
      
      const result = await GiaoHangService.giaoHang(dts_ma, shipper_ma, req.file, ghichu);
      res.status(200).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
    getLichSu: async (req, res) => {
    try {
      const data = await GiaoHangService.getLichSu(req.params.shipper_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
};

module.exports = GiaoHangController;