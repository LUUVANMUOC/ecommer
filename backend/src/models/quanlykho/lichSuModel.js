const pool = require('../../config/db');
const {
  TIMELINE_SQL,
  layNguCanh,
  layNguCanhNhieu,
  loTrinhDayDu,
  ganLoTrinh,
  ganChangHienTai,
} = require('../common/loTrinhVanChuyen');

const LichSuModel = {
  // ===== 1. DANH SÁCH LỊCH SỬ =====
  // Bổ sung: shop, khách, tổng tiền + đủ 11 sự kiện của hành trình
  getLichSuKho: async (kho_ma) => {
    const query = `
      SELECT e.*,
             dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
             gh.gh_ten AS "TenShop",
             ttnh.ttnh_ten AS "TenKhach"
      FROM (
        -- 1. Phân công LSP01
        SELECT ttlh.dts_ma AS "DTS_Ma", 'Phân công LSP01' AS "HanhDong",
               ttlh.ttlh_thoidiemtao AS "ThoiGian", s.shipper_ten AS "NguoiThucHien",
               'DIEU_PHOI' AS "LoaiSuKien", 'LSP01_PHANCONG' AS "MaSuKien"
        FROM thongtinlayhang ttlh
        JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
        WHERE s.kho_ma = $1

        UNION ALL
        -- 2. LSP01 đã lấy hàng
        SELECT ttlh.dts_ma, 'LSP01 đã lấy hàng từ Shop',
               ttlh.ttlh_thoidiem, s.shipper_ten, 'SHIPPER', 'LSP01_LAY'
        FROM thongtinlayhang ttlh
        JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
        WHERE s.kho_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL

        UNION ALL
        -- 3. Nhập kho từ LSP01
        SELECT pk.dts_ma, 'Xác nhận nhập kho (từ LSP01)',
               pk.pk_thoigian_xacnhan, 'Thủ kho', 'THU_KHO', 'LSP01_NHAP'
        FROM phieu_kho pk
        WHERE pk.kho_ma = $1 AND pk.pk_ly_do = 'TU_LSP01'
          AND pk.pk_trangthai = 'DA_XAC_NHAN'

        UNION ALL
        -- 4. Gửi trung chuyển
        SELECT ttc.dts_ma, 'Gửi trung chuyển (LSP02)',
               ttc.ttc_thoidiemtao, s.shipper_ten, 'DIEU_PHOI', 'LSP02_PHANCONG'
        FROM thongtintrungchuyen ttc
        JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma
        WHERE ttc.kho_di_ma = $1

        UNION ALL
        -- 5. Xuất kho gửi LSP02
        SELECT pk.dts_ma, 'Xác nhận xuất kho (gửi LSP02)',
               pk.pk_thoigian_xacnhan, 'Thủ kho', 'THU_KHO', 'LSP02_XUAT'
        FROM phieu_kho pk
        WHERE pk.kho_ma = $1 AND pk.pk_ly_do = 'TRUNG_CHUYEN_DI'
          AND pk.pk_trangthai = 'DA_XAC_NHAN'

        UNION ALL
        -- 6. LSP02 giao tới kho đích
        SELECT ttc.dts_ma, 'LSP02 đã giao tới Kho',
               ttc.ttc_thoidiemdi, s.shipper_ten, 'SHIPPER', 'LSP02_GIAO'
        FROM thongtintrungchuyen ttc
        JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma
        WHERE ttc.kho_den_ma = $1 AND ttc.ttc_thoidiemdi IS NOT NULL

        UNION ALL
        -- 7. Kho đích nhận hàng
        SELECT ttc.dts_ma, 'Đã nhận hàng từ Kho đi',
               ttc.ttc_thoidiemden, 'Kho Đích', 'THU_KHO', 'LSP02_NHAP'
        FROM thongtintrungchuyen ttc
        WHERE ttc.kho_den_ma = $1 AND ttc.ttc_thoidiemden IS NOT NULL

        UNION ALL
        -- 8. Nhập kho từ LSP02
        SELECT pk.dts_ma, 'Xác nhận nhập kho (từ LSP02)',
               pk.pk_thoigian_xacnhan, 'Thủ kho', 'THU_KHO', 'LSP02_NHAP'
        FROM phieu_kho pk
        WHERE pk.kho_ma = $1 AND pk.pk_ly_do = 'TRUNG_CHUYEN_DEN'
          AND pk.pk_trangthai = 'DA_XAC_NHAN'

        UNION ALL
        -- 9. Phân công LSP03
        SELECT ttgh.dts_ma, 'Phân công LSP03',
               ttgh.ttgh_thoidiemtao, s.shipper_ten, 'DIEU_PHOI', 'LSP03_PHANCONG'
        FROM thongtingiaohang ttgh
        JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma
        WHERE s.kho_ma = $1

        UNION ALL
        -- 10. Xuất kho giao LSP03
        SELECT pk.dts_ma, 'Xác nhận xuất kho (giao LSP03)',
               pk.pk_thoigian_xacnhan, 'Thủ kho', 'THU_KHO', 'LSP03_XUAT'
        FROM phieu_kho pk
        WHERE pk.kho_ma = $1 AND pk.pk_ly_do = 'GIAO_LSP03'
          AND pk.pk_trangthai = 'DA_XAC_NHAN'

        UNION ALL
        -- 11. LSP03 giao khách
        SELECT ttgh.dts_ma, 'LSP03 đã giao hàng cho Khách',
               ttgh.ttgh_thoidiem, s.shipper_ten, 'SHIPPER', 'LSP03_GIAO'
        FROM thongtingiaohang ttgh
        JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma
        WHERE s.kho_ma = $1 AND ttgh.ttgh_thoidiem IS NOT NULL
      ) e
      JOIN donhangtheoshop dts ON dts.dts_ma = e."DTS_Ma"
      JOIN gianhang gh ON gh.gh_ma = dts.gh_ma
      JOIN donhangkhachmua dm ON dm.dm_ma = dts.dm_ma
      JOIN thongtinnhanhang ttnh ON ttnh.ttnh_ma = dm.ttnh_ma
      WHERE e."ThoiGian" IS NOT NULL
      ORDER BY e."ThoiGian" DESC
      LIMIT 1000
    `;
    const res = await pool.query(query, [kho_ma]);
    const nguCanh = await layNguCanhNhieu(res.rows.map((r) => r.DTS_Ma));
    return ganLoTrinh(res.rows, nguCanh);
  },

  // ===== 2. CHI TIẾT ĐẦY ĐỦ 1 ĐƠN (chỉ khi đơn thuộc kho này) =====
  getChiTietDonHang: async (dts_ma, kho_ma) => {
    // 0. Kiểm tra quyền: đơn phải gắn với kho qua lấy hàng / trung chuyển / giao hàng / phiếu kho
    const check = await pool.query(
      `SELECT 1 FROM donhangtheoshop dts
       WHERE dts.dts_ma = $1 AND (
         EXISTS (
           SELECT 1 FROM thongtinlayhang ttlh
           JOIN shipper s ON s.shipper_ma = ttlh.shipper_ma
           WHERE ttlh.dts_ma = dts.dts_ma AND s.kho_ma = $2
         )
         OR EXISTS (
           SELECT 1 FROM thongtintrungchuyen ttc
           WHERE ttc.dts_ma = dts.dts_ma AND (ttc.kho_di_ma = $2 OR ttc.kho_den_ma = $2)
         )
         OR EXISTS (
           SELECT 1 FROM thongtingiaohang ttgh
           JOIN shipper s ON s.shipper_ma = ttgh.shipper_ma
           WHERE ttgh.dts_ma = dts.dts_ma AND s.kho_ma = $2
         )
         OR EXISTS (
           SELECT 1 FROM phieu_kho pk
           WHERE pk.dts_ma = dts.dts_ma AND pk.kho_ma = $2
         )
       )`,
      [dts_ma, kho_ma]
    );
    if (check.rows.length === 0) return null;

    // 1. Thông tin đơn + khách + địa chỉ + voucher
    const infoRes = await pool.query(
      `SELECT
         dts.dts_ma AS "DTS_Ma",
         dts.dts_ngaylap AS "NgayLap",
         dts.dts_thoidiemdukiengiao AS "NgayGiaoDuKien",
         dts.dts_ghichu AS "GhiChuShop",
         dts.dts_tongtienhang AS "TongTienHang",
         dts.dts_tienvanchuyen AS "TienVanChuyen",
         dts.dts_tonggiamgiashop AS "GiamGiaShop",
         dts.dts_tonggiamgiavanchuyen AS "GiamGiaVanChuyen",
         dts.dts_tongtiengiamgia AS "TongTienGiamGia",
         dts.dts_tongtienkhachhangthanhtoan AS "TongThanhToan",
         dts.dts_tongtienphisan AS "TongTienPhiSan",
         dts.dts_trangthaithanhtoan AS "TrangThaiThanhToan",

         gh.gh_ten AS "TenShop",
         dcs.dc_mota AS "DiaChiLayHang",
         xl.xa_ten AS "Xa_LayHang",
         tl.tinh_ten AS "Tinh_LayHang",

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

         (SELECT c.ttdh_ma FROM chitiettrangthaidonhang c
          WHERE c.dts_ma = dts.dts_ma
          ORDER BY c.ctttdh_thoidiem DESC LIMIT 1) AS "MaTrangThaiHienTai",
         (SELECT ttdh.ttdh_ten FROM chitiettrangthaidonhang c
          JOIN trangthaidonhang ttdh ON ttdh.ttdh_ma = c.ttdh_ma
          WHERE c.dts_ma = dts.dts_ma
          ORDER BY c.ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai"

       FROM donhangtheoshop dts
       JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
       LEFT JOIN diachi dcs ON dts.dc_layhangma = dcs.dc_ma
       LEFT JOIN xaphuong xl ON dcs.xa_ma = xl.xa_ma
       LEFT JOIN tinhtp tl ON xl.tinh_ma = tl.tinh_ma
       JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
       LEFT JOIN khachhang kh ON dm.kh_ma = kh.kh_ma
       JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
       LEFT JOIN donvivanchuyen dvvc ON dts.dvvc_ma = dvvc.dvvc_ma
       LEFT JOIN khoiluongkienhang kl ON dts.klkh_ma = kl.klkh_ma
       LEFT JOIN magiamgia_shop mgg_s ON dts.mgg_shop_ma = mgg_s.mgg_shop_ma
       LEFT JOIN magiamgia_vanchuyen mgg_vc ON dts.mgg_vc_ma = mgg_vc.mgg_vc_ma
       WHERE dts.dts_ma = $1
       LIMIT 1`,
      [dts_ma]
    );
    if (infoRes.rows.length === 0) return null;

    // 2. Sản phẩm
    const itemsRes = await pool.query(
      `SELECT sp.sp_ten AS "TenSanPham", ctsp.ctsp_ten AS "TenPhanLoai",
              ctdh.ctdh_soluong AS "SoLuong", ctdh.ctdh_dongia AS "DonGia",
              ctdh.ctdh_thanhtien AS "ThanhTien",
              (SELECT hasp_link FROM hinhanhsanpham
               WHERE ctsp_ma = ctsp.ctsp_ma
               ORDER BY hasp_laanhchinh DESC LIMIT 1) AS "HinhAnh"
       FROM chitietdonhang ctdh
       JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma
       JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
       WHERE ctdh.dts_ma = $1
       ORDER BY sp.sp_ten`,
      [dts_ma]
    );

    // 3. Timeline toàn bộ hành trình (11 mốc) + lộ trình từng chặng
    const [timelineRes, nguCanh] = await Promise.all([
      pool.query(TIMELINE_SQL, [dts_ma]),
      layNguCanh(dts_ma),
    ]);

    // 4. Phiếu kho liên quan
    const phieuRes = await pool.query(
      `SELECT pk.pk_ma AS "PK_Ma", pk.pk_loai AS "Loai", pk.pk_ly_do AS "LyDo",
              pk.pk_trangthai AS "TrangThai", pk.pk_thoigian_tao AS "ThoiGianTao",
              pk.pk_thoigian_xacnhan AS "ThoiGianXacNhan", pk.pk_hinhanh AS "HinhAnh",
              pk.pk_ghichu AS "GhiChu", k.kho_ten AS "Kho_Ten",
              s.shipper_ten AS "Shipper_Ten", s.shipper_sdt AS "Shipper_SDT"
       FROM phieu_kho pk
       LEFT JOIN kho k ON pk.kho_ma = k.kho_ma
       LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma
       WHERE pk.dts_ma = $1
       ORDER BY pk.pk_thoigian_tao DESC`,
      [dts_ma]
    );

    return {
      info: infoRes.rows[0],
      items: itemsRes.rows,
      loTrinh: loTrinhDayDu(nguCanh),
      timeline: ganLoTrinh(timelineRes.rows, nguCanh),
      phieuKho: phieuRes.rows,
    };
  },
};

module.exports = LichSuModel;