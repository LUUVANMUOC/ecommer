const ThanhToanVanChuyenModel = require('../../models/san/thanhToanVanChuyenModel');

const ThanhToanVanChuyenService = {
  getDanhSachNo: async () => await ThanhToanVanChuyenModel.getDanhSachNo(),
  getChiTietNo: async (dvvc_ma) => await ThanhToanVanChuyenModel.getChiTietNo(dvvc_ma),
  taoPhieuChi: async (dvvc_ma) => await ThanhToanVanChuyenModel.taoPhieuChi(dvvc_ma),
  getBankInfo: async (dvvc_ma) => await ThanhToanVanChuyenModel.getBankInfo(dvvc_ma),
  huyPhieuChi: async (pcd_ma) => await ThanhToanVanChuyenModel.huyPhieuChi(pcd_ma),
  
  // 🟢 Các hàm lịch sử
  getLichSuAdmin: async () => await ThanhToanVanChuyenModel.getLichSuAdmin(),
  getLichSuDVVC: async (dvvc_ma) => await ThanhToanVanChuyenModel.getLichSuDVVC(dvvc_ma),
  getChiTietLichSu: async (pcd_ma) => await ThanhToanVanChuyenModel.getChiTietLichSu(pcd_ma),
  checkTrangThai: async (pcd_ma) => await ThanhToanVanChuyenModel.checkTrangThai(pcd_ma)
};

module.exports = ThanhToanVanChuyenService;