const MaGiamGiaShopService = require('../../services/khachhang/maGiamGiaShopService');

const MaGiamGiaShopController = {
  getActiveVouchersByShop: async (req, res) => {
    try {
      const data = await MaGiamGiaShopService.getActiveVouchersByShop(req.params.gh_ma);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
module.exports = MaGiamGiaShopController;