const LichSuModel = require('../../models/quanlykho/lichSuModel');
const LichSuController = {
  getLichSuKho: async (req, res) => {
    try {
      const data = await LichSuModel.getLichSuKho(req.params.kho_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
};
module.exports = LichSuController;