const PhiVanChuyenModel = require('../../models/san/phiVanChuyenModel');

const PhiVanChuyenController = {
  getAdmin: async (req, res) => {
    try {
      const data = await PhiVanChuyenModel.getDanhSachPhiVanChuyen('ADMIN');
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getDVVC: async (req, res) => {
    try {
      const data = await PhiVanChuyenModel.getDanhSachPhiVanChuyen('DVVC', req.params.dvvc_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
};

module.exports = PhiVanChuyenController;