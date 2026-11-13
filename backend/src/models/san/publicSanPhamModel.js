// backend/src/models/san/publicSanPhamModel.js
const pool = require('../../config/db');

const PublicSanPhamModel = {
  getAllActive: async ({ page = 1, limit = 50, search = "", brand = "", category = "", sort = "newest" }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let query = `
      WITH approved_variants AS (
        SELECT ctsp.sp_ma, ctsp.ctsp_ma, ctsp.ctsp_gianban, ctsp.ctsp_ten, ctsp.ctsp_soluongton, ctsp.nh_ma,
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
        th.th_ma, th.th_ten, th.th_hinhanh,
        dm.dmsp_ma, dm.dmsp_ten,
        MIN(av.ctsp_gianban) AS min_price, MAX(av.ctsp_gianban) AS max_price,
        (SELECT image FROM approved_variants WHERE sp_ma = sp.sp_ma AND image IS NOT NULL LIMIT 1) AS cover_image,
        MIN(av.ctsp_ma) AS first_variant_id 
      FROM sanpham sp
      JOIN approved_variants av ON sp.sp_ma = av.sp_ma
      LEFT JOIN nganhhang nh ON av.nh_ma = nh.nh_ma
      LEFT JOIN thuonghieu th ON sp.th_ma = th.th_ma
      LEFT JOIN danhmucsanpham dm ON sp.dmsp_ma = dm.dmsp_ma
      WHERE 1=1
    `;

    if (search) {
      // 🟢 Tìm kiếm theo Tên, Mô tả hoặc Danh mục
      query += ` AND (sp.sp_ten ILIKE $${paramIndex} OR sp.sp_mota ILIKE $${paramIndex} OR dm.dmsp_ten ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (brand) {
      query += ` AND th.th_ma = $${paramIndex}`;
      params.push(brand);
      paramIndex++;
    }

    if (category) {
      query += ` AND (nh.nh_ma = $${paramIndex} OR nh.nh_cha = $${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    query += `
      GROUP BY 
        sp.sp_ma, sp.sp_ten, sp.sp_mota, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
        th.th_ma, th.th_ten, th.th_hinhanh, dm.dmsp_ma, dm.dmsp_ten
    `;

    if (sort === "price_asc") query += ` ORDER BY min_price ASC `;
    else if (sort === "price_desc") query += ` ORDER BY max_price DESC `;
    else if (sort === "popular") query += ` ORDER BY sp.sp_luotmua DESC `;
    else query += ` ORDER BY CASE WHEN sp.sp_ma ~ '^SP[0-9]+$' THEN CAST(SUBSTRING(sp.sp_ma FROM 3) AS INTEGER) ELSE 0 END DESC, sp.sp_ma DESC `; 

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    let countQuery = `
      WITH approved_variants AS (
        SELECT ctsp.sp_ma, ctsp.nh_ma FROM chitietsanpham ctsp
        JOIN LATERAL (
            SELECT ttctsp_ma FROM chitiettrangthaisanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY ctttsp_thoidiem DESC LIMIT 1
        ) status ON true WHERE status.ttctsp_ma = 'TTCTSP0002' AND ctsp.ctsp_soluongton > 0
      )
      SELECT COUNT(DISTINCT sp.sp_ma) FROM sanpham sp
      JOIN approved_variants av ON sp.sp_ma = av.sp_ma
      LEFT JOIN nganhhang nh ON av.nh_ma = nh.nh_ma
      LEFT JOIN thuonghieu th ON sp.th_ma = th.th_ma
      LEFT JOIN danhmucsanpham dm ON sp.dmsp_ma = dm.dmsp_ma
      WHERE 1=1
    `;
    
    const countParams = [];
    let countIndex = 1;
    if (search) {
      countQuery += ` AND (sp.sp_ten ILIKE $${countIndex} OR sp.sp_mota ILIKE $${countIndex} OR dm.dmsp_ten ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }
    if (brand) {
      countQuery += ` AND th.th_ma = $${countIndex}`;
      countParams.push(brand);
      countIndex++;
    }
    if (category) {
      countQuery += ` AND (nh.nh_ma = $${countIndex} OR nh.nh_cha = $${countIndex})`;
      countParams.push(category);
    }

    const countRes = await pool.query(countQuery, countParams);

    return { data: result.rows, total: parseInt(countRes.rows[0].count), page, limit };
  },

  getProductDetail: async (sp_ma) => {
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
    const query = `
      UPDATE chitietsanpham 
      SET ctsp_luotthich = COALESCE(ctsp_luotthich, 0) + $1 
      WHERE ctsp_ma = $2
      RETURNING ctsp_ma, ctsp_luotthich
    `;
    const delta = isLiked ? 1 : -1; 
    const result = await pool.query(query, [delta, ctsp_ma]);
    if (result.rows.length === 0) throw new Error("Không tìm thấy chi tiết sản phẩm");
    
    return { 
      message: isLiked ? "Đã thích sản phẩm" : "Đã bỏ thích", 
      data: result.rows[0] 
    };
  },

  recordView: async (ctsp_ma, kh_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
          `UPDATE chitietsanpham SET ctsp_luotxem = COALESCE(ctsp_luotxem, 0) + 1 WHERE ctsp_ma = $1`,
          [ctsp_ma]
      );
      if (kh_ma) {
          await client.query(
              `DELETE FROM chitietlichsutimkiem WHERE kh_ma = $1 AND ctsp_ma = $2`,
              [kh_ma, ctsp_ma]
          );
          await client.query(
              `INSERT INTO chitietlichsutimkiem (kh_ma, ctsp_ma, ctlstk_thoidiem) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
              [kh_ma, ctsp_ma]
          );
      }
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getViewHistory: async (kh_ma) => {
    const query = `
      SELECT 
          ls.ctlstk_thoidiem AS "ThoiGianXem",
          ctsp.ctsp_ma AS "Ctsp_Ma",
          ctsp.ctsp_ten AS "TenPhanLoai",
          ctsp.ctsp_gianban AS "GiaBan",
          sp.sp_ma AS "Sp_Ma",
          sp.sp_ten AS "TenSanPham",
          (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1) AS "Image"
      FROM chitietlichsutimkiem ls
      JOIN chitietsanpham ctsp ON ls.ctsp_ma = ctsp.ctsp_ma
      JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
      WHERE ls.kh_ma = $1
      ORDER BY ls.ctlstk_thoidiem DESC
      LIMIT 50
    `;
    const result = await pool.query(query, [kh_ma]);
    return result.rows;
  },

  getByShop: async (gh_ma, dmsp_ma) => {
    let query = `
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
      WHERE sp.gh_ma = $1
    `;
    
    const params = [gh_ma];

    if (dmsp_ma) {
        query += ` AND sp.dmsp_ma = $2`;
        params.push(dmsp_ma);
    }

    query += `
      GROUP BY 
          sp.sp_ma, sp.sp_ten, sp.sp_mota, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
          th.th_ma, th.th_ten, dm.dmsp_ma, dm.dmsp_ten
      ORDER BY sp.sp_ma DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  },
};

module.exports = PublicSanPhamModel;