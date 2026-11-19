const pool = require('../../config/db');

const QLKPhanCongModel = {
  // 1. Lấy danh sách đơn hàng đang "Chờ lấy hàng" (TTDH02) thuộc Kho này
  getPendingOrders: async (kho_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        dts.dts_thoidiemdukiengiao AS "NgayGiaoDuKien",
        
        gh.gh_ten AS "TenShop",
        dc.dc_mota AS "DiaChiLayHang",
        x_shop.xa_ten AS "Xa_LayHang",
        t_shop.tinh_ten AS "Tinh_LayHang",
        
        k.kho_ma AS "Kho_Ma",
        k.kho_ten AS "Kho_Ten",
        dc_kho.dc_mota AS "Kho_DiaChi",
        x_kho.xa_ten AS "Kho_Xa",
        t_kho.tinh_ten AS "Kho_Tinh"
        
      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN diachi dc ON dts.dc_layhangma = dc.dc_ma
      LEFT JOIN xaphuong x_shop ON dc.xa_ma = x_shop.xa_ma
      LEFT JOIN tinhtp t_shop ON x_shop.tinh_ma = t_shop.tinh_ma
      
      -- Đảm bảo địa chỉ lấy hàng (Shop) cùng Xã với Kho hiện tại
      JOIN kho k ON dc.xa_ma = (SELECT xa_ma FROM diachi WHERE dc_ma = k.dc_ma)
      LEFT JOIN diachi dc_kho ON k.dc_ma = dc_kho.dc_ma
      LEFT JOIN xaphuong x_kho ON dc_kho.xa_ma = x_kho.xa_ma
      LEFT JOIN tinhtp t_kho ON x_kho.tinh_ma = t_kho.tinh_ma
      
      WHERE k.kho_ma = $1
        AND (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) = 'TTDH02'
        AND NOT EXISTS (SELECT 1 FROM thongtinlayhang WHERE dts_ma = dts.dts_ma)
      ORDER BY dts.dts_ngaylap ASC
    `;
    const res = await pool.query(query, [kho_ma]);
    return res.rows;
  },

  // 2. Lấy danh sách Shipper LSP01 thuộc Kho này
  getShippersByKho: async (kho_ma) => {
    const query = `
      SELECT shipper_ma AS "Shipper_Ma", shipper_ten AS "Shipper_Ten", shipper_sdt AS "Shipper_SDT"
      FROM shipper 
      WHERE kho_ma = $1 AND lsp_ma = 'LSP01'
    `;
    const res = await pool.query(query, [kho_ma]);
    return res.rows;
  },

  // 3. Phân công Shipper
  // Guard: chỉ chèn khi đơn CHƯA có thông tin lấy hàng và vẫn đang ở TTDH02.
  // Trả về null nếu đơn đã bị người khác phân công / không còn chờ lấy hàng.
  assignShipper: async (dts_ma, shipper_ma) => {
    const query = `
      INSERT INTO thongtinlayhang (dts_ma, shipper_ma, ttlh_thoidiemtao)
      SELECT $1::varchar, $2::varchar, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM thongtinlayhang WHERE dts_ma = $1::varchar)
        AND EXISTS (
          SELECT 1 FROM donhangtheoshop dts
          WHERE dts.dts_ma = $1::varchar
            AND (SELECT ttdh_ma FROM chitiettrangthaidonhang
                 WHERE dts_ma = dts.dts_ma
                 ORDER BY ctttdh_thoidiem DESC LIMIT 1) = 'TTDH02'
        )
      RETURNING *;
    `;
    const res = await pool.query(query, [dts_ma, shipper_ma]);
    return res.rows[0] || null;
  }
};

module.exports = QLKPhanCongModel;