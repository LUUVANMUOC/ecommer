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
        
        k.kho_ma AS "Kho_Ma",
        k.kho_ten AS "Kho_Ten"
        
      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN diachi dc ON dts.dc_layhangma = dc.dc_ma
      
      -- Đảm bảo địa chỉ lấy hàng (Shop) cùng Xã với Kho hiện tại
      JOIN kho k ON dc.xa_ma = (SELECT xa_ma FROM diachi WHERE dc_ma = k.dc_ma)
      
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
  assignShipper: async (dts_ma, shipper_ma) => {
    const query = `
      INSERT INTO thongtinlayhang (dts_ma, shipper_ma, ttlh_thoidiemtao)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const res = await pool.query(query, [dts_ma, shipper_ma]);
    return res.rows[0];
  }
};

module.exports = QLKPhanCongModel;