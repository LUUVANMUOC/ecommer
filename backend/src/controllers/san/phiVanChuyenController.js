const PhiVanChuyenModel = require('../../models/san/phiVanChuyenModel');
const PhiVanChuyenThongKeModel = require('../../models/san/phiVanChuyenThongKeModel');

const PhiVanChuyenController = {
  getAdmin: async (req, res) => {
    try {
      const data = await PhiVanChuyenModel.getDanhSachPhiVanChuyen('ADMIN');
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getDVVC: async (req, res) => {
    try {
      const data = await PhiVanChuyenModel.getDanhSachPhiVanChuyen('DVVC', req.params.dvvc_ma);
      res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  // ================= THỐNG KÊ =================
  getDanhMuc: async (req, res) => {
    try { res.status(200).json(await PhiVanChuyenThongKeModel.getDanhMuc()); }
    catch (error) { res.status(500).json({ message: error.message }); }
  },

  getTongQuan: async (req, res) => {
    try {
      const { dvvc_ma, nam, thang } = req.query;
      const data = await PhiVanChuyenThongKeModel.getTongQuan({
        dvvc_ma: dvvc_ma || null,
        nam: Number(nam) || new Date().getFullYear(),
        thang: thang ? Number(thang) : null,
      });
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi tổng quan phí vận chuyển:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getDanhSach: async (req, res) => {
    try {
      const { dvvc_ma, nam, thang, trang_thai, q, page, limit } = req.query;
      const data = await PhiVanChuyenThongKeModel.getDanhSach({
        dvvc_ma: dvvc_ma || null,
        nam: Number(nam) || new Date().getFullYear(),
        thang: thang ? Number(thang) : null,
        trang_thai: trang_thai || null,
        q: q || null,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi danh sách phí vận chuyển:', error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = PhiVanChuyenController;