// backend/src/controllers/khachhang/theoDoiShopController.js
const TheoDoiShopService = require('../../services/khachhang/theoDoiShopService');

const TheoDoiShopController = {
  toggleFollow: async (req, res) => {
    try {
      const { kh_ma, gh_ma } = req.body;
      const result = await TheoDoiShopService.toggleFollow(kh_ma, gh_ma);
      res.json(result);
    } catch (error) {
      console.error("Lỗi toggleFollow:", error); // Thêm log để dễ debug
      res.status(500).json({ message: error.message });
    }
  },

  checkStatus: async (req, res) => {
    try {
      const { kh_ma, gh_ma } = req.query;
      const result = await TheoDoiShopService.checkStatus(kh_ma, gh_ma);
      res.json(result);
    } catch (error) {
      console.error("Lỗi checkStatus:", error); // Thêm log để dễ debug
      res.status(500).json({ message: error.message });
    }
  },

  getFollowedShops: async (req, res) => {
    try {
      const data = await TheoDoiShopService.getFollowedShops(req.params.kh_ma);
      res.json(data);
    } catch (error) {
      console.error("Lỗi getFollowedShops:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = TheoDoiShopController;