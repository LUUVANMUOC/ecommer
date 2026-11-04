const ShipperTrungChuyenModel = require('../../models/shipper/trungChuyenModel');

const ShipperTrungChuyenService = {
  getDonDangTrungChuyen: async (shipper_ma) => {
    return await ShipperTrungChuyenModel.getDonDangTrungChuyen(shipper_ma);
  },

  getLichSu: async (shipper_ma) => {
    return await ShipperTrungChuyenModel.getLichSu(shipper_ma);
  },

  giaoHangToiKho: async (dts_ma, shipper_ma, file, ghichu) => {
    if (!file) throw new Error("Bắt buộc phải có ảnh minh chứng giao tới kho!");
    const hinhanhPath = `/uploads/trungchuyen/${file.filename}`;
    
    const result = await ShipperTrungChuyenModel.giaoHangToiKho(dts_ma, shipper_ma, hinhanhPath, ghichu);
    if (!result) throw new Error("Đơn hàng không tồn tại hoặc đã được giao rồi!");
    return result;
  }
};

module.exports = ShipperTrungChuyenService;