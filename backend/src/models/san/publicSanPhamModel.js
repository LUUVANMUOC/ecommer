// backend/src/models/san/publicSanPhamModel.js
const pool = require('../../config/db');

const PublicSanPhamModel = {
  getAllActive: async () => {
    const query = `
      WITH approved_variants AS (
        SELECT ctsp.sp_ma, ctsp.ctsp_ma, ctsp.ctsp_gianban, ctsp.ctsp_ten, ctsp.ctsp_soluongton,
               (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1) AS image
        FROM chitietsanpham ctsp
        JOIN LATERAL (
            SELECT ttctsp_ma FROM chitiettrangthaisanpham 
            WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY ctttsp_thoidiem DESC LIMIT 1
        ) status ON true
        WHERE status.ttctsp_ma = 'TTCTSP0002' AND ctsp.ctsp_soluongton > 0
      )
      SELECT 
        sp.sp_ma, sp.sp_ten, sp.sp_mota, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
        th.th_ma, th.th_ten,
        dm.dmsp_ma, dm.dmsp_ten,
        MIN(av.ctsp_gianban) AS min_price, MAX(av.ctsp_gianban) AS max_price,
        (SELECT image FROM approved_variants WHERE sp_ma = sp.sp_ma AND image IS NOT NULL LIMIT 1) AS cover_image,
        MIN(av.ctsp_ma) AS first_variant_id 
      FROM sanpham sp
      JOIN approved_variants av ON sp.sp_ma = av.sp_ma
      LEFT JOIN thuonghieu th ON sp.th_ma = th.th_ma
      LEFT JOIN danhmucsanpham dm ON sp.dmsp_ma = dm.dmsp_ma
      GROUP BY 
        sp.sp_ma, sp.sp_ten, sp.sp_mota, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
        th.th_ma, th.th_ten, dm.dmsp_ma, dm.dmsp_ten
      ORDER BY sp.sp_ma DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  getProductDetail: async (sp_ma) => {
    // ✅ SỬA LẠI CÂU QUERY: Thêm JOIN với bảng gianhang (gh) để lấy gh_ten và gh_hinhanh
    const productQuery = `
      SELECT 
        sp.*, 
        gh.gh_ten, 
        gh.gh_hinhanh 
      FROM sanpham sp
      LEFT JOIN gianhang gh ON sp.gh_ma = gh.gh_ma
      WHERE sp.sp_ma = $1
    `;
    const productRes = await pool.query(productQuery, [sp_ma]);
    const product = productRes.rows[0];
    if (!product) return null;

    const variantsQuery = `
      SELECT 
        ctsp.*, nh.nh_ten, gb.gb_gia,
        COALESCE(
            (SELECT json_agg(json_build_object(
                'hasp_ma', ha.hasp_ma, 'hasp_link', ha.hasp_link, 
                'hasp_mota', ha.hasp_mota, 'hasp_laanhchinh', ha.hasp_laanhchinh
            ) ORDER BY ha.hasp_laanhchinh DESC) 
            FROM hinhanhsanpham ha WHERE ha.ctsp_ma = ctsp.ctsp_ma), '[]'::json
        ) AS images,
        COALESCE(
            (SELECT json_agg(json_build_object(
                'ttsp_ma', gt.ttsp_ma, 'ttsp_ten', ttsp.thsp_ten, 
                'gttt_giatridinhtinh', gt.gttt_giatridinhtinh, 
                'gttt_giatridinhluong', gt.gttt_giatridinhluong
            )) FROM giatrithuoctinh gt
            LEFT JOIN thuoctinhsanpham ttsp ON gt.ttsp_ma = ttsp.thsp_ma
            WHERE gt.ctsp_ma = ctsp.ctsp_ma), '[]'::json
        ) AS thuoctinh
      FROM chitietsanpham ctsp
      LEFT JOIN nganhhang nh ON ctsp.nh_ma = nh.nh_ma
      LEFT JOIN LATERAL (
          SELECT gb_gia FROM giabangoc WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY gb_thoidiem DESC LIMIT 1
      ) gb ON true
      JOIN LATERAL (
          SELECT ttctsp_ma FROM chitiettrangthaisanpham 
          WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY ctttsp_thoidiem DESC LIMIT 1
      ) status ON true
      WHERE ctsp.sp_ma = $1 AND status.ttctsp_ma = 'TTCTSP0002'
     ORDER BY ctsp.ctsp_ngaytao ASC, ctsp.ctsp_ma ASC
    `;
    const variantsRes = await pool.query(variantsQuery, [sp_ma]);
    if (variantsRes.rows.length === 0) return null;

    return { ...product, variants: variantsRes.rows };
  },
  toggleLike: async (ctsp_ma, isLiked) => {
    // Nếu DB của bạn có cột ctsp_luotthich (số nguyên), ta tăng/giảm 1 đơn vị
    const query = `
      UPDATE chitietsanpham 
      SET ctsp_luotthich = COALESCE(ctsp_luotthich, 0) + $1 
      WHERE ctsp_ma = $2
      RETURNING ctsp_ma, ctsp_luotthich
    `;
    
    // isLiked = true (thêm 1), false (trừ 1)
    const delta = isLiked ? 1 : -1; 
    
    const result = await pool.query(query, [delta, ctsp_ma]);
    
    if (result.rows.length === 0) {
      throw new Error("Không tìm thấy chi tiết sản phẩm");
    }
    
    return { 
      message: isLiked ? "Đã thích sản phẩm" : "Đã bỏ thích", 
      data: result.rows[0] 
    };
  }
};

module.exports = PublicSanPhamModel;