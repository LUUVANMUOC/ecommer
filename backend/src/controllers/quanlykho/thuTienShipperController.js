const ThuTienShipperService = require('../../services/quanlykho/thuTienShipperService');

const ThuTienShipperController = {
  getDonChuaNop: async (req, res) => {
    try {
      const data = await ThuTienShipperService.getDonChuaNop(req.params.kho_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  xacNhanThuTien: async (req, res) => {
    try {
      const { ds_dts_ma } = req.body;
      await ThuTienShipperService.xacNhanThuTien(ds_dts_ma);
      res.status(200).json({ message: "Xác nhận thu tiền thành công!" });
    } catch (error) { res.status(400).json({ message: error.message }); }
  }
};

module.exports = ThuTienShipperController;