const DongTienService = require('../../services/san/dongTienService');

const DongTienController = {
  // Lấy dữ liệu Admin
  getDongTienAdmin: async (req, res) => {
    try {
      const data = await DongTienService.getDongTienAdmin();
      res.status(200).json(data);
    } catch (error) {
      console.error("Lỗi Controller Dòng Tiền Admin:", error);
      res.status(500).json({ message: "Lỗi server khi lấy dữ liệu dòng tiền." });
    }
  },

  // Lấy dữ liệu Shop
  getDongTienShop: async (req, res) => {
    try {
      const { gh_ma } = req.params;
      const data = await DongTienService.getDongTienShop(gh_ma);
      res.status(200).json(data);
    } catch (error) {
      console.error("Lỗi Controller Dòng Tiền Shop:", error);
      res.status(500).json({ message: "Lỗi server khi lấy dữ liệu dòng tiền." });
    }
  }
};

module.exports = DongTienController;