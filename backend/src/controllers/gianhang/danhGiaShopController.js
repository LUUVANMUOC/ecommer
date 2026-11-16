const DanhGiaShopModel = require('../../models/gianhang/danhGiaShopModel');

const DanhGiaShopController = {
  getDanhSach: async (req, res) => {
    try {
      const data = await DanhGiaShopModel.getByShop(req.params.gh_ma, req.query);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  phanHoi: async (req, res) => {
    try {
      const { gh_ma, dts_ma, ctsp_ma, kh_ma, phanhoi } = req.body;
      const noiDung = String(phanhoi || '').trim();

      if (!gh_ma || !dts_ma || !ctsp_ma || !kh_ma) {
        return res.status(400).json({ message: 'Thiếu thông tin đánh giá cần phản hồi.' });
      }
      if (!noiDung) {
        return res.status(400).json({ message: 'Vui lòng nhập nội dung phản hồi.' });
      }
      if (noiDung.length > 1000) {
        return res.status(400).json({ message: 'Phản hồi tối đa 1000 ký tự.' });
      }

      const result = await DanhGiaShopModel.phanHoi({
        gh_ma,
        dts_ma,
        ctsp_ma,
        kh_ma,
        phanhoi: noiDung,
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = DanhGiaShopController;