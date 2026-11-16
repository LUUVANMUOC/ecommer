const ThanhToanVanChuyenModel = require('../../models/san/thanhToanVanChuyenModel');
const ThanhToanVanChuyenThongKeModel = require('../../models/san/thanhToanVanChuyenThongKeModel');

const ThanhToanVanChuyenService = {
  getDanhSachNo: async () => await ThanhToanVanChuyenModel.getDanhSachNo(),
  getChiTietNo: async (dvvc_ma) => await ThanhToanVanChuyenModel.getChiTietNo(dvvc_ma),
  taoPhieuChi: async (dvvc_ma, dts_ma_list) => await ThanhToanVanChuyenModel.taoPhieuChi(dvvc_ma, dts_ma_list),
  getBankInfo: async (dvvc_ma) => await ThanhToanVanChuyenModel.getBankInfo(dvvc_ma),
  huyPhieuChi: async (pcd_ma) => await ThanhToanVanChuyenModel.huyPhieuChi(pcd_ma),

  // 🟢 Các hàm lịch sử
  getLichSuAdmin: async () => await ThanhToanVanChuyenModel.getLichSuAdmin(),
  getLichSuDVVC: async (dvvc_ma) => await ThanhToanVanChuyenModel.getLichSuDVVC(dvvc_ma),
  getChiTietLichSu: async (pcd_ma) => await ThanhToanVanChuyenModel.getChiTietLichSu(pcd_ma),
  checkTrangThai: async (pcd_ma) => await ThanhToanVanChuyenModel.checkTrangThai(pcd_ma),

  // 🟢 Thống kê trang Admin
  getDanhMuc: async () => await ThanhToanVanChuyenThongKeModel.getDanhMuc(),
  getTongQuan: async (filters) => await ThanhToanVanChuyenThongKeModel.getTongQuan(filters),
  getDanhSachPhieu: async (filters) => await ThanhToanVanChuyenThongKeModel.getDanhSachPhieu(filters),
  getPhieuChiTiet: async (pcd_ma) => await ThanhToanVanChuyenThongKeModel.getPhieuChiTiet(pcd_ma),
};

module.exports = ThanhToanVanChuyenService;