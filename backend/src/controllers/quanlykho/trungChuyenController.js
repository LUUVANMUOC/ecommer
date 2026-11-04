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

  getDonChoNhan: async (req, res) => {
    try {
      const data = await TrungChuyenService.getDonChoNhan(req.params.kho_den_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  nhanHang: async (req, res) => {
    try {
      const { dts_ma } = req.params;
      const { kho_den_ma } = req.body;
      const result = await TrungChuyenService.nhanHang(dts_ma, kho_den_ma);
      res.status(200).json({ message: "Đã nhận hàng trung chuyển!", data: result });
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = TrungChuyenController;