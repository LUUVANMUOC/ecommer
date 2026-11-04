const MaGiamGiaVanChuyenService = require('../../services/khachhang/maGiamGiaVanChuyenService');

const MaGiamGiaVanChuyenController = {
  getActiveVouchers: async (req, res) => {
    try {
      const data = await MaGiamGiaVanChuyenService.getActiveVouchers();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
module.exports = MaGiamGiaVanChuyenController;