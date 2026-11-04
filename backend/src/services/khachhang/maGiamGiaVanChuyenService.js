const pool = require('../../config/db');

const MaGiamGiaVanChuyenService = {
  getActiveVouchers: async () => {
    const query = `
      SELECT 
        mgg_vc_ma AS "MGG_VC_Ma",
        mgg_vc_ten AS "MGG_VC_Ten",
        mgg_vc_mota AS "MGG_VC_Mota",
        mgg_vc_giatridontoithieu AS "MGG_VC_GiaTriDonToiThieu",
        mgg_vc_phantramgiam AS "MGG_VC_PhanTramGiam",
        mgg_vc_sotiengiamtoidamoilan AS "MGG_VC_SoTienToiDaMoiLan"
      FROM magiamgia_vanchuyen
      WHERE mgg_vc_trangthai = TRUE
        AND mgg_vc_soluongconlai > 0
        AND (mgg_vc_thoidiembatdau IS NULL OR mgg_vc_thoidiembatdau <= NOW())
        AND (mgg_vc_thoidiemketthuc IS NULL OR mgg_vc_thoidiemketthuc >= NOW())
      ORDER BY mgg_vc_phantramgiam DESC
    `;
    const res = await pool.query(query);
    return res.rows;
  }
};
module.exports = MaGiamGiaVanChuyenService;