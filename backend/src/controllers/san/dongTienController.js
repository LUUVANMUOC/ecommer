// backend/src/controllers/san/dongTienController.js
const DongTienService = require('../../services/san/dongTienService');

// Chuẩn hóa bộ lọc: năm/tháng -> khoảng ngày cụ thể
const chuanHoaKhoangNgay = (q) => {
  const now = new Date();
  const nam = Number(q.nam) || now.getFullYear();
  const thang = q.thang ? Number(q.thang) : null;

  let tu_ngay = q.tu_ngay || null;
  let den_ngay = q.den_ngay || null;

  if (!tu_ngay || !den_ngay) {
    if (thang && thang >= 1 && thang <= 12) {
      const ngayCuoi = new Date(nam, thang, 0).getDate();
      const mm = String(thang).padStart(2, '0');
      tu_ngay = `${nam}-${mm}-01`;
      den_ngay = `${nam}-${mm}-${String(ngayCuoi).padStart(2, '0')}`;
    } else {
      tu_ngay = `${nam}-01-01`;
      den_ngay = `${nam}-12-31`;
    }
  }

  return { nam, thang, tu_ngay, den_ngay, kho_ma: q.kho_ma || null };
};

const DongTienController = {
  // ================= API CŨ =================
  getDongTienAdmin: async (req, res) => {
    try {
      const data = await DongTienService.getDongTienAdmin();
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi Controller Dòng Tiền Admin:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu dòng tiền.' });
    }
  },

  getDongTienShop: async (req, res) => {
    try {
      const data = await DongTienService.getDongTienShop(req.params.gh_ma);
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi Controller Dòng Tiền Shop:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu dòng tiền.' });
    }
  },

  // ================= THỐNG KÊ DÒNG TIỀN KHO =================
  getDanhMucDongTien: async (req, res) => {
    try {
      const data = await DongTienService.getDanhMuc();
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy danh mục dòng tiền:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh mục dòng tiền.' });
    }
  },

  getTongQuanDongTien: async (req, res) => {
    try {
      const filters = chuanHoaKhoangNgay(req.query);
      const data = await DongTienService.getTongQuan(filters);
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy tổng quan dòng tiền:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy tổng quan dòng tiền.' });
    }
  },

  getGiaoDichDongTien: async (req, res) => {
    try {
      const filters = chuanHoaKhoangNgay(req.query);
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));

      const data = await DongTienService.getGiaoDich({
        ...filters,
        trang_thai: req.query.trang_thai || null,
        q: req.query.q ? String(req.query.q).trim() : null,
        page,
        limit,
      });

      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy danh sách giao dịch:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách giao dịch.' });
    }
  },

  getPhieuChiTietDongTien: async (req, res) => {
    try {
      const data = await DongTienService.getPhieuChiTiet(req.params.ptt_ma);
      if (!data) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu tất toán.' });
      }
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy chi tiết phiếu tất toán:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy chi tiết phiếu tất toán.' });
    }
  },

  // ================= THỐNG KÊ DOANH THU SÀN =================
  getDanhMucDoanhThuSan: async (req, res) => {
    try {
      const data = await DongTienService.getDanhMucDoanhThuSan();
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy danh mục doanh thu sàn:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh mục doanh thu sàn.' });
    }
  },

  getTongQuanDoanhThuSan: async (req, res) => {
    try {
      const filters = chuanHoaKhoangNgay(req.query);
      const data = await DongTienService.getTongQuanDoanhThuSan(filters);
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy tổng quan doanh thu sàn:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy tổng quan doanh thu sàn.' });
    }
  },

  getGiaoDichDoanhThuSan: async (req, res) => {
    try {
      const filters = chuanHoaKhoangNgay(req.query);
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));

      const data = await DongTienService.getGiaoDichDoanhThuSan({
        ...filters,
        trang_thai: req.query.trang_thai || null,
        q: req.query.q ? String(req.query.q).trim() : null,
        page,
        limit,
      });

      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy danh sách giao dịch doanh thu sàn:', error);
      res
        .status(500)
        .json({ message: 'Lỗi server khi lấy danh sách giao dịch doanh thu sàn.' });
    }
  },

  getPhieuChiTietDoanhThuSan: async (req, res) => {
    try {
      const data = await DongTienService.getPhieuChiTietDoanhThuSan(
        req.params.ptt_ma
      );
      if (!data) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu tất toán.' });
      }
      res.status(200).json(data);
    } catch (error) {
      console.error('Lỗi lấy chi tiết phiếu doanh thu sàn:', error);
      res
        .status(500)
        .json({ message: 'Lỗi server khi lấy chi tiết phiếu doanh thu sàn.' });
    }
  },
};

module.exports = DongTienController;