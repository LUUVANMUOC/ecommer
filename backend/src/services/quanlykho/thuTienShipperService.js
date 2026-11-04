const ThuTienShipperModel = require('../../models/quanlykho/thuTienShipperModel');

const ThuTienShipperService = {
  getDonChuaNop: async (kho_ma) => {
    return await ThuTienShipperModel.getDonChuaNop(kho_ma);
  },
  xacNhanThuTien: async (ds_dts_ma) => {
    if (!ds_dts_ma || ds_dts_ma.length === 0) throw new Error("Chưa chọn đơn hàng nào!");
    return await ThuTienShipperModel.xacNhanThuTien(ds_dts_ma);
  }
};

module.exports = ThuTienShipperService;