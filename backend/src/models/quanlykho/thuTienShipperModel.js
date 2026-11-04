const pool = require('../../config/db');

const ThuTienShipperModel = {
  // Lấy danh sách đơn Shipper đã giao, chưa nộp tiền, thuộc kho này
  getDonChuaNop: async (kho_ma) => {
    const query = `
      SELECT 
        dts.dts_ma AS "DTS_Ma",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        dts.dts_ngaylap AS "NgayLap",
        gh.gh_ten AS "TenShop",
        s.shipper_ma AS "Shipper_Ma",
        s.shipper_ten AS "Shipper_Ten",
        s.shipper_sdt AS "Shipper_SDT"
      FROM thongtingiaohang ttgh
      JOIN donhangtheoshop dts ON ttgh.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma
      WHERE s.kho_ma = $1
        AND dts.dts_trangthaithanhtoan = true
        AND ttgh.ttgh_da_nop_tien = false
        AND ttgh.ttgh_thoidiem IS NOT NULL
      ORDER BY s.shipper_ma, dts.dts_ma ASC
    `;
    const res = await pool.query(query, [kho_ma]);
    return res.rows;
  },

  // Cập nhật trạng thái đã nộp tiền
  xacNhanThuTien: async (ds_dts_ma) => {
    const query = `
      UPDATE thongtingiaohang 
      SET ttgh_da_nop_tien = true, ttgh_thoidiem_nop = NOW()
      WHERE dts_ma = ANY($1::varchar[])
    `;
    const res = await pool.query(query, [ds_dts_ma]);
    return res.rowCount;
  }
};

module.exports = ThuTienShipperModel;