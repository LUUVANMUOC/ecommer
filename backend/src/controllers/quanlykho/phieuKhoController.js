const PhieuKhoService = require('../../services/quanlykho/phieuKhoService');

// multipart gửi lên dạng chuỗi JSON, nhưng vẫn chấp nhận mảng nếu gọi JSON thuần
const parseDanhSach = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('Thiếu danh sách phiếu!');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Danh sách phiếu không hợp lệ!');
  }
};

const PhieuKhoController = {
  getChoXacNhan: async (req, res) => {
    try {
      const data = await PhieuKhoService.getChoXacNhan(req.params.kho_ma, req.query.loai);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  xacNhanNhap: async (req, res) => {
    try {
      const { kho_ma, ghichu } = req.body;
      const hinhanh = req.file ? `/uploads/phieukho/${req.file.filename}` : null;
      const result = await PhieuKhoService.xacNhanNhap(req.params.pk_ma, kho_ma, hinhanh, ghichu);
      res.status(200).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
  xacNhanXuat: async (req, res) => {
    try {
      const { kho_ma, ghichu } = req.body;
      const hinhanh = req.file ? `/uploads/phieukho/${req.file.filename}` : null;
      const result = await PhieuKhoService.xacNhanXuat(req.params.pk_ma, kho_ma, hinhanh, ghichu);
      res.status(200).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
  xacNhanNhapBatch: async (req, res) => {
    try {
      const { kho_ma, ghichu, danh_sach } = req.body;
      const hinhanh = req.file ? `/uploads/phieukho/${req.file.filename}` : null;
      const result = await PhieuKhoService.xacNhanNhapBatch(
        kho_ma, parseDanhSach(danh_sach), hinhanh, ghichu
      );
      res.status(200).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
  xacNhanXuatBatch: async (req, res) => {
    try {
      const { kho_ma, ghichu, danh_sach } = req.body;
      const hinhanh = req.file ? `/uploads/phieukho/${req.file.filename}` : null;
      const result = await PhieuKhoService.xacNhanXuatBatch(
        kho_ma, parseDanhSach(danh_sach), hinhanh, ghichu
      );
      res.status(200).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
  getLichSu: async (req, res) => {
    try {
      const data = await PhieuKhoService.getLichSu(req.params.kho_ma, req.query.loai, req.query.lyDo);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  getChiTiet: async (req, res) => {
    try {
      const data = await PhieuKhoService.getChiTiet(req.params.pk_ma);
      res.status(200).json(data);
    } catch (error) { res.status(404).json({ message: error.message }); }
  },
};
module.exports = PhieuKhoController;
