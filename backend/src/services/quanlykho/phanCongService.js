const QLKPhanCongModel = require('../../models/quanlykho/phanCongModel');

const QLKPhanCongService = {
  getPendingOrders: async (kho_ma) => {
    return await QLKPhanCongModel.getPendingOrders(kho_ma);
  },

  getShippersByKho: async (kho_ma) => {
    return await QLKPhanCongModel.getShippersByKho(kho_ma);
  },

  assignShipper: async (dts_ma, shipper_ma) => {
    if (!dts_ma || !shipper_ma) throw new Error("Thiếu thông tin phân công!");
    return await QLKPhanCongModel.assignShipper(dts_ma, shipper_ma);
  }
};

module.exports = QLKPhanCongService;