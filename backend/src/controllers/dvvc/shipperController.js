const ShipperService = require('../../services/dvvc/shipperService');

const ShipperController = {
  getAll: async (req, res) => {
    try {
      const data = await ShipperService.getAllByDVVC(req.params.dvvc_ma);
      res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  create: async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.Shipper_HinhAnh = `/uploads/shippers/${req.file.filename}`;
      }
      const result = await ShipperService.create(data);
      res.status(201).json({ message: 'Thêm shipper thành công!', data: result });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  update: async (req, res) => {
    try {
      const result = await ShipperService.update(req.params.shipper_ma, req.body, req.file);
      res.json({ message: 'Cập nhật thành công!', data: result });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  delete: async (req, res) => {
    try {
      await ShipperService.delete(req.params.shipper_ma);
      res.json({ message: 'Xóa thành công!' });
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = ShipperController;