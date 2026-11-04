const QLKShipperService = require('../../services/quanlykho/shipperService');

const QLKShipperController = {
  // GET /api/quan-ly-kho/shipper/:kho_ma
  getAll: async (req, res) => {
    try {
      const data = await QLKShipperService.getAllByKho(req.params.kho_ma);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // POST /api/quan-ly-kho/shipper
  create: async (req, res) => {
    try {
      const kho_ma = req.body.Kho_Ma;
      const data = { ...req.body };
      if (req.file) {
        data.Shipper_HinhAnh = `/uploads/shippers/${req.file.filename}`;
      }
      const result = await QLKShipperService.create(data, kho_ma);
      res.status(201).json({
        message: 'Thêm shipper thành công!',
        data: result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // PUT /api/quan-ly-kho/shipper/:shipper_ma
  update: async (req, res) => {
    try {
      const kho_ma = req.body.Kho_Ma;
      const result = await QLKShipperService.update(
        req.params.shipper_ma,
        kho_ma,
        req.body,
        req.file
      );
      res.status(200).json({ message: 'Cập nhật thành công!', data: result });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // DELETE /api/quan-ly-kho/shipper/:shipper_ma?kho_ma=...
  delete: async (req, res) => {
    try {
      const kho_ma = req.query.kho_ma;
      await QLKShipperService.delete(req.params.shipper_ma, kho_ma);
      res.status(200).json({ message: 'Xóa thành công!' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = QLKShipperController;