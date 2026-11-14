// backend/src/models/gianhang/thongKeShopModel.js
// Thống kê doanh thu cho MỘT shop.
// Dùng lại toàn bộ logic của models/san/thongKeNganhHangModel.js,
// chỉ khóa cứng gh_ma để shop không xem được dữ liệu shop khác.
const pool = require('../../config/db');
const ThongKe = require('../san/thongKeNganhHangModel');

const TZ = 'Asia/Ho_Chi_Minh';
const namHienTai = () => new Date().getFullYear();

const thongKeShopModel = {
  // =========================================================
  // DANH MỤC RIÊNG CỦA SHOP
  //  - Ngành hàng: toàn bộ cây (dữ liệu dùng chung)
  //  - Thương hiệu: chỉ thương hiệu có sản phẩm của shop
  //  - Năm: chỉ năm có đơn hoàn thành của shop
  // =========================================================
  getDanhMuc: async (gh_ma) => {
    const [nhRes, thRes, namRes] = await Promise.all([
      pool.query(
        `SELECT nh_ma, nh_ten, nh_cha FROM nganhhang ORDER BY nh_ten ASC`
      ),
      pool.query(
        `SELECT DISTINCT th.th_ma, th.th_ten
         FROM thuonghieu th
         JOIN sanpham sp ON sp.th_ma = th.th_ma
         WHERE sp.gh_ma = $1
         ORDER BY th.th_ten ASC`,
        [gh_ma]
      ),
      pool.query(
        `SELECT DISTINCT
                EXTRACT(YEAR FROM ht.hoan_tat_luc AT TIME ZONE '${TZ}')::int AS nam
         FROM donhangtheoshop o
         JOIN LATERAL (
           SELECT c.ttdh_ma, c.ctttdh_thoidiem AS hoan_tat_luc
           FROM chitiettrangthaidonhang c
           WHERE c.dts_ma = o.dts_ma
           ORDER BY c.ctttdh_thoidiem DESC
           LIMIT 1
         ) ht ON true
         WHERE o.gh_ma = $1
           AND ht.ttdh_ma = 'TTDH05'
           AND ht.hoan_tat_luc IS NOT NULL
         ORDER BY nam DESC`,
        [gh_ma]
      ),
    ]);

    const namData = namRes.rows
      .map((r) => Number(r.nam))
      .filter((n) => n > 0);

    const namMacDinh = namData.length ? Math.max(...namData) : namHienTai();

    return {
      nganh_hang: nhRes.rows,
      thuong_hieu: thRes.rows,
      nam: namData.sort((a, b) => b - a),
      nam_mac_dinh: namMacDinh,
      nam_hien_tai: namHienTai(),
    };
  },

  // =========================================================
  // CÁC HÀM THỐNG KÊ (gh_ma luôn bị ghi đè)
  // =========================================================
  getTongQuan: (p = {}) => ThongKe.getTongQuan({ ...p, gh_ma: p.gh_ma }),

  getTheoDanhMuc: (p = {}) =>
    ThongKe.getTheoNganh({ ...p, gh_ma: p.gh_ma }),

  getTheoThuongHieu: (p = {}) =>
    ThongKe.getTheoThuongHieu({ ...p, gh_ma: p.gh_ma }),

  getTheoSanPham: (p = {}) =>
    ThongKe.getTheoSanPham({ ...p, gh_ma: p.gh_ma }),
};

module.exports = thongKeShopModel;