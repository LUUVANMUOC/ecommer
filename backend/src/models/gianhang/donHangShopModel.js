const pool = require('../../config/db');

const DonHangShopModel = {
  // Lấy danh sách đơn hàng của Shop
  getOrdersByShop: async (gh_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_thoidiemdukiengiao AS "NgayGiaoDuKien",
        dts.dts_tongtienkhachhangthanhtoan AS "TongThanhToan",
        dts.dts_ghichu AS "GhiChu",
        kh.kh_ten AS "TenKhachHang",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao",
        (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai"
      FROM donhangtheoshop dts
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN khachhang kh ON dm.kh_ma = kh.kh_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE dts.gh_ma = $1
      ORDER BY dts.dts_ngaylap DESC
    `;
    const res = await pool.query(query, [gh_ma]);
    return res.rows;
  },

  // Lấy chi tiết món hàng của đơn
  getOrderItems: async (dts_ma) => {
    const query = `
      SELECT 
        ctsp.ctsp_ma AS "Ctsp_Ma",
        sp.sp_ten AS "TenSanPham",
        ctsp.ctsp_ten AS "TenPhanLoai",
        ctdh.ctdh_soluong AS "SoLuong",
        ctdh.ctdh_dongia AS "DonGia",
        (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1) AS "Image"
      FROM chitietdonhang ctdh
      JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma
      JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
      WHERE ctdh.dts_ma = $1
    `;
    const res = await pool.query(query, [dts_ma]);
    return res.rows;
  },

  // Xác nhận đơn hàng (Chuyển từ TTDH01 sang TTDH02)
  confirmOrder: async (dts_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Kiểm tra trạng thái hiện tại
      const statusRes = await client.query(`
        SELECT ttdh_ma FROM chitiettrangthaidonhang 
        WHERE dts_ma = $1 ORDER BY ctttdh_thoidiem DESC LIMIT 1
      `, [dts_ma]);
      
      const currentStatus = statusRes.rows[0]?.ttdh_ma;
      if (currentStatus !== 'TTDH01') {
        throw new Error("Chỉ có thể xác nhận đơn hàng đang ở trạng thái 'Chờ Xác Nhận'.");
      }

      // Chèn trạng thái mới (TTDH02 - Chờ Lấy Hàng)
      await client.query(`
        INSERT INTO chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu)
        VALUES ($1, 'TTDH02', NOW(), 'Shop đã xác nhận đơn hàng')
      `, [dts_ma]);

      await client.query('COMMIT');
      return { message: "Xác nhận đơn hàng thành công!" };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  getOrderDetailByShop: async (dts_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_thoidiemdukiengiao AS "NgayGiaoDuKien",
        dts.dts_ghichu AS "GhiChuShop",
        dts.dts_tongtienhang AS "TongTienHang",
        dts.dts_tienvanchuyen AS "TienVanChuyen",
        dts.dts_tongtiengiamgia AS "TongTienGiamGia",
        dts.dts_tongtienkhachhangthanhtoan AS "TongThanhToan",
        dts.dts_tongtienphisan AS "TongTienPhiSan",
        dts.dts_trangthaithanhtoan AS "TrangThaiThanhToan",
        
        dm.dm_ma AS "DM_Ma",
        dm.dm_ngaylap AS "NgayLapDonTong",
        
        kh.kh_ten AS "TenKhachHang",
        kh.kh_sdt AS "SdtKhachHang",
        kh.kh_email AS "EmailKhachHang",
        
        ttnh.ttnh_ten AS "TenNguoiNhan",
        ttnh.ttnh_sdt AS "SdtNguoiNhan",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao",
        ttnh.ttnh_ghichu AS "GhiChuKhach",
        
        dvvc.dvvc_ten AS "TenDVVC",
        kl.klkh_ten AS "TenMocKhoiLuong",
        
        mgg_s.mgg_shop_ten AS "TenVoucherShop",
        mgg_s.mgg_shop_phantramgiam AS "PhanTramGiamShop",
        mgg_s.mgg_shop_sotiengiamtoidamoilan AS "GiamToiDaShop",
        
        mgg_vc.mgg_vc_ten AS "TenVoucherVC",
        mgg_vc.mgg_vc_phantramgiam AS "PhanTramGiamVC",
        mgg_vc.mgg_vc_sotiengiamtoidamoilan AS "GiamToiDaVC",

        (SELECT json_agg(json_build_object(
          'Ctsp_Ma', ctdh.ctsp_ma,
          'TenSanPham', sp.sp_ten,
          'TenPhanLoai', ctsp.ctsp_ten,
          'SoLuong', ctdh.ctdh_soluong,
          'DonGia', ctdh.ctdh_dongia,
          'ThanhTien', ctdh.ctdh_thanhtien,
          'Image', (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1)
        )) FROM chitietdonhang ctdh
          JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma
          JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
          WHERE ctdh.dts_ma = dts.dts_ma
        ) AS items,

        (SELECT json_agg(json_build_object(
          'ttdh_ma', ctttdh.ttdh_ma,
          'ten_trang_thai', ttdh.ttdh_ten,
          'thoi_diem', ctttdh.ctttdh_thoidiem,
          'ghi_chu', ctttdh.ctttdh_ghichu
        ) ORDER BY ctttdh.ctttdh_thoidiem DESC) FROM chitiettrangthaidonhang ctttdh
          JOIN trangthaidonhang ttdh ON ctttdh.ttdh_ma = ttdh.ttdh_ma
          WHERE ctttdh.dts_ma = dts.dts_ma
        ) AS lich_su_trang_thai

      FROM donhangtheoshop dts
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN khachhang kh ON dm.kh_ma = kh.kh_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      JOIN donvivanchuyen dvvc ON dts.dvvc_ma = dvvc.dvvc_ma
      JOIN khoiluongkienhang kl ON dts.klkh_ma = kl.klkh_ma
      LEFT JOIN magiamgia_shop mgg_s ON dts.mgg_shop_ma = mgg_s.mgg_shop_ma
      LEFT JOIN magiamgia_vanchuyen mgg_vc ON dts.mgg_vc_ma = mgg_vc.mgg_vc_ma
      WHERE dts.dts_ma = $1
    `;
    const res = await pool.query(query, [dts_ma]);
    return res.rows[0];
  }
};

module.exports = DonHangShopModel;