const PhanCongModel = require('../../models/dvvc/phanCongModel');

const PhanCongService = {
  getPendingOrders: async (dvvc_ma) => {
    return await PhanCongModel.getPendingOrders(dvvc_ma);
  },

  getShippersByKho: async (kho_ma) => {
    return await PhanCongModel.getShippersByKho(kho_ma);
  },

  assignShipper: async (dts_ma, shipper_ma) => {
    if (!dts_ma || !shipper_ma) throw new Error("Thiếu thông tin phân công!");
    return await PhanCongModel.assignShipper(dts_ma, shipper_ma);
  }
};

module.exports = PhanCongService;