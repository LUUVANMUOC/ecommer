const GiaoHangModel = require('../../models/shipper/giaoHangModel');

const GiaoHangService = {
  getDonCanGiao: async (shipper_ma) => {
    return await GiaoHangModel.getDonCanGiao(shipper_ma);
  },

  giaoHang: async (dts_ma, shipper_ma, file, ghichu) => {
    // ✅ Bắt buộc phải có ảnh minh chứng khi giao hàng
    if (!file) {
      throw new Error("Bắt buộc phải chụp ảnh minh chứng giao hàng!");
    }
    const hinhanhPath = `/uploads/giaohang/${file.filename}`;
    
    return await GiaoHangModel.giaoHangThanhCong(dts_ma, shipper_ma, hinhanhPath, ghichu);
  },
  getLichSu: async (shipper_ma) => {
    return await GiaoHangModel.getLichSu(shipper_ma);
  },
};

module.exports = GiaoHangService;