const pool = require('../../config/db');

const TrungChuyenModel = {
  // 1. Lấy danh sách đơn cần GỬI trung chuyển (Dành cho Kho Đi)
  getDonChoGui: async (kho_di_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        gh.gh_ten AS "TenShop",
        dc_shop.dc_mota AS "DiaChiLayHang",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao",
        k_den.kho_ma AS "Kho_Den_Ma",
        k_den.kho_ten AS "Kho_Den_Ten"
      FROM donhangtheoshop dts
      JOIN thongtinlayhang ttlh ON dts.dts_ma = ttlh.dts_ma
      JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN diachi dc_shop ON dts.dc_layhangma = dc_shop.dc_ma
      
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      JOIN diachi dc_kh ON ttnh.dc_ma = dc_kh.dc_ma  -- ✅ Lấy xa_ma của khách qua bảng địa chỉ
      
      -- Tìm Kho đích (cùng Xã với địa chỉ khách)
      JOIN kho k_den ON dc_kh.xa_ma = (SELECT xa_ma FROM diachi WHERE dc_ma = k_den.dc_ma)
      
      WHERE s.kho_ma = $1
        AND ttlh.ttlh_thoidiem IS NOT NULL
        AND (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) = 'TTDH03'
        AND NOT EXISTS (SELECT 1 FROM thongtintrungchuyen WHERE dts_ma = dts.dts_ma)
      ORDER BY dts.dts_ngaylap ASC
    `;
    const res = await pool.query(query, [kho_di_ma]);
    return res.rows;
  },

  // 2. Lấy danh sách Shipper LSP02 thuộc Kho Đi
  getShippersLSP02: async (kho_di_ma) => {
    const query = `
      SELECT shipper_ma AS "Shipper_Ma", shipper_ten AS "Shipper_Ten", shipper_sdt AS "Shipper_SDT"
      FROM shipper 
      WHERE kho_ma = $1 AND lsp_ma = 'LSP02'
    `;
    const res = await pool.query(query, [kho_di_ma]);
    return res.rows;
  },

  // 3. Lưu thông tin Gửi trung chuyển
  guiTrungChuyen: async (data) => {
    const query = `
      INSERT INTO thongtintrungchuyen (dts_ma, shipper_trungchuyen_ma, kho_di_ma, kho_den_ma, ttc_ghichu)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [data.dts_ma, data.shipper_trungchuyen_ma, data.kho_di_ma, data.kho_den_ma, data.ghichu || null];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  // 4. Lấy danh sách đơn CHỜ NHẬN trung chuyển (Dành cho Kho Đích)
  getDonChoNhan: async (kho_den_ma) => {
    const query = `
      SELECT 
        ttc.dts_ma AS "DTS_Ma",
        ttc.ttc_thoidiemtao AS "ThoiDiemGui",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        gh.gh_ten AS "TenShop",
        s.shipper_ten AS "TenShipperGui",
        s.shipper_sdt AS "SdtShipperGui",
        k_di.kho_ten AS "Kho_Di_Ten",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao"
      FROM thongtintrungchuyen ttc
      JOIN donhangtheoshop dts ON ttc.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma
      JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE ttc.kho_den_ma = $1
        AND ttc.ttc_thoidiemden IS NULL
      ORDER BY ttc.ttc_thoidiemtao ASC
    `;
    const res = await pool.query(query, [kho_den_ma]);
    return res.rows;
  },

  // 5. Cập nhật trạng thái ĐÃ NHẬN (Kho Đích bấm)
  nhanHang: async (dts_ma, kho_den_ma) => {
    const query = `
      UPDATE thongtintrungchuyen 
      SET ttc_thoidiemden = NOW()
      WHERE dts_ma = $1 AND kho_den_ma = $2 AND ttc_thoidiemden IS NULL
      RETURNING *
    `;
    const res = await pool.query(query, [dts_ma, kho_den_ma]);
    return res.rows[0];
  },
    // 4. Lấy danh sách đơn CHỜ NHẬN trung chuyển (Dành cho Kho Đích)
  getDonChoNhan: async (kho_den_ma) => {
    const query = `
      SELECT 
        ttc.dts_ma AS "DTS_Ma",
        ttc.ttc_thoidiemtao AS "ThoiDiemGui",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        gh.gh_ten AS "TenShop",
        s.shipper_ten AS "TenShipperGui",
        s.shipper_sdt AS "SdtShipperGui",
        k_di.kho_ten AS "Kho_Di_Ten",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao"
      FROM thongtintrungchuyen ttc
      JOIN donhangtheoshop dts ON ttc.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma
      JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE ttc.kho_den_ma = $1
        AND ttc.ttc_thoidiemdi IS NOT NULL  -- ✅ Thêm dòng này: Bắt buộc Shipper phải giao tới kho rồi
        AND ttc.ttc_thoidiemden IS NULL
      ORDER BY ttc.ttc_thoidiemdi ASC
    `;
    const res = await pool.query(query, [kho_den_ma]);
    return res.rows;
  },
};

module.exports = TrungChuyenModel;