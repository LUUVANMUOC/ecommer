// backend/src/models/san/publicNoiBatModel.js
// 3 khối "nổi bật" cho trang công khai /san-pham:
//   1. Top thương hiệu theo doanh thu 90 ngày gần nhất (đơn TTDH05)
//   2. Top gian hàng theo gh_danhgia
//   3. Top voucher shop đang hiệu lực theo mức giảm tối đa
const pool = require('../../config/db');

const SO_NGAY_DOANH_THU = 90;

const PublicNoiBatModel = {
  // =========================================================
  // 1. TOP THƯƠNG HIỆU THEO DOANH THU
  //    Doanh thu = SUM(ctdh_thanhtien) của đơn hoàn thành (TTDH05)
  //    Mốc thời gian = ctttdh_thoidiem của trạng thái TTDH05
  // =========================================================
  getTopThuongHieu: async (limit = 10) => {
    const query = `
      WITH don_ht AS (
        SELECT o.dts_ma
        FROM donhangtheoshop o
        JOIN LATERAL (
          SELECT c.ttdh_ma, c.ctttdh_thoidiem AS hoan_tat_luc
          FROM chitiettrangthaidonhang c
          WHERE c.dts_ma = o.dts_ma
          ORDER BY c.ctttdh_thoidiem DESC
          LIMIT 1
        ) ht ON true
        WHERE ht.ttdh_ma = 'TTDH05'
          AND ht.hoan_tat_luc >= NOW() - ($1::int * INTERVAL '1 day')
      ),
      ban_hang AS (
        SELECT sp.th_ma,
               SUM(ctdh.ctdh_thanhtien) AS doanh_thu,
               SUM(ctdh.ctdh_soluong) AS so_luong,
               COUNT(DISTINCT d.dts_ma) AS so_don
        FROM don_ht d
        JOIN chitietdonhang ctdh ON ctdh.dts_ma = d.dts_ma
        JOIN chitietsanpham ctsp ON ctsp.ctsp_ma = ctdh.ctsp_ma
        JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
        WHERE sp.th_ma IS NOT NULL
        GROUP BY sp.th_ma
      )
      SELECT
        th.th_ma,
        th.th_ten,
        th.th_hinhanh,
        b.doanh_thu,
        b.so_luong,
        b.so_don,
        (SELECT COUNT(*) FROM sanpham s WHERE s.th_ma = th.th_ma) AS so_san_pham
      FROM ban_hang b
      JOIN thuonghieu th ON th.th_ma = b.th_ma
      ORDER BY b.doanh_thu DESC, b.so_don DESC, th.th_ten ASC
      LIMIT $2
    `;
    const { rows } = await pool.query(query, [SO_NGAY_DOANH_THU, limit]);
    return rows;
  },

  // =========================================================
  // 2. TOP GIAN HÀNG THEO ĐIỂM ĐÁNH GIÁ (gh_danhgia)
  // =========================================================
  getTopGianHang: async (limit = 10) => {
    const query = `
      SELECT
        gh.gh_ma,
        gh.gh_ten,
        gh.gh_hinhanh,
        gh.gh_mota,
        COALESCE(gh.gh_danhgia, 0)::float AS gh_danhgia,
        COALESCE(gh.gh_theodoi, 0) AS gh_theodoi,
        (SELECT COUNT(*) FROM sanpham s WHERE s.gh_ma = gh.gh_ma) AS so_san_pham
      FROM gianhang gh
      ORDER BY COALESCE(gh.gh_danhgia, 0) DESC,
               COALESCE(gh.gh_theodoi, 0) DESC,
               gh.gh_ten ASC
      LIMIT $1
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  },

  // =========================================================
  // 3. TOP VOUCHER SHOP ĐANG HIỆU LỰC
  //    Chỉ lấy: trangthai = true, còn số lượng, trong thời gian
  // =========================================================
  getTopVoucher: async (limit = 10) => {
    const query = `
      SELECT
        m.mgg_shop_ma,
        m.mgg_shop_ten,
        m.mgg_shop_hinhanh,
        m.mgg_shop_phantramgiam,
        m.mgg_shop_sotiengiamtoidamoilan,
        m.mgg_shop_giatridontoithieu,
        m.mgg_shop_soluongconlai,
        m.mgg_shop_soluongbandau,
        m.mgg_shop_thoidiembatdau,
        m.mgg_shop_thoidiemketthuc,
        gh.gh_ma,
        gh.gh_ten,
        gh.gh_hinhanh
      FROM magiamgia_shop m
      JOIN gianhang gh ON gh.gh_ma = m.gh_ma
      WHERE COALESCE(m.mgg_shop_trangthai, false) = true
        AND COALESCE(m.mgg_shop_soluongconlai, 0) > 0
        AND (m.mgg_shop_thoidiembatdau IS NULL OR m.mgg_shop_thoidiembatdau <= NOW())
        AND (m.mgg_shop_thoidiemketthuc IS NULL OR m.mgg_shop_thoidiemketthuc >= NOW())
      ORDER BY COALESCE(m.mgg_shop_sotiengiamtoidamoilan, 0) DESC,
               COALESCE(m.mgg_shop_phantramgiam, 0) DESC
      LIMIT $1
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  },

  getNoiBat: async (limit = 10) => {
    const [thuong_hieu, gian_hang, voucher] = await Promise.all([
      PublicNoiBatModel.getTopThuongHieu(limit),
      PublicNoiBatModel.getTopGianHang(limit),
      PublicNoiBatModel.getTopVoucher(limit),
    ]);

    return {
      thuong_hieu,
      gian_hang,
      voucher,
      so_ngay_doanh_thu: SO_NGAY_DOANH_THU,
    };
  },
};

module.exports = PublicNoiBatModel;