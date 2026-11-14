const PublicNoiBatModel = require('../../models/san/publicNoiBatModel');

const PublicNoiBatController = {
  // GET /api/san-pham/noi-bat?limit=10
  getNoiBat: async (req, res) => {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const data = await PublicNoiBatModel.getNoiBat(limit);
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu nổi bật:', error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = PublicNoiBatController;