const DonHangModel = require('../../models/khachhang/donHangModel');

const DonHangController = {
  getMyOrders: async (req, res) => {
    try {
      const data = await DonHangModel.getOrdersByCustomer(req.params.kh_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },
  cancelOrder: async (req, res) => {
    try {
      const result = await DonHangModel.cancelOrder(req.params.dts_ma);
      res.status(200).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
  // ⭐ Thêm 2 hàm mới
  xacNhanDaNhanHang: async (req, res) => {
    try {
      const result = await DonHangModel.xacNhanDaNhanHang(req.params.dts_ma);
      res.status(200).json(result);
    } catch (error) { res.status(400).json({ message: error.message }); }
  },
    guiDanhGia: async (req, res) => {
    try {
      // 🟢 Bổ sung thêm 3 trường shipper_...
      const { dts_ma, kh_ma, ctsp_ma, sao, mota, shipper_ma, shipper_sao, shipper_mota } = req.body;
      
      let arrImages = [];
      if (req.files && req.files.length > 0) {
        arrImages = req.files.map(f => `/uploads/danhgia/${f.filename}`);
      }
      const hinhanhStr = arrImages.length > 0 ? JSON.stringify(arrImages) : null;

      // Đóng gói shipperData để truyền xuống Model
      const shipperData = shipper_ma ? {
        shipper_ma: shipper_ma,
        shipper_sao: Number(shipper_sao),
        shipper_mota: shipper_mota
      } : null;

      // Gọi Model (truyền thêm shipperData)
      const result = await DonHangModel.guiDanhGia(dts_ma, kh_ma, ctsp_ma, sao, mota, hinhanhStr, shipperData);
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Lỗi lưu đánh giá:", error);
      res.status(400).json({ message: error.message });
    }
  }
};
module.exports = DonHangController;