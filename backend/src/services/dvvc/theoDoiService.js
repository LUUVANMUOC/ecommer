const TheoDoiModel = require('../../models/dvvc/theoDoiModel');

const TheoDoiService = {
  getDanhSach: async (dvvc_ma, trangthai, kho_ma, search) => {
    return await TheoDoiModel.getDanhSach(dvvc_ma, trangthai, kho_ma, search);
  },
  getChiTiet: async (dts_ma) => {
    const data = await TheoDoiModel.getChiTiet(dts_ma);
    if (!data) throw new Error("Không tìm thấy đơn hàng!");
    return data;
  }
};

module.exports = TheoDoiService;