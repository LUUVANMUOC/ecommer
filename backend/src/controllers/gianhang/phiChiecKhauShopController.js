const PhiChiecKhauShopModel = require('../../models/gianhang/phiChiecKhauShopModel');

const PhiChiecKhauShopController = {
  // GET /api/nguoi-ban/phi-chiet-khau/:gh_ma
  get: async (req, res) => {
    try {
      const gh_ma = req.params.gh_ma || req.query.gh_ma;
      if (!gh_ma) {
        return res.status(400).json({ message: 'Thiếu mã shop!' });
      }

      const data = await PhiChiecKhauShopModel.getData(
        gh_ma,
        req.query.stmdt_ma,
      );
      res.status(200).json(data);
    } catch (error) {
      console.error('❌ Lỗi lấy bảng phí chiết khấu cho shop:', error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = PhiChiecKhauShopController;
