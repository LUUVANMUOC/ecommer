const ShipperTrungChuyenService = require('../../services/shipper/trungChuyenService');

const ShipperTrungChuyenController = {
  getDonDangTrungChuyen: async (req, res) => {
    try {
      const data = await ShipperTrungChuyenService.getDonDangTrungChuyen(req.params.shipper_ma);
      res.status(200).json(data);
    } catch (error) { 
      res.status(500).json({ message: error.message }); 
    }
  },

  getLichSu: async (req, res) => {
    try {
      const data = await ShipperTrungChuyenService.getLichSu(req.params.shipper_ma);
      res.status(200).json(data);
    } catch (error) { 
      res.status(500).json({ message: error.message }); 
    }
  },

  giaoHangToiKho: async (req, res) => {
    try {
      const { dts_ma, shipper_ma } = req.params;
      const { ghichu } = req.body;
      const result = await ShipperTrungChuyenService.giaoHangToiKho(dts_ma, shipper_ma, req.file, ghichu);
      res.status(200).json({ message: "Giao tới kho thành công!", data: result });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  giaoHangToiKhoBatch: async (req, res) => {
    try {
      const { shipper_ma } = req.params;
      const { ghichu } = req.body;
      // multipart gửi lên dạng chuỗi JSON, vẫn chấp nhận mảng nếu gọi JSON thuần
      let danh_sach = req.body.danh_sach;
      if (typeof danh_sach === 'string') {
        try {
          danh_sach = JSON.parse(danh_sach);
        } catch (error) {
          throw new Error('Danh sách đơn không hợp lệ!');
        }
      }
      const result = await ShipperTrungChuyenService.giaoHangToiKhoBatch(
        danh_sach,
        shipper_ma,
        req.file,
        ghichu,
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = ShipperTrungChuyenController;