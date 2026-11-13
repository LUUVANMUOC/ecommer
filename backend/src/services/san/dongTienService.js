// backend/src/services/san/dongTienService.js
const DongTienModel = require('../../models/san/dongTienModel');
const DongTienThongKeModel = require('../../models/san/dongTienThongKeModel');

const DongTienService = {
  // ---- API cũ (giữ nguyên để không phá trang khác) ----
  getDongTienAdmin: async () => await DongTienModel.getDongTienAdmin(),
  getDongTienShop: async (gh_ma) => await DongTienModel.getDongTienShop(gh_ma),

  // ---- API thống kê mới ----
  getDanhMuc: () => DongTienThongKeModel.getDanhMuc(),
  getTongQuan: (f) => DongTienThongKeModel.getTongQuan(f),
  getGiaoDich: (f) => DongTienThongKeModel.getGiaoDich(f),
  getPhieuChiTiet: (ptt_ma) => DongTienThongKeModel.getPhieuChiTiet(ptt_ma),
};

module.exports = DongTienService;