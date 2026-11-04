const TrangThaiDonHangModel = require('../../models/san/trangThaiDonHangModel');

const TrangThaiDonHangController = {
  getAll: async (req, res) => {
    try {
      const data = await TrangThaiDonHangModel.getAll();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = TrangThaiDonHangController;