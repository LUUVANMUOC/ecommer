const pool = require('../../config/db');

const DongTienModel = {
  // 1. Lấy dữ liệu dòng tiền cho Admin
  getDongTienAdmin: async () => {
    const query = `
      SELECT 
        ptt.ptt_ma, 
        ptt.ptt_ngay_tat_toan, 
        ptt.ptt_trang_thai_thanh_toan,
        ptt.ptt_tong_tien_san AS tong_phi_san,
        ptt.ptt_tong_tien_shop AS tong_tien_shop,
        k.kho_ten AS ten_kho,
        (SELECT COUNT(*) FROM chitiet_tat_toan WHERE ptt_ma = ptt.ptt_ma) AS so_don_hang
      FROM phieu_tat_toan ptt
      JOIN kho k ON ptt.kho_ma = k.kho_ma
      ORDER BY ptt.ptt_ngay_tat_toan DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // 2. Lấy dữ liệu dòng tiền cho một Shop cụ thể
  getDongTienShop: async (gh_ma) => {
    const query = `
      SELECT 
        dts.dts_ma,
        dts.dts_ngaylap,
        dts.dts_tongtienhang AS tien_hang_goc,
        dts.dts_tongtienphisan AS phi_san,
        (dts.dts_tongtienhang - COALESCE(dts.dts_tonggiamgiashop, 0)) AS tien_shop_nhan,
        ptt.ptt_ma,
        ptt.ptt_trang_thai_thanh_toan,
        qr.qr_trang_thai AS trang_thai_qr
      FROM donhangtheoshop dts
      JOIN chitiet_tat_toan ctt ON dts.dts_ma = ctt.dts_ma
      JOIN phieu_tat_toan ptt ON ctt.ptt_ma = ptt.ptt_ma
      LEFT JOIN qr_thanh_toan qr ON qr.ptt_ma = ptt.ptt_ma AND qr.gh_ma = dts.gh_ma
      WHERE dts.gh_ma = $1
      ORDER BY dts.dts_ngaylap DESC
    `;
    const result = await pool.query(query, [gh_ma]);
    return result.rows;
  }
};

module.exports = DongTienModel;