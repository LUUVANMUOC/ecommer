const TatToanModel = require('../../models/quanlykho/tatToanModel');

const TatToanService = {
  getDuLieuTatToan: async (kho_ma) => await TatToanModel.getDuLieuTatToan(kho_ma),
  xacNhanTatToan: async (kho_ma, data) => await TatToanModel.xacNhanTatToan(kho_ma, data),
  taoPhieuVaQr: async (kho_ma, data) => await TatToanModel.taoPhieuVaQr(kho_ma, data),

  // Tất toán cước vận chuyển còn tồn (đơn đã trả Shop/Sàn nhưng chưa trả ĐVVC)
  getDuLieuCuocTon: async (kho_ma) => await TatToanModel.getDuLieuCuocTon(kho_ma),
  taoPhieuCuocTon: async (kho_ma, data) => await TatToanModel.taoPhieuCuocTon(kho_ma, data),
};

module.exports = TatToanService;
