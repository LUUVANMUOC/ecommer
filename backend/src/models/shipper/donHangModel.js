const pool = require('../../config/db');

// Bộ cột dùng chung cho cả tab "Chờ lấy" và "Lịch sử"
// (không trả dts_tongtienphisan - thông tin nội bộ, shipper không cần)
const ORDER_FIELDS = `
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_thoidiemdukiengiao AS "NgayGiaoDuKien",
        dts.dts_ghichu AS "GhiChuDon",

        dts.dts_tongtienhang AS "TongTienHang",
        dts.dts_tienvanchuyen AS "TienVanChuyen",
        dts.dts_tonggiamgiashop AS "GiamGiaShop",
        dts.dts_tonggiamgiavanchuyen AS "GiamGiaVanChuyen",
        dts.dts_tongtiengiamgia AS "TongTienGiamGia",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        dts.dts_trangthaithanhtoan AS "TrangThaiThanhToan",

        gh.gh_ten AS "TenShop",
        gh.gh_hinhanh AS "HinhShop",
        gh.gh_sdt AS "SdtShop",
        gh.gh_email AS "EmailShop",

        dc.dc_mota AS "DiaChiLayHang",
        dc.dc_gps AS "GpsLayHang",
        xal.xa_ten AS "XaLayHang",
        tinh_lay.tinh_ten AS "TinhLayHang",

        ttnh.ttnh_ten AS "TenNguoiNhan",
        ttnh.ttnh_sdt AS "SdtNguoiNhan",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao",
        ttnh.ttnh_ghichu AS "GhiChuKhach",

        dvvc.dvvc_ten AS "TenDVVC",
        kl.klkh_ten AS "TenMocKhoiLuong",
        mgg_s.mgg_shop_ten AS "TenVoucherShop",
        mgg_vc.mgg_vc_ten AS "TenVoucherVC",

        ttlh.ttlh_thoidiemtao AS "ThoiDiemPhanCong",

        (SELECT json_agg(json_build_object(
          'Ctsp_Ma', ctdh.ctsp_ma,
          'TenSanPham', sp.sp_ten,
          'TenPhanLoai', ctsp.ctsp_ten,
          'SoLuong', ctdh.ctdh_soluong,
          'DonGia', ctdh.ctdh_dongia,
          'ThanhTien', ctdh.ctdh_thanhtien,
          'Image', (SELECT hasp_link FROM hinhanhsanpham
                    WHERE ctsp_ma = ctsp.ctsp_ma
                    ORDER BY hasp_laanhchinh DESC LIMIT 1)
        ) ORDER BY sp.sp_ten)
        FROM chitietdonhang ctdh
        JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma
        JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
        WHERE ctdh.dts_ma = dts.dts_ma) AS "items"
`;

const ORDER_JOINS = `
      FROM thongtinlayhang ttlh
      JOIN donhangtheoshop dts ON ttlh.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN diachi dc ON dts.dc_layhangma = dc.dc_ma
      LEFT JOIN xaphuong xal ON dc.xa_ma = xal.xa_ma
      LEFT JOIN tinhtp tinh_lay ON xal.tinh_ma = tinh_lay.tinh_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      JOIN donvivanchuyen dvvc ON dts.dvvc_ma = dvvc.dvvc_ma
      JOIN khoiluongkienhang kl ON dts.klkh_ma = kl.klkh_ma
      LEFT JOIN magiamgia_shop mgg_s ON dts.mgg_shop_ma = mgg_s.mgg_shop_ma
      LEFT JOIN magiamgia_vanchuyen mgg_vc ON dts.mgg_vc_ma = mgg_vc.mgg_vc_ma
`;

const ShipperDonHangModel = {
  // Lấy danh sách đơn chờ lấy của shipper
  getChoLay: async (shipper_ma) => {
    const query = `
      SELECT ${ORDER_FIELDS}
      ${ORDER_JOINS}
      WHERE ttlh.shipper_ma = $1
        AND ttlh.ttlh_thoidiem IS NULL
        AND (
          SELECT ttdh_ma FROM chitiettrangthaidonhang
          WHERE dts_ma = dts.dts_ma
          ORDER BY ctttdh_thoidiem DESC LIMIT 1
        ) = 'TTDH02'
      ORDER BY ttlh.ttlh_thoidiemtao ASC
    `;
    const res = await pool.query(query, [shipper_ma]);
    return res.rows;
  },

  // Lịch sử các đơn đã lấy (cùng cấu trúc với getChoLay + minh chứng)
  getLichSu: async (shipper_ma) => {
    const query = `
      SELECT ${ORDER_FIELDS},
        ttlh.ttlh_thoidiem AS "ThoiGian",
        ttlh.ttlh_hinhanh AS "HinhAnh",
        ttlh.ttlh_ghichu AS "GhiChuLayHang"
      ${ORDER_JOINS}
      WHERE ttlh.shipper_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL
      ORDER BY ttlh.ttlh_thoidiem DESC
    `;
    const res = await pool.query(query, [shipper_ma]);
    return res.rows;
  },
};

// Giữ tương thích với tên hàm cũ
ShipperDonHangModel.getLichSuLayHang = ShipperDonHangModel.getLichSu;

module.exports = ShipperDonHangModel;