const ThongTinNhanHangService = require('../../services/khachhang/thongTinNhanHangService');

const ThongTinNhanHangController = {
  getAll: async (req, res) => {
    try { res.json(await ThongTinNhanHangService.getAll(req.params.kh_ma)); } catch (error) { res.status(500).json({ message: error.message }); }
  },
  create: async (req, res) => {
    try { res.status(201).json(await ThongTinNhanHangService.create(req.body)); } catch (error) { res.status(400).json({ message: error.message }); }
  },
  update: async (req, res) => {
    try { res.json(await ThongTinNhanHangService.update(req.params.ttnh_ma, req.body)); } catch (error) { res.status(400).json({ message: error.message }); }
  },
  delete: async (req, res) => {
    try { await ThongTinNhanHangService.delete(req.params.ttnh_ma); res.json({ message: 'Xóa thành công' }); } catch (error) { res.status(400).json({ message: error.message }); }
  },
  setDefault: async (req, res) => {
    try { res.json(await ThongTinNhanHangService.setDefault(req.body.kh_ma, req.params.ttnh_ma)); } catch (error) { res.status(400).json({ message: error.message }); }
  }
};
module.exports = ThongTinNhanHangController;