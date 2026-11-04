const GianHangKienNghiService = require('../../services/san/gianHangKienNghiService');

const GianHangKienNghiController = {
  getByShop: async (req, res) => {
    try {
      const data = await GianHangKienNghiService.getByShop(req.params.gh_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  getAllForSan: async (req, res) => {
    try {
      const data = await GianHangKienNghiService.getAllForSan();
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  create: async (req, res) => {
    try {
      const data = await GianHangKienNghiService.create(req.body);
      res.status(201).json(data);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
  reply: async (req, res) => {
    try {
      const data = await GianHangKienNghiService.reply(req.params.id, req.body.phanhoi);
      res.json(data);
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = GianHangKienNghiController;