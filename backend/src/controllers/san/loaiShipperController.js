// backend/src/controllers/san/loaiShipperController.js
const LoaiShipperModel = require('../../models/san/loaiShipperModel');

const LoaiShipperController = {
  getAll: async (req, res) => {
    try {
      const data = await LoaiShipperModel.getAll();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = LoaiShipperController;