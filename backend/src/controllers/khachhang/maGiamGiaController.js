const MaGiamGiaService = require('../../services/khachhang/maGiamGiaService');

const MaGiamGiaController = {
  getActiveVouchers: async (req, res) => {
    try {
      const data = await MaGiamGiaService.getActiveVouchers();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
module.exports = MaGiamGiaController;