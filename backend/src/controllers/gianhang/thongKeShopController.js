// backend/src/controllers/gianhang/thongKeShopController.js
const Model = require('../../models/gianhang/thongKeShopModel');

const namHienTai = () => new Date().getFullYear();

const layPhamVi = (req) => {
  const { nh_ma, th_ma, nam, thang } = req.query;
  const m = Number(thang);

  return {
    gh_ma: req.params.gh_ma,
    nh_ma: nh_ma || null,
    th_ma: th_ma || null,
    nam: Number(nam) || namHienTai(),
    thang: m >= 1 && m <= 12 ? m : null,
  };
};

const loi = (res, e, ten) => {
  console.error(`Lỗi ${ten}:`, e);
  res.status(500).json({ message: e.message });
};

const ThongKeShopController = {
  getDanhMuc: async (req, res) => {
    try {
      res.status(200).json(await Model.getDanhMuc(req.params.gh_ma));
    } catch (e) {
      loi(res, e, 'danh mục thống kê doanh thu shop');
    }
  },

  getTongQuan: async (req, res) => {
    try {
      res.status(200).json(await Model.getTongQuan(layPhamVi(req)));
    } catch (e) {
      loi(res, e, 'tổng quan thống kê doanh thu shop');
    }
  },

  getTheoDanhMuc: async (req, res) => {
    try {
      res.status(200).json(await Model.getTheoDanhMuc(layPhamVi(req)));
    } catch (e) {
      loi(res, e, 'thống kê doanh thu theo danh mục');
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
      loi(res, e, 'thống kê doanh thu theo thương hiệu');
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
      loi(res, e, 'thống kê doanh thu theo sản phẩm');
    }
  },
};

module.exports = ThongKeShopController;