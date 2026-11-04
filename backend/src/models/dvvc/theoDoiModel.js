const pool = require('../../config/db');

const TheoDoiModel = {
  // ... (Hàm getDanhSach giữ nguyên)
  getDanhSach: async (dvvc_ma, trangthai, kho_ma, search) => {
    let query = `
      SELECT DISTINCT
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        gh.gh_ten AS "TenShop",
        (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai",
        (SELECT kho_ten FROM kho k JOIN thongtinlayhang ttlh ON k.kho_ma = (SELECT kho_ma FROM shipper WHERE shipper_ma = ttlh.shipper_ma) WHERE ttlh.dts_ma = dts.dts_ma LIMIT 1) AS "Kho_Lay_Hang",
        (SELECT kho_ten FROM kho WHERE kho_ma = (SELECT kho_di_ma FROM thongtintrungchuyen WHERE dts_ma = dts.dts_ma LIMIT 1)) AS "Kho_Di",
        (SELECT kho_ten FROM kho WHERE kho_ma = (SELECT kho_den_ma FROM thongtintrungchuyen WHERE dts_ma = dts.dts_ma LIMIT 1)) AS "Kho_Den"
      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      WHERE dts.dts_ma IN (
        SELECT ttlh.dts_ma FROM thongtinlayhang ttlh JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE k.dvvc_ma = $1
        UNION
        SELECT ttc.dts_ma FROM thongtintrungchuyen ttc JOIN kho k ON ttc.kho_di_ma = k.kho_ma WHERE k.dvvc_ma = $1
        UNION
        SELECT ttgh.dts_ma FROM thongtingiaohang ttgh JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE k.dvvc_ma = $1
      )
    `;

    const values = [dvvc_ma];
    let index = 2;

    if (search) {
      query += ` AND (dts.dts_ma ILIKE $${index} OR gh.gh_ten ILIKE $${index})`;
      values.push(`%${search}%`);
      index++;
    }

    query = `SELECT * FROM (${query}) AS sub WHERE 1=1`;
    
    if (trangthai) {
      query += ` AND "TrangThaiHienTai" = $${index}`;
      values.push(trangthai);
      index++;
    }
    if (kho_ma) {
      query += ` AND ("Kho_Lay_Hang" = (SELECT kho_ten FROM kho WHERE kho_ma = $${index}) OR "Kho_Di" = (SELECT kho_ten FROM kho WHERE kho_ma = $${index}) OR "Kho_Den" = (SELECT kho_ten FROM kho WHERE kho_ma = $${index}))`;
      values.push(kho_ma);
      index++;
    }

    query += ` ORDER BY "NgayLap" DESC`;
    const res = await pool.query(query, values);
    return res.rows;
  },

  // 2. Lấy chi tiết Timeline Siêu Chi Tiết
  getChiTiet: async (dts_ma) => {
    const infoQuery = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        ttnh.ttnh_ten AS "TenKhach",
        ttnh.ttnh_sdt AS "SdtKhach",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao",
        gh.gh_ten AS "TenShop",
        (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai"
      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE dts.dts_ma = $1
    `;
    const infoRes = await pool.query(infoQuery, [dts_ma]);
    if (infoRes.rows.length === 0) return null;
    const orderInfo = infoRes.rows[0];

    const timelineQuery = `
      -- 1. Trạng thái chung (Hệ thống)
      SELECT ctttdh.ctttdh_thoidiem AS "ThoiGian", 'Hệ thống' AS "NguoiThucHien", 
             ttdh.ttdh_ten AS "HanhDong", ctttdh.ctttdh_ghichu AS "GhiChu", NULL AS "HinhAnh",
             NULL AS "Shipper_Ma", NULL AS "Shipper_Ten", NULL AS "Shipper_SDT",
             NULL AS "Kho_Ma", NULL AS "Kho_Ten", NULL AS "Kho_Den_Ma", NULL AS "Kho_Den_Ten"
      FROM chitiettrangthaidonhang ctttdh
      JOIN trangthaidonhang ttdh ON ctttdh.ttdh_ma = ttdh.ttdh_ma
      WHERE ctttdh.dts_ma = $1

      UNION ALL

      -- 2. Phân công LSP01
      SELECT ttlh.ttlh_thoidiemtao, 'Quản lý kho', 'Phân công Lấy Hàng (LSP01)', 'Giao việc cho shipper', NULL,
             s.shipper_ma, s.shipper_ten, s.shipper_sdt,
             k.kho_ma, k.kho_ten, NULL, NULL
      FROM thongtinlayhang ttlh
      JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
      JOIN kho k ON s.kho_ma = k.kho_ma
      WHERE ttlh.dts_ma = $1

      UNION ALL

      -- 3. LSP01 Lấy hàng
      SELECT ttlh.ttlh_thoidiem, s.shipper_ten, 'Shipper Lấy Hàng đã đến lấy', ttlh.ttlh_ghichu, ttlh.ttlh_hinhanh,
             s.shipper_ma, s.shipper_ten, s.shipper_sdt,
             k.kho_ma, k.kho_ten, NULL, NULL
      FROM thongtinlayhang ttlh
      JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
      JOIN kho k ON s.kho_ma = k.kho_ma
      WHERE ttlh.dts_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL

      UNION ALL

      -- 4. Phân công LSP02 (Trung chuyển)
      SELECT ttc.ttc_thoidiemtao, 'Quản lý kho', 'Phân công Trung Chuyển (LSP02)', 'Giao việc cho shipper', NULL,
             s.shipper_ma, s.shipper_ten, s.shipper_sdt,
             k_di.kho_ma, k_di.kho_ten, k_den.kho_ma, k_den.kho_ten
      FROM thongtintrungchuyen ttc
      JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma
      JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma
      JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma
      WHERE ttc.dts_ma = $1

      UNION ALL

      -- 5. LSP02 giao tới kho
      SELECT ttc.ttc_thoidiemdi, s.shipper_ten, 'Shipper Trung Chuyển đã tới kho', ttc.ttc_ghichu, ttc.ttc_hinhanh,
             s.shipper_ma, s.shipper_ten, s.shipper_sdt,
             k_di.kho_ma, k_di.kho_ten, k_den.kho_ma, k_den.kho_ten
      FROM thongtintrungchuyen ttc
      JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma
      JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma
      JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma
      WHERE ttc.dts_ma = $1 AND ttc.ttc_thoidiemdi IS NOT NULL

      UNION ALL

      -- 6. Kho đích nhận
      SELECT ttc.ttc_thoidiemden, 'Kho Đích', 'Kho đích đã tiếp nhận', 'Đã nhận hàng từ LSP02', NULL,
             NULL, NULL, NULL,
             k_den.kho_ma, k_den.kho_ten, NULL, NULL
      FROM thongtintrungchuyen ttc
      JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma
      WHERE ttc.dts_ma = $1 AND ttc.ttc_thoidiemden IS NOT NULL

      UNION ALL

      -- 7. Phân công LSP03 (Giao hàng)
      SELECT ttgh.ttgh_thoidiemtao, 'Quản lý kho', 'Phân công Giao Hàng (LSP03)', 'Giao việc cho shipper', NULL,
             s.shipper_ma, s.shipper_ten, s.shipper_sdt,
             k.kho_ma, k.kho_ten, NULL, NULL
      FROM thongtingiaohang ttgh
      JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma
      JOIN kho k ON s.kho_ma = k.kho_ma
      WHERE ttgh.dts_ma = $1

      UNION ALL

      -- 8. LSP03 giao thành công
      SELECT ttgh.ttgh_thoidiem, s.shipper_ten, 'Shipper Giao Hàng đã giao', ttgh.ttgh_ghichu, ttgh.ttgh_hinhanh,
             s.shipper_ma, s.shipper_ten, s.shipper_sdt,
             k.kho_ma, k.kho_ten, NULL, NULL
      FROM thongtingiaohang ttgh
      JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma
      JOIN kho k ON s.kho_ma = k.kho_ma
      WHERE ttgh.dts_ma = $1 AND ttgh.ttgh_thoidiem IS NOT NULL

      ORDER BY "ThoiGian" ASC
    `;
    const timelineRes = await pool.query(timelineQuery, [dts_ma]);
    
    return { ...orderInfo, timeline: timelineRes.rows };
  }
};

module.exports = TheoDoiModel;