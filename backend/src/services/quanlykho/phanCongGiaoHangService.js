const PhanCongGiaoHangModel = require('../../models/quanlykho/phanCongGiaoHangModel');

const PhanCongGiaoHangService = {
  getDonChoPhanCong: async (kho_ma) => {
    return await PhanCongGiaoHangModel.getDonChoPhanCong(kho_ma);
  },

  getShippersLSP03: async (kho_ma) => {
    return await PhanCongGiaoHangModel.getShippersLSP03(kho_ma);
  },

  phanCongGiaoHang: async (dts_ma, shipper_ma) => {
    if (!dts_ma || !shipper_ma) throw new Error("Thiếu thông tin phân công!");
    return await PhanCongGiaoHangModel.phanCongGiaoHang(dts_ma, shipper_ma);
  }
};

module.exports = PhanCongGiaoHangService;