const pool = require('../../config/db');

const AdminDonHangModel = {
  // 1. Lấy dữ liệu cho bộ lọc (Shop & DVVC)
  getFilterData: async () => {
    const shopsRes = await pool.query(`SELECT gh_ma AS "GH_Ma", gh_ten AS "GH_Ten" FROM gianhang ORDER BY gh_ten ASC`);
    const dvvcsRes = await pool.query(`SELECT dvvc_ma AS "DVVC_Ma", dvvc_ten AS "DVVC_Ten" FROM donvivanchuyen ORDER BY dvvc_ten ASC`);
    return { shops: shopsRes.rows, dvvcs: dvvcsRes.rows };
  },

  // 2. Lấy danh sách đơn hàng có bộ lọc
  getAllOrders: async (filters) => {
    let query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_tongtienkhachhangthanhtoan AS "TongThanhToan",
        gh.gh_ten AS "TenShop",
        dvvc.dvvc_ten AS "TenDVVC",
        kh.kh_ten AS "TenKhachHang",
        ttnh.ttnh_sdt AS "SdtKhachHang",
        (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai"
      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN donvivanchuyen dvvc ON dts.dvvc_ma = dvvc.dvvc_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN khachhang kh ON dm.kh_ma = kh.kh_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE 1=1
    `;
    
    const values = [];
    let index = 1;

    if (filters.search) {
      query += ` AND (dts.dts_ma ILIKE $${index} OR gh.gh_ten ILIKE $${index} OR ttnh.ttnh_sdt ILIKE $${index})`;
      values.push(`%${filters.search}%`);
      index++;
    }
    if (filters.gh_ma) {
      query += ` AND dts.gh_ma = $${index}`;
      values.push(filters.gh_ma);
      index++;
    }
    if (filters.dvvc_ma) {
      query += ` AND dts.dvvc_ma = $${index}`;
      values.push(filters.dvvc_ma);
      index++;
    }
    if (filters.trangthai) {
      query += ` AND (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) = $${index}`;
      values.push(filters.trangthai);
      index++;
    }

    query += ` ORDER BY dts.dts_ngaylap DESC`;
    const res = await pool.query(query, values);
    return res.rows;
  },

  // 3. Lấy chi tiết đơn hàng (Gộp từ bản của Shop)
  getOrderDetail: async (dts_ma) => {
    const infoQuery = `
      SELECT 
        dts.dts_ma AS "DTS_Ma", dts.dts_ngaylap AS "NgayLap", dts.dts_thoidiemdukiengiao AS "NgayGiaoDuKien", dts.dts_ghichu AS "GhiChuShop", 
        dts.dts_tongtienhang AS "TongTienHang", dts.dts_tienvanchuyen AS "TienVanChuyen", 
        dts.dts_tonggiamgiashop AS "GiamGiaShop", dts.dts_tonggiamgiavanchuyen AS "GiamGiaVanChuyen",
        dts.dts_tongtiengiamgia AS "TongTienGiamGia", dts.dts_tongtienkhachhangthanhtoan AS "TongThanhToan", 
        dts.dts_tongtienphisan AS "TongTienPhiSan", dts.dts_trangthaithanhtoan AS "TrangThaiThanhToan",
        dm.dm_ma AS "DM_Ma", dm.dm_ngaylap AS "NgayLapDonTong",
        kh.kh_ten AS "TenKhachHang", kh.kh_sdt AS "SdtKhachHang", kh.kh_email AS "EmailKhachHang",
        ttnh.ttnh_ten AS "TenNguoiNhan", ttnh.ttnh_sdt AS "SdtNguoiNhan", ttnh.ttnh_diachisnapshot AS "DiaChiGiao", ttnh.ttnh_ghichu AS "GhiChuKhach",
        dvvc.dvvc_ten AS "TenDVVC", kl.klkh_ten AS "TenMocKhoiLuong",
        gh.gh_ten AS "TenShop",
        mgg_s.mgg_shop_ten AS "TenVoucherShop", mgg_s.mgg_shop_phantramgiam AS "PhanTramGiamShop", mgg_s.mgg_shop_sotiengiamtoidamoilan AS "GiamToiDaShop",
        mgg_vc.mgg_vc_ten AS "TenVoucherVC", mgg_vc.mgg_vc_phantramgiam AS "PhanTramGiamVC", mgg_vc.mgg_vc_sotiengiamtoidamoilan AS "GiamToiDaVC",
        (SELECT json_agg(json_build_object(
          'Ctsp_Ma', ctdh.ctsp_ma, 'TenSanPham', sp.sp_ten, 'TenPhanLoai', ctsp.ctsp_ten, 'SoLuong', ctdh.ctdh_soluong, 'DonGia', ctdh.ctdh_dongia, 'ThanhTien', ctdh.ctdh_thanhtien,
          'Image', (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1)
        )) FROM chitietdonhang ctdh JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma WHERE ctdh.dts_ma = dts.dts_ma) AS items,
        
        (SELECT json_agg(json_build_object(
          'ttdh_ma', ctttdh.ttdh_ma, 'ten_trang_thai', ttdh.ttdh_ten, 'thoi_diem', ctttdh.ctttdh_thoidiem, 'ghi_chu', ctttdh.ctttdh_ghichu
        ) ORDER BY ctttdh.ctttdh_thoidiem DESC) FROM chitiettrangthaidonhang ctttdh JOIN trangthaidonhang ttdh ON ctttdh.ttdh_ma = ttdh.ttdh_ma WHERE ctttdh.dts_ma = dts.dts_ma) AS lich_su_trang_thai

      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN khachhang kh ON dm.kh_ma = kh.kh_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      JOIN donvivanchuyen dvvc ON dts.dvvc_ma = dvvc.dvvc_ma JOIN khoiluongkienhang kl ON dts.klkh_ma = kl.klkh_ma
      LEFT JOIN magiamgia_shop mgg_s ON dts.mgg_shop_ma = mgg_s.mgg_shop_ma LEFT JOIN magiamgia_vanchuyen mgg_vc ON dts.mgg_vc_ma = mgg_vc.mgg_vc_ma
      WHERE dts.dts_ma = $1
    `;
    const infoRes = await pool.query(infoQuery, [dts_ma]);
    if (infoRes.rows.length === 0) return null;
    const orderDetail = infoRes.rows[0];

    // Lịch sử vận chuyển chi tiết (11 bước)
    const timelineQuery = `
      SELECT ctttdh.ctttdh_thoidiem AS "ThoiGian", 'Hệ thống' AS "NguoiThucHien", ttdh.ttdh_ten AS "HanhDong", ctttdh.ctttdh_ghichu AS "GhiChu", NULL::text AS "HinhAnh",
             NULL::varchar AS "Shipper_Ma", NULL::varchar AS "Shipper_Ten", NULL::varchar AS "Shipper_SDT", NULL::text AS "Shipper_HinhAnh", NULL::varchar AS "Kho_Ma", NULL::varchar AS "Kho_Ten", NULL::varchar AS "Kho_Den_Ma", NULL::varchar AS "Kho_Den_Ten", 'HE_THONG' AS "LoaiSuKien"
      FROM chitiettrangthaidonhang ctttdh JOIN trangthaidonhang ttdh ON ctttdh.ttdh_ma = ttdh.ttdh_ma WHERE ctttdh.dts_ma = $1
      UNION ALL
      SELECT ttlh.ttlh_thoidiemtao, 'Quản lý kho', 'Phân công Lấy Hàng (LSP01)', 'Giao việc cho shipper', NULL::text, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'DIEU_PHOI' AS "LoaiSuKien"
      FROM thongtinlayhang ttlh JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttlh.dts_ma = $1
      UNION ALL
      SELECT ttlh.ttlh_thoidiem, s.shipper_ten, 'LSP01 đã lấy hàng từ Shop', ttlh.ttlh_ghichu, ttlh.ttlh_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'SHIPPER' AS "LoaiSuKien"
      FROM thongtinlayhang ttlh JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttlh.dts_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL
      UNION ALL
      SELECT pk.pk_thoigian_xacnhan, 'Thủ kho', 'Thủ kho xác nhận Nhập kho (Từ LSP01)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien"
      FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'TU_LSP01' AND pk.pk_trangthai = 'DA_XAC_NHAN'
      UNION ALL
      SELECT ttc.ttc_thoidiemtao, 'Quản lý kho', 'Phân công Trung Chuyển (LSP02)', 'Giao việc cho shipper', NULL::text, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k_di.kho_ma, k_di.kho_ten, k_den.kho_ma, k_den.kho_ten, 'DIEU_PHOI' AS "LoaiSuKien"
      FROM thongtintrungchuyen ttc JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma WHERE ttc.dts_ma = $1
      UNION ALL
      SELECT pk.pk_thoigian_xacnhan, 'Thủ kho', 'Thủ kho xác nhận Xuất kho (Giao LSP02)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien"
      FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'TRUNG_CHUYEN_DI' AND pk.pk_trangthai = 'DA_XAC_NHAN'
      UNION ALL
      SELECT ttc.ttc_thoidiemdi, s.shipper_ten, 'LSP02 đã giao tới Kho Đích', ttc.ttc_ghichu, ttc.ttc_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k_di.kho_ma, k_di.kho_ten, k_den.kho_ma, k_den.kho_ten, 'SHIPPER' AS "LoaiSuKien"
      FROM thongtintrungchuyen ttc JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma WHERE ttc.dts_ma = $1 AND ttc.ttc_thoidiemdi IS NOT NULL
      UNION ALL
      SELECT pk.pk_thoigian_xacnhan, 'Thủ kho đích', 'Thủ kho Đích xác nhận Nhập kho (Từ LSP02)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien"
      FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'TRUNG_CHUYEN_DEN' AND pk.pk_trangthai = 'DA_XAC_NHAN'
      UNION ALL
      SELECT ttgh.ttgh_thoidiemtao, 'Quản lý kho', 'Phân công Giao Hàng (LSP03)', 'Giao việc cho shipper', NULL::text, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'DIEU_PHOI' AS "LoaiSuKien"
      FROM thongtingiaohang ttgh JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttgh.dts_ma = $1
      UNION ALL
      SELECT pk.pk_thoigian_xacnhan, 'Thủ kho đích', 'Thủ kho Đích xác nhận Xuất kho (Giao LSP03)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien"
      FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'GIAO_LSP03' AND pk.pk_trangthai = 'DA_XAC_NHAN'
      UNION ALL
      SELECT ttgh.ttgh_thoidiem, s.shipper_ten, 'LSP03 đã giao hàng cho Khách', ttgh.ttgh_ghichu, ttgh.ttgh_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'SHIPPER' AS "LoaiSuKien"
      FROM thongtingiaohang ttgh JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttgh.dts_ma = $1 AND ttgh.ttgh_thoidiem IS NOT NULL
      ORDER BY "ThoiGian" ASC
    `;
    const timelineRes = await pool.query(timelineQuery, [dts_ma]);
    orderDetail.timeline = timelineRes.rows;

    return orderDetail;
  }
};

module.exports = AdminDonHangModel;