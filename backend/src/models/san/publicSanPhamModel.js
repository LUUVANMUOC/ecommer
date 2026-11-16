// backend/src/models/san/publicSanPhamModel.js
const pool = require('../../config/db');

const PublicSanPhamModel = {
  getAllActive: async ({ page = 1, limit = 50, search = "", brand = "", sort = "newest" }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

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
        th.th_ma, th.th_ten, th.th_hinhanh,
        dm.dmsp_ma, dm.dmsp_ten,
        MIN(av.ctsp_gianban) AS min_price, MAX(av.ctsp_gianban) AS max_price,
        (SELECT image FROM approved_variants WHERE sp_ma = sp.sp_ma AND image IS NOT NULL LIMIT 1) AS cover_image,
        MIN(av.ctsp_ma) AS first_variant_id 
      FROM sanpham sp
      JOIN approved_variants av ON sp.sp_ma = av.sp_ma
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

    query += `
      GROUP BY 
        sp.sp_ma, sp.sp_ten, sp.sp_mota, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
        th.th_ma, th.th_ten, th.th_hinhanh, dm.dmsp_ma, dm.dmsp_ten
    `;

    if (sort === "price_asc") query += ` ORDER BY min_price ASC `;
    else if (sort === "price_desc") query += ` ORDER BY max_price DESC `;
    else if (sort === "popular") query += ` ORDER BY sp.sp_luotmua DESC `;
    else query += ` ORDER BY sp.sp_ma DESC `; 

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    let countQuery = `
      WITH approved_variants AS (
        SELECT ctsp.sp_ma FROM chitietsanpham ctsp
        JOIN LATERAL (
            SELECT ttctsp_ma FROM chitiettrangthaisanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY ctttsp_thoidiem DESC LIMIT 1
        ) status ON true WHERE status.ttctsp_ma = 'TTCTSP0002' AND ctsp.ctsp_soluongton > 0
      )
      SELECT COUNT(DISTINCT sp.sp_ma) FROM sanpham sp
      JOIN approved_variants av ON sp.sp_ma = av.sp_ma
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

  // Danh sách sản phẩm của 1 shop.
  // Hỗ trợ tìm kiếm / lọc thương hiệu / sắp xếp / phân trang giống getAllActive.
  // Tương thích ngược: getByShop(gh_ma, "DMSP001") vẫn chạy.
  getByShop: async (gh_ma, opts = {}) => {
    const o = typeof opts === "string" ? { dmsp_ma: opts } : opts || {};

    const dmsp_ma = o.dmsp_ma || "";
    const search = String(o.search || "").trim();
    const brand = String(o.brand || "").trim();
    const sort = o.sort || "newest";
    const page = Math.max(1, parseInt(o.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(o.limit, 10) || 20));
    const offset = (page - 1) * limit;

    // $1 luôn là gh_ma, các điều kiện lọc bắt đầu từ $2
    const buildFilter = () => {
      let where = "";
      const params = [];
      let i = 2;

      if (dmsp_ma) {
        where += ` AND sp.dmsp_ma = $${i}`;
        params.push(dmsp_ma);
        i++;
      }

      if (brand) {
        where += ` AND th.th_ma = $${i}`;
        params.push(brand);
        i++;
      }

      if (search) {
        where += ` AND (sp.sp_ten ILIKE $${i} OR sp.sp_mota ILIKE $${i} OR dm.dmsp_ten ILIKE $${i})`;
        params.push(`%${search}%`);
        i++;
      }

      return { where, params, next: i };
    };

    const approved = `
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
    `;

    // ---------- Lấy dữ liệu ----------
    const filter = buildFilter();

    let orderBy = "sp.sp_ma DESC";
    if (sort === "price_asc") orderBy = "min_price ASC, sp.sp_ma DESC";
    else if (sort === "price_desc") orderBy = "max_price DESC, sp.sp_ma DESC";
    else if (sort === "popular") orderBy = "sp.sp_luotmua DESC, sp.sp_ma DESC";

    const listQuery = `
      ${approved}
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
      ${filter.where}
      GROUP BY 
          sp.sp_ma, sp.sp_ten, sp.sp_mota, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
          th.th_ma, th.th_ten, dm.dmsp_ma, dm.dmsp_ten
      ORDER BY ${orderBy}
      LIMIT $${filter.next} OFFSET $${filter.next + 1}
    `;

    // ---------- Đếm tổng (cùng điều kiện lọc) ----------
    const countFilter = buildFilter();

    const countQuery = `
      ${approved}
      SELECT COUNT(DISTINCT sp.sp_ma) AS count
      FROM sanpham sp
      JOIN approved_variants av ON sp.sp_ma = av.sp_ma
      LEFT JOIN thuonghieu th ON sp.th_ma = th.th_ma
      LEFT JOIN danhmucsanpham dm ON sp.dmsp_ma = dm.dmsp_ma
      WHERE sp.gh_ma = $1
      ${countFilter.where}
    `;

    const [listRes, countRes] = await Promise.all([
      pool.query(listQuery, [gh_ma, ...filter.params, limit, offset]),
      pool.query(countQuery, [gh_ma, ...countFilter.params]),
    ]);

    const total = parseInt(countRes.rows[0]?.count, 10) || 0;

    return { data: listRes.rows, total, page, limit };
  },

  // ==========================================================
  // ĐÁNH GIÁ SẢN PHẨM (public)
  // - Lọc theo số sao và theo phân loại (ctsp_ma)
  // - total / total_pages theo bộ lọc đang áp dụng
  // - thong_ke luôn tính trên TOÀN BỘ đánh giá của sản phẩm
  // ==========================================================
  getDanhGiaSanPham: async (sp_ma, opts = {}) => {
    const page = Math.max(1, parseInt(opts.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(opts.limit, 10) || 5));
    const offset = (page - 1) * limit;

    const saoRaw = parseInt(opts.sao, 10);
    const sao = saoRaw >= 1 && saoRaw <= 5 ? saoRaw : null;
    const ctsp_ma = String(opts.ctsp_ma || "").trim() || null;

    // Điều kiện lọc dựng động để không truyền tham số thừa cho PostgreSQL
    const conds = [`sp.sp_ma = $1`];
    const filterParams = [sp_ma];

    if (sao !== null) {
      filterParams.push(sao);
      conds.push(`dg.dgsp_sao = $${filterParams.length}`);
    }
    if (ctsp_ma) {
      filterParams.push(ctsp_ma);
      conds.push(`dg.ctsp_ma = $${filterParams.length}`);
    }
    const where = conds.join(" AND ");

    const listQuery = `
      SELECT
        dg.dts_ma, dg.ctsp_ma, dg.kh_ma,
        dg.dgsp_sao, dg.dgsp_mota, dg.dgsp_hinhanh,
        dg.dgsp_phanhoi, dg.dgsp_thoidiemphanhoi, dg.dgsp_thoidiem,
        ctsp.ctsp_ten,
        kh.kh_ten, kh.kh_avatar
      FROM danhgiasanpham dg
      JOIN chitietsanpham ctsp ON ctsp.ctsp_ma = dg.ctsp_ma
      JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
      LEFT JOIN khachhang kh ON kh.kh_ma = dg.kh_ma
      WHERE ${where}
      ORDER BY dg.dgsp_thoidiem DESC, dg.ctsp_ma ASC, dg.kh_ma ASC
      LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM danhgiasanpham dg
      JOIN chitietsanpham ctsp ON ctsp.ctsp_ma = dg.ctsp_ma
      JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
      WHERE ${where}
    `;

    const statsQuery = `
      SELECT
        COALESCE(AVG(dg.dgsp_sao), 0)::numeric(3,2) AS trung_binh,
        COUNT(*)::int AS tong,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 5)::int AS sao5,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 4)::int AS sao4,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 3)::int AS sao3,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 2)::int AS sao2,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 1)::int AS sao1
      FROM danhgiasanpham dg
      JOIN chitietsanpham ctsp ON ctsp.ctsp_ma = dg.ctsp_ma
      WHERE ctsp.sp_ma = $1
    `;

    const [listRes, countRes, statsRes] = await Promise.all([
      pool.query(listQuery, [...filterParams, limit, offset]),
      pool.query(countQuery, filterParams),
      pool.query(statsQuery, [sp_ma]),
    ]);

    const total = parseInt(countRes.rows[0]?.total, 10) || 0;
    const s = statsRes.rows[0] || {};

    return {
      data: listRes.rows,
      total,
      page,
      limit,
      total_pages: total > 0 ? Math.ceil(total / limit) : 0,
      thong_ke: {
        trung_binh: Number(s.trung_binh) || 0,
        tong: parseInt(s.tong, 10) || 0,
        phan_bo: {
          5: parseInt(s.sao5, 10) || 0,
          4: parseInt(s.sao4, 10) || 0,
          3: parseInt(s.sao3, 10) || 0,
          2: parseInt(s.sao2, 10) || 0,
          1: parseInt(s.sao1, 10) || 0,
        },
      },
    };
  },
};

module.exports = PublicSanPhamModel;