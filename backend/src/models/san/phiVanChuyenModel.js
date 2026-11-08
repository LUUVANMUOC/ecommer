const pool = require('../../config/db');

const PhiVanChuyenModel = {
  // Lấy danh sách phí vận chuyển (Dùng chung cho Admin và ĐVVC)
  getDanhSachPhiVanChuyen: async (role, ma_doi_tuong = null) => {
    let query = `
      SELECT 
        o.dts_ma,
        o.dts_ngaylap,
        o.dvvc_ma,
        d.dvvc_ten,
        o.dts_tienvanchuyen AS phi_ship_goc,
        o.dts_tonggiamgiavanchuyen AS voucher_ship,
        p.pcd_ma,
        p.pcd_trang_thai AS trang_thai_phieu
      FROM donhangtheoshop o
      JOIN donvivanchuyen d ON o.dvvc_ma = d.dvvc_ma
      LEFT JOIN chitiet_chi_dvvc c ON o.dts_ma = c.dts_ma
      LEFT JOIN phieu_chi_dvvc p ON c.pcd_ma = p.pcd_ma
      WHERE 1=1
    `;
    
    const values = [];
    if (role === 'DVVC') {
      query += ` AND o.dvvc_ma = $1`;
      values.push(ma_doi_tuong);
    }
    
    query += ` ORDER BY o.dts_ngaylap DESC`;

    const result = await pool.query(query, values);
    
    // Xử lý logic trạng thái và ghi chú
    return result.rows.map(row => {
      let trang_thai = 'KHONG_GIAM_GIA';
      let ghi_chu = 'Khách trả đủ phí ship, Sàn không chi trả';

      // Nếu có voucher ship (>0) tức là Sàn có trách nhiệm chi trả
      if (Number(row.voucher_ship) > 0) {
        if (row.pcd_ma && row.trang_thai_phieu === 'DA_THANH_TOAN') {
          trang_thai = 'DA_CHI';
          ghi_chu = `Đã chi trả qua phiếu ${row.pcd_ma}`;
        } else {
          trang_thai = 'CHUA_CHI';
          ghi_chu = `Chờ Sàn thanh toán voucher ship`;
        }
      }

      return { ...row, trang_thai, ghi_chu };
    });
  }
};

module.exports = PhiVanChuyenModel;