const pool = require('../../config/db');

const BASE_FROM = `
      FROM danhgiasanpham dg
      JOIN donhangtheoshop dts ON dts.dts_ma = dg.dts_ma
      JOIN chitietsanpham ctsp ON ctsp.ctsp_ma = dg.ctsp_ma
      JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
      LEFT JOIN khachhang kh ON kh.kh_ma = dg.kh_ma
`;

const buildWhere = (gh_ma, opts = {}) => {
  const conds = ['dts.gh_ma = $1'];
  const params = [gh_ma];

  const sao = parseInt(opts.sao, 10);
  if (sao >= 1 && sao <= 5) {
    params.push(sao);
    conds.push(`dg.dgsp_sao = $${params.length}`);
  }

  const trangThai = String(opts.phan_hoi || '').trim();
  if (trangThai === 'chua') {
    conds.push(`(dg.dgsp_phanhoi IS NULL OR btrim(dg.dgsp_phanhoi) = '')`);
  } else if (trangThai === 'da') {
    conds.push(`(dg.dgsp_phanhoi IS NOT NULL AND btrim(dg.dgsp_phanhoi) <> '')`);
  }

  return { where: conds.join(' AND '), params };
};

const DanhGiaShopModel = {
  // Danh sách đánh giá của shop + thống kê
  getByShop: async (gh_ma, opts = {}) => {
    const page = Math.max(1, parseInt(opts.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(opts.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { where, params } = buildWhere(gh_ma, opts);

    const listQuery = `
      SELECT
        dg.dts_ma, dg.ctsp_ma, dg.kh_ma,
        dg.dgsp_sao, dg.dgsp_mota, dg.dgsp_hinhanh,
        dg.dgsp_phanhoi, dg.dgsp_thoidiemphanhoi, dg.dgsp_thoidiem,
        ctsp.ctsp_ten,
        sp.sp_ma, sp.sp_ten,
        (SELECT hasp_link FROM hinhanhsanpham
         WHERE ctsp_ma = ctsp.ctsp_ma
         ORDER BY hasp_laanhchinh DESC LIMIT 1) AS sp_hinhanh,
        kh.kh_ten, kh.kh_avatar
      ${BASE_FROM}
      WHERE ${where}
      ORDER BY dg.dgsp_thoidiem DESC, dg.ctsp_ma ASC, dg.kh_ma ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      ${BASE_FROM}
      WHERE ${where}
    `;

    // Thống kê luôn tính trên TOÀN BỘ đánh giá của shop (không theo bộ lọc)
    const statsQuery = `
      SELECT
        COUNT(*)::int AS tong,
        COUNT(*) FILTER (WHERE dg.dgsp_phanhoi IS NULL OR btrim(dg.dgsp_phanhoi) = '')::int AS chua_phan_hoi,
        COALESCE(AVG(dg.dgsp_sao), 0)::numeric(3,2) AS trung_binh,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 5)::int AS sao5,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 4)::int AS sao4,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 3)::int AS sao3,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 2)::int AS sao2,
        COUNT(*) FILTER (WHERE dg.dgsp_sao = 1)::int AS sao1
      ${BASE_FROM}
      WHERE dts.gh_ma = $1
    `;

    const [listRes, countRes, statsRes] = await Promise.all([
      pool.query(listQuery, [...params, limit, offset]),
      pool.query(countQuery, params),
      pool.query(statsQuery, [gh_ma]),
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
        tong: parseInt(s.tong, 10) || 0,
        chua_phan_hoi: parseInt(s.chua_phan_hoi, 10) || 0,
        trung_binh: Number(s.trung_binh) || 0,
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

  // Shop phản hồi / sửa phản hồi (có kiểm tra quyền sở hữu đơn)
  phanHoi: async ({ gh_ma, dts_ma, ctsp_ma, kh_ma, phanhoi }) => {
    const check = await pool.query(
      `SELECT 1 FROM donhangtheoshop WHERE dts_ma = $1 AND gh_ma = $2`,
      [dts_ma, gh_ma]
    );
    if (check.rows.length === 0) {
      throw new Error('Bạn không có quyền phản hồi đánh giá này!');
    }

    const result = await pool.query(
      `UPDATE danhgiasanpham
       SET dgsp_phanhoi = $1, dgsp_thoidiemphanhoi = NOW()
       WHERE dts_ma = $2 AND ctsp_ma = $3 AND kh_ma = $4
       RETURNING dgsp_phanhoi, dgsp_thoidiemphanhoi`,
      [phanhoi, dts_ma, ctsp_ma, kh_ma]
    );

    if (result.rowCount === 0) {
      throw new Error('Không tìm thấy đánh giá cần phản hồi!');
    }

    return { message: 'Đã gửi phản hồi!', data: result.rows[0] };
  },
};

module.exports = DanhGiaShopModel;