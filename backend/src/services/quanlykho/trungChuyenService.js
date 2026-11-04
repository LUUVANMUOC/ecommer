const TrungChuyenModel = require('../../models/quanlykho/trungChuyenModel');

const TrungChuyenService = {
  getDonChoGui: async (kho_di_ma) => {
    return await TrungChuyenModel.getDonChoGui(kho_di_ma);
  },

  getShippersLSP02: async (kho_di_ma) => {
    return await TrungChuyenModel.getShippersLSP02(kho_di_ma);
  },

  guiTrungChuyen: async (data) => {
    if (!data.dts_ma || !data.shipper_trungchuyen_ma) {
      throw new Error("Thiếu thông tin gửi trung chuyển!");
    }
    return await TrungChuyenModel.guiTrungChuyen(data);
  },

  getDonChoNhan: async (kho_den_ma) => {
    return await TrungChuyenModel.getDonChoNhan(kho_den_ma);
  },

  nhanHang: async (dts_ma, kho_den_ma) => {
    const result = await TrungChuyenModel.nhanHang(dts_ma, kho_den_ma);
    if (!result) {
      throw new Error("Đơn hàng không tồn tại hoặc đã được nhận trước đó!");
    }
    return result;
  }
};

module.exports = TrungChuyenService;