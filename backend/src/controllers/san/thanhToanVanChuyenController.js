const ThanhToanVanChuyenService = require('../../services/san/thanhToanVanChuyenService');

const ThanhToanVanChuyenController = {
  getDanhSachNo: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.getDanhSachNo()); } 
    catch (error) { res.status(500).json({ message: error.message }); }
  },

  getChiTietNo: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.getChiTietNo(req.params.dvvc_ma)); } 
    catch (error) { res.status(500).json({ message: error.message }); }
  },

  taoPhieuChi: async (req, res) => {
    try {
      const result = await ThanhToanVanChuyenService.taoPhieuChi(req.params.dvvc_ma);
      const thongTinNganHang = await ThanhToanVanChuyenService.getBankInfo(req.params.dvvc_ma);
      res.status(200).json({ ...result, thongTinNganHang });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  huyPhieuChi: async (req, res) => {
    try {
      await ThanhToanVanChuyenService.huyPhieuChi(req.params.pcd_ma);
      res.status(200).json({ message: 'Đã hủy phiếu chi thành công!' });
    } catch (error) { res.status(400).json({ message: error.message }); }
  },

  checkTrangThai: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.checkTrangThai(req.params.pcd_ma)); } 
    catch (error) { res.status(500).json({ message: error.message }); }
  },

  // 🟢 Các hàm lịch sử
  getLichSuAdmin: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.getLichSuAdmin()); } 
    catch (error) { 
      console.error("Lỗi lịch sử admin:", error);
      res.status(500).json({ message: error.message }); 
    }
  },

  getLichSuDVVC: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.getLichSuDVVC(req.params.dvvc_ma)); } 
    catch (error) { res.status(500).json({ message: error.message }); }
  },

  getChiTietLichSu: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.getChiTietLichSu(req.params.pcd_ma)); } 
    catch (error) { res.status(500).json({ message: error.message }); }
  }
};

module.exports = ThanhToanVanChuyenController;