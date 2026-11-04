const ShipperDonHangService = require('../../services/shipper/donHangService');

const ShipperDonHangController = {
  getChoLay: async (req, res) => {
    try {
      const shipper_ma = req.params.shipper_ma; // Lấy từ URL Param
      const data = await ShipperDonHangService.getChoLay(shipper_ma);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  layHang: async (req, res) => {
    try {
      const shipper_ma = req.params.shipper_ma; // Lấy từ URL Param
      const { dts_ma } = req.params;
      const { ghichu } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chụp ảnh minh chứng lấy hàng!' });
      }

      const result = await ShipperDonHangService.layHang(dts_ma, shipper_ma, req.file, ghichu);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
    getLichSu: async (req, res) => {
    try {
      const data = await ShipperDonHangService.getLichSu(req.params.shipper_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  getLichSu: async (req, res) => {
    try {
      const data = await ShipperDonHangService.getLichSu(req.params.shipper_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
};

module.exports = ShipperDonHangController;