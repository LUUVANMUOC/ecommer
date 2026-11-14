// backend/src/controllers/san/thongKeNganhHangController.js
const Model = require('../../models/san/thongKeNganhHangModel');

const namHienTai = () => new Date().getFullYear();

const layPhamVi = (req) => {
  const { nh_ma, gh_ma, th_ma, nam, thang } = req.query;
  const m = Number(thang);

  return {
    nh_ma: nh_ma || null,
    gh_ma: gh_ma || null,
    th_ma: th_ma || null,
    nam: Number(nam) || namHienTai(),
    thang: m >= 1 && m <= 12 ? m : null,
  };
};

const loi = (res, e, ten) => {
  console.error(`Lỗi ${ten}:`, e);
  res.status(500).json({ message: e.message });
};

const ThongKeNganhHangController = {
  getDanhMuc: async (req, res) => {
    try {
      res.status(200).json(await Model.getDanhMuc());
    } catch (e) {
      loi(res, e, 'danh mục thống kê ngành hàng');
    }
  },

  getTongQuan: async (req, res) => {
    try {
      res.status(200).json(await Model.getTongQuan(layPhamVi(req)));
    } catch (e) {
      loi(res, e, 'tổng quan thống kê ngành hàng');
    }
  },

  getTheoNganh: async (req, res) => {
    try {
      res.status(200).json(await Model.getTheoNganh(layPhamVi(req)));
    } catch (e) {
      loi(res, e, 'thống kê theo ngành hàng');
    }
  },

  getTheoThuongHieu: async (req, res) => {
    try {
      const { q, page, limit } = req.query;
      res.status(200).json(
        await Model.getTheoThuongHieu({
          ...layPhamVi(req),
          q: q || null,
          page: Number(page) || 1,
          limit: Number(limit) || 10,
        })
      );
    } catch (e) {
      loi(res, e, 'thống kê theo thương hiệu');
    }
  },

  getTheoShop: async (req, res) => {
    try {
      const { q, page, limit } = req.query;
      res.status(200).json(
        await Model.getTheoShop({
          ...layPhamVi(req),
          q: q || null,
          page: Number(page) || 1,
          limit: Number(limit) || 10,
        })
      );
    } catch (e) {
      loi(res, e, 'thống kê theo shop');
    }
  },

  getTheoSanPham: async (req, res) => {
    try {
      const { q, sort, page, limit } = req.query;

      // limit = 0 hoặc "all" → lấy toàn bộ
      const rawLimit =
        limit === undefined || limit === '' || limit === 'all'
          ? limit === 'all'
            ? 0
            : 10
          : Number(limit);

      res.status(200).json(
        await Model.getTheoSanPham({
          ...layPhamVi(req),
          q: q || null,
          sort: sort === 'so_luong' ? 'so_luong' : 'doanh_thu',
          page: Number(page) || 1,
          limit: Number.isFinite(rawLimit) ? rawLimit : 10,
        })
      );
    } catch (e) {
      loi(res, e, 'thống kê theo sản phẩm');
    }
  },

  getShopThoiGian: async (req, res) => {
    try {
      const { che_do } = req.query;
      res.status(200).json(
        await Model.getShopThoiGian({
          ...layPhamVi(req),
          che_do: che_do === 'nam' ? 'nam' : 'thang',
        })
      );
    } catch (e) {
      loi(res, e, 'thống kê shop theo thời gian');
    }
  },
};

module.exports = ThongKeNganhHangController;