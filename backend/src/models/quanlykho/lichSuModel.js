const pool = require('../../config/db');

const LichSuModel = {
  getLichSuKho: async (kho_ma) => {
    const query = `
      -- 1. Phân công LSP01
      SELECT ttlh.dts_ma AS "DTS_Ma", 'Phân công LSP01' AS "HanhDong", ttlh.ttlh_thoidiemtao AS "ThoiGian", s.shipper_ten AS "NguoiThucHien"
      FROM thongtinlayhang ttlh
      JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
      WHERE s.kho_ma = $1

      UNION ALL

      -- 2. Gửi trung chuyển
      SELECT ttc.dts_ma, 'Gửi trung chuyển (LSP02)', ttc.ttc_thoidiemtao, s.shipper_ten
      FROM thongtintrungchuyen ttc
      JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma
      WHERE ttc.kho_di_ma = $1

      UNION ALL

      -- 3. Nhận trung chuyển
      SELECT ttc.dts_ma, 'Đã nhận hàng từ Kho đi', ttc.ttc_thoidiemden, 'Kho Đích'
      FROM thongtintrungchuyen ttc
      WHERE ttc.kho_den_ma = $1 AND ttc.ttc_thoidiemden IS NOT NULL

      UNION ALL

      -- 4. Phân công LSP03
      SELECT ttgh.dts_ma, 'Phân công LSP03', ttgh.ttgh_thoidiemtao, s.shipper_ten
      FROM thongtingiaohang ttgh
      JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma
      WHERE s.kho_ma = $1
      
      ORDER BY "ThoiGian" DESC
    `;
    const res = await pool.query(query, [kho_ma]);
    return res.rows;
  }
};
module.exports = LichSuModel;