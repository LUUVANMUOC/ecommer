const ThanhToanVanChuyenService = require('../../services/san/thanhToanVanChuyenService');

const parseNam = (value) => {
  if (value === undefined) return new Date().getFullYear();
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

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
      const { dts_ma_list } = req.body; 
      const result = await ThanhToanVanChuyenService.taoPhieuChi(req.params.dvvc_ma, dts_ma_list);
      const thongTinNganHang = await ThanhToanVanChuyenService.getBankInfo(req.params.dvvc_ma);
      res.status(200).json({ ...result, thongTinNganHang });
    } catch (error) { 
      res.status(400).json({ message: error.message }); 
    }
  },

  // 🔴 CHÚ Ý: Hàm này phải nằm trong object, có dấu phẩy ngăn cách với hàm trên
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

  getLichSuAdmin: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.getLichSuAdmin()); }
    catch (error) {
      console.error('Lỗi lịch sử admin:', error);
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
  },

  getDanhMuc: async (req, res) => {
    try { res.status(200).json(await ThanhToanVanChuyenService.getDanhMuc()); }
    catch (error) { res.status(500).json({ message: error.message }); }
  },

  getTongQuan: async (req, res) => {
    try {
      const { dvvc_ma, nam, thang } = req.query;
      const data = await ThanhToanVanChuyenService.getTongQuan({
        dvvc_ma: dvvc_ma || null,
        nam: parseNam(nam),
        thang: thang ? Number(thang) : null,
      });
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi tổng quan thanh toán vận chuyển:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getDanhSachPhieu: async (req, res) => {
    try {
      const { dvvc_ma, nam, thang, trang_thai, q, page, limit } = req.query;
      const data = await ThanhToanVanChuyenService.getDanhSachPhieu({
        dvvc_ma: dvvc_ma || null,
        nam: parseNam(nam),
        thang: thang ? Number(thang) : null,
        trang_thai: trang_thai || null,
        q: q || null,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi danh sách phiếu chi ĐVVC:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getPhieuChiTiet: async (req, res) => {
    try {
      const data = await ThanhToanVanChuyenService.getPhieuChiTiet(req.params.pcd_ma);
      if (!data) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu chi' });
      }
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

// 🔴 Đảm bảo xuất đúng object ra ngoài
module.exports = ThanhToanVanChuyenController;