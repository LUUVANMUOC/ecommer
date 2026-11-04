const TatToanModel = require('../../models/quanlykho/tatToanModel');

const TatToanService = {
  getDuLieuTatToan: async (kho_ma) => await TatToanModel.getDuLieuTatToan(kho_ma),
  xacNhanTatToan: async (kho_ma, data) => await TatToanModel.xacNhanTatToan(kho_ma, data),
  
  // Thêm hàm này (gọi đến hàm đã viết trong Model)
  taoPhieuVaQr: async (kho_ma, data) => await TatToanModel.taoPhieuVaQr(kho_ma, data)
};

module.exports = TatToanService;