const pool = require('../../config/db');

const ShipperDonHangModel = {
  // Lấy danh sách đơn chờ lấy của shipper
  getChoLay: async (shipper_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        dts.dts_thoidiemdukiengiao AS "NgayGiaoDuKien",
        dts.dts_ghichu AS "GhiChuDon",
        
        gh.gh_ten AS "TenShop",
        gh.gh_hinhanh AS "HinhShop",
        dc.dc_mota AS "DiaChiLayHang",
        
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao",
        
        ttlh.ttlh_thoidiemtao AS "ThoiDiemPhanCong"
        
      FROM thongtinlayhang ttlh
      JOIN donhangtheoshop dts ON ttlh.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN diachi dc ON dts.dc_layhangma = dc.dc_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      
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

    // Lấy chi tiết sản phẩm cho từng đơn
    for (const order of res.rows) {
      const itemQuery = `
        SELECT 
          ctsp.ctsp_ma AS "Ctsp_Ma",
          sp.sp_ten AS "TenSanPham",
          ctsp.ctsp_ten AS "TenPhanLoai",
          ctsp.ctsp_gianban AS "GiaBan",
          ctdh.ctdh_soluong AS "SoLuong",
          (SELECT hasp_link FROM hinhanhsanpham 
           WHERE ctsp_ma = ctsp.ctsp_ma 
           ORDER BY hasp_laanhchinh DESC LIMIT 1) AS "Image"
        FROM chitietdonhang ctdh
        JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma
        JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
        WHERE ctdh.dts_ma = $1
      `;
      const itemsRes = await pool.query(itemQuery, [order.DTS_Ma]);
      order.items = itemsRes.rows;
    }

    return res.rows;
  },
  getLichSuLayHang: async (shipper_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        ttlh.ttlh_thoidiem AS "ThoiGian",
        gh.gh_ten AS "TenShop",
        ttlh.ttlh_hinhanh AS "HinhAnh"
      FROM thongtinlayhang ttlh
      JOIN donhangtheoshop dts ON ttlh.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      WHERE ttlh.shipper_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL
      ORDER BY ttlh.ttlh_thoidiem DESC
    `;
    const res = await pool.query(query, [shipper_ma]);
    return res.rows;
  },
  getLichSu: async (shipper_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        ttlh.ttlh_thoidiem AS "ThoiGian",
        gh.gh_ten AS "TenShop",
        ttlh.ttlh_hinhanh AS "HinhAnh"
      FROM thongtinlayhang ttlh
      JOIN donhangtheoshop dts ON ttlh.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      WHERE ttlh.shipper_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL
      ORDER BY ttlh.ttlh_thoidiem DESC
    `;
    const res = await pool.query(query, [shipper_ma]);
    return res.rows;
  }
};

module.exports = ShipperDonHangModel;