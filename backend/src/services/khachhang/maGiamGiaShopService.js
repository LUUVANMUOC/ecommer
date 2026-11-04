const pool = require('../../config/db');

const MaGiamGiaShopService = {
  getActiveVouchersByShop: async (gh_ma) => {
    const query = `
      SELECT 
        mgg_shop_ma AS "MGG_Shop_Ma",
        mgg_shop_ten AS "MGG_Shop_Ten",
        mgg_shop_mota AS "MGG_Shop_Mota",
        mgg_shop_giatridontoithieu AS "MGG_Shop_GiaTriDonToiThieu",
        mgg_shop_phantramgiam AS "MGG_Shop_PhanTramGiam",
        mgg_shop_sotiengiamtoidamoilan AS "MGG_Shop_SoTienToiDaMoiLan"
      FROM magiamgia_shop 
      WHERE gh_ma = $1
        AND mgg_shop_trangthai = TRUE
        AND mgg_shop_soluongconlai > 0
        AND (mgg_shop_thoidiembatdau IS NULL OR mgg_shop_thoidiembatdau <= NOW())
        AND (mgg_shop_thoidiemketthuc IS NULL OR mgg_shop_thoidiemketthuc >= NOW())
      ORDER BY mgg_shop_phantramgiam DESC
    `;
    const result = await pool.query(query, [gh_ma]);
    return result.rows;
  }
};
module.exports = MaGiamGiaShopService;