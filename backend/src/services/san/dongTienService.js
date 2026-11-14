// backend/src/services/san/dongTienService.js
const DongTienModel = require('../../models/san/dongTienModel');
const DongTienThongKeModel = require('../../models/san/dongTienThongKeModel');
const DoanhThuSanThongKeModel = require('../../models/san/doanhThuSanThongKeModel');

const DongTienService = {
  // ---- API cũ (giữ nguyên để không phá trang khác) ----
  getDongTienAdmin: async () => await DongTienModel.getDongTienAdmin(),
  getDongTienShop: async (gh_ma) => await DongTienModel.getDongTienShop(gh_ma),

  // ---- Thống kê dòng tiền kho (dùng cho trang Vận chuyển & dòng tiền kho) ----
  getDanhMuc: () => DongTienThongKeModel.getDanhMuc(),
  getTongQuan: (f) => DongTienThongKeModel.getTongQuan(f),
  getGiaoDich: (f) => DongTienThongKeModel.getGiaoDich(f),
  getPhieuChiTiet: (ptt_ma) => DongTienThongKeModel.getPhieuChiTiet(ptt_ma),

  // ---- Thống kê doanh thu sàn (dùng cho trang Doanh thu sàn) ----
  getDanhMucDoanhThuSan: () => DoanhThuSanThongKeModel.getDanhMuc(),
  getTongQuanDoanhThuSan: (f) => DoanhThuSanThongKeModel.getTongQuan(f),
  getGiaoDichDoanhThuSan: (f) => DoanhThuSanThongKeModel.getGiaoDich(f),
  getPhieuChiTietDoanhThuSan: (ptt_ma) =>
    DoanhThuSanThongKeModel.getPhieuChiTiet(ptt_ma),
};

module.exports = DongTienService;