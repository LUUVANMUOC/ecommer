const pool = require('../../config/db');

const MaGiamGiaService = {
  getActiveVouchers: async () => {
    const query = `
      SELECT 
        mgg_san_ma AS "MGG_San_Ma",
        mgg_san_ten AS "MGG_San_Ten",
        mgg_san_mota AS "MGG_San_Mota",
        mgg_san_hinhanh AS "MGG_San_HinhAnh",
        mgg_san_giatridontoithieu AS "MGG_San_GiaTriDonToiThieu",
        mgg_san_phantramgiam AS "MGG_San_PhanTramGiam",
        mgg_san_sotiengiamtoidamoilan AS "MGG_San_SoTienToiDaMoiLan"
      FROM magiamgiasan
      WHERE mgg_san_trangthai = TRUE
        AND mgg_san_soluongconlai > 0
        AND (mgg_san_thoidiembatdau IS NULL OR mgg_san_thoidiembatdau <= NOW())
        AND (mgg_san_thoidiemketthuc IS NULL OR mgg_san_thoidiemketthuc >= NOW())
      ORDER BY mgg_san_phantramgiam DESC
    `;
    const res = await pool.query(query);
    return res.rows;
  }
};
module.exports = MaGiamGiaService;