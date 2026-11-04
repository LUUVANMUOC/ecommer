const TheoDoiService = require('../../services/dvvc/theoDoiService');

const TheoDoiController = {
  getDanhSach: async (req, res) => {
    try {
      const { dvvc_ma } = req.params;
      const { trangthai, kho_ma, search } = req.query;
      const data = await TheoDoiService.getDanhSach(dvvc_ma, trangthai, kho_ma, search);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  getChiTiet: async (req, res) => {
    try {
      const data = await TheoDoiService.getChiTiet(req.params.dts_ma);
      res.status(200).json(data);
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = TheoDoiController;