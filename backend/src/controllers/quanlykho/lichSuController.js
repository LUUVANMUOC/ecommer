const LichSuModel = require('../../models/quanlykho/lichSuModel');

const LichSuController = {
  getLichSuKho: async (req, res) => {
    try {
      const data = await LichSuModel.getLichSuKho(req.params.kho_ma);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 🟢 Chi tiết đầy đủ 1 đơn — phải truyền ?kho_ma=... để kiểm tra quyền
  getChiTiet: async (req, res) => {
    try {
      const { kho_ma } = req.query;
      if (!kho_ma) {
        return res.status(400).json({ message: 'Thiếu mã kho!' });
      }
      const data = await LichSuModel.getChiTietDonHang(req.params.dts_ma, kho_ma);
      if (!data) {
        return res.status(404).json({
          message: 'Không tìm thấy đơn hàng hoặc đơn không thuộc kho của bạn!',
        });
      }
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = LichSuController;