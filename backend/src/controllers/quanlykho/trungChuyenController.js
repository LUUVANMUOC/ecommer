const TrungChuyenService = require('../../services/quanlykho/trungChuyenService');

const TrungChuyenController = {
  getDonChoGui: async (req, res) => {
    try {
      const data = await TrungChuyenService.getDonChoGui(req.params.kho_di_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getShippersLSP02: async (req, res) => {
    try {
      const data = await TrungChuyenService.getShippersLSP02(req.params.kho_di_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  guiTrungChuyen: async (req, res) => {
    try {
      const result = await TrungChuyenService.guiTrungChuyen(req.body);
      res.status(201).json({ message: "Gửi trung chuyển thành công!", data: result });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  guiTrungChuyenBatch: async (req, res) => {
    try {
      const { kho_di_ma, shipper_trungchuyen_ma, danh_sach } = req.body;
      const result = await TrungChuyenService.guiTrungChuyenBatch(kho_di_ma, shipper_trungchuyen_ma, danh_sach);
      res.status(201).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = TrungChuyenController;