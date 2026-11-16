const pool = require('../../config/db');

/* =========================================================
   Bỏ dấu tiếng Việt ngay trong SQL (không cần extension unaccent)
   → gõ "ao thun" vẫn tìm được "Áo thun"
   ========================================================= */
const NHOM_DAU = {
    a: 'áàảãạăắằẳẵặâấầẩẫậÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ',
    e: 'éèẻẽẹêếềểễệÉÈẺẼẸÊẾỀỂỄỆ',
    i: 'íìỉĩịÍÌỈĨỊ',
    o: 'óòỏõọôốồổỗộơớờởỡợÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ',
    u: 'úùủũụưứừửữựÚÙỦŨỤƯỨỪỬỮỰ',
    y: 'ýỳỷỹỵÝỲỶỸỴ',
    d: 'đĐ',
};
const TU = Object.values(NHOM_DAU).join('');
const DEN = Object.entries(NHOM_DAU)
    .map(([goc, ds]) => goc.repeat(ds.length))
    .join('');

// lower(translate(x, $6, $7)) → chuỗi không dấu, không phân biệt hoa/thường
const norm = (expr) => `lower(translate(${expr}, $6::text, $7::text))`;
const normKeyword = `lower(translate($2::text, $6::text, $7::text))`;

/* =========================================================
   CTE dùng chung: lọc + ảnh bìa + khoảng giá + trạng thái + ngày duyệt
   Tham số: $1 gh_ma, $2 q, $3 th_ma, $4 dmsp_ma,
            $5 status, $6 TU, $7 DEN
   (LIMIT/OFFSET là $8/$9, chỉ dùng ở câu chính)
   Bộ lọc nâng cao KHÔNG thêm tham số — xem các bảng tra bên dưới.
   ========================================================= */
const CTE = `
WITH sp_loc AS (
    SELECT
        sp.sp_ma, sp.sp_ten, sp.sp_mota,
        sp.sp_luotxem, sp.sp_luotthich, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
        sp.gh_ma, sp.th_ma, sp.dmsp_ma,
        th.th_ten,
        dm.dmsp_ten
    FROM sanpham sp
    LEFT JOIN thuonghieu th ON sp.th_ma = th.th_ma
    LEFT JOIN danhmucsanpham dm ON sp.dmsp_ma = dm.dmsp_ma
    WHERE sp.gh_ma = $1
      AND (
        $2::text IS NULL
        OR ${norm('sp.sp_ma')} LIKE '%' || ${normKeyword} || '%'
        OR ${norm('sp.sp_ten')} LIKE '%' || ${normKeyword} || '%'
        OR EXISTS (
            SELECT 1
            FROM chitietsanpham c
            WHERE c.sp_ma = sp.sp_ma
              AND ${norm('c.ctsp_ten')} LIKE '%' || ${normKeyword} || '%'
        )
      )
      AND ($3::text IS NULL OR sp.th_ma = $3)
      AND ($4::text IS NULL OR sp.dmsp_ma = $4)
),
anh_bia AS (
    SELECT DISTINCT ON (c.sp_ma)
        c.sp_ma,
        ha.hasp_link AS cover_url
    FROM chitietsanpham c
    JOIN hinhanhsanpham ha ON ha.ctsp_ma = c.ctsp_ma
    WHERE c.sp_ma IN (SELECT sp_ma FROM sp_loc)
    ORDER BY c.sp_ma, ha.hasp_laanhchinh DESC, ha.hasp_thutu ASC, ha.hasp_ma ASC
),
gia_ban AS (
    SELECT
        c.sp_ma,
        MIN(gb.gb_gia) AS min_price,
        MAX(gb.gb_gia) AS max_price
    FROM chitietsanpham c
    JOIN LATERAL (
        SELECT g.gb_gia
        FROM giabangoc g
        WHERE g.ctsp_ma = c.ctsp_ma
        ORDER BY g.gb_thoidiem DESC, g.gb_ma DESC
        LIMIT 1
    ) gb ON true
    WHERE c.sp_ma IN (SELECT sp_ma FROM sp_loc)
      AND gb.gb_gia > 0
    GROUP BY c.sp_ma
),
trang_thai AS (
    SELECT
        c.sp_ma,
        COUNT(DISTINCT c.ctsp_ma) AS so_phan_loai,
        CASE
            WHEN bool_or(l.ttctsp_ma = 'TTCTSP0002') THEN 'active'
            WHEN bool_or(l.ttctsp_ma = 'TTCTSP0001') THEN 'pending'
            WHEN bool_or(l.ttctsp_ma = 'TTCTSP0003') THEN 'suspended'
            ELSE 'draft'
        END AS status
    FROM chitietsanpham c
    LEFT JOIN LATERAL (
        SELECT x.ttctsp_ma
        FROM chitiettrangthaisanpham x
        WHERE x.ctsp_ma = c.ctsp_ma
        ORDER BY x.ctttsp_thoidiem DESC, x.ttctsp_ma DESC
        LIMIT 1
    ) l ON true
    WHERE c.sp_ma IN (SELECT sp_ma FROM sp_loc)
    GROUP BY c.sp_ma
),
/* Thời điểm được duyệt gần nhất (TTCTSP0002 = Đang bán) */
duyet AS (
    SELECT
        c.sp_ma,
        MAX(x.ctttsp_thoidiem) AS duyet_luc
    FROM chitietsanpham c
    JOIN chitiettrangthaisanpham x ON x.ctsp_ma = c.ctsp_ma
    WHERE c.sp_ma IN (SELECT sp_ma FROM sp_loc)
      AND x.ttctsp_ma = 'TTCTSP0002'
    GROUP BY c.sp_ma
),
base AS (
    SELECT
        s.*,
        COALESCE(tt.status, 'draft') AS status,
        COALESCE(tt.so_phan_loai, 0) AS so_phan_loai,
        COALESCE(s.sp_diemdanhgiatrungbinh, 0) AS sao_tb,
        ab.cover_url,
        gb.min_price,
        gb.max_price,
        dy.duyet_luc
    FROM sp_loc s
    LEFT JOIN trang_thai tt ON tt.sp_ma = s.sp_ma
    LEFT JOIN anh_bia ab ON ab.sp_ma = s.sp_ma
    LEFT JOIN gia_ban gb ON gb.sp_ma = s.sp_ma
    LEFT JOIN duyet dy ON dy.sp_ma = s.sp_ma
)
`;

const LOC_STATUS = `($5::text IS NULL OR status = $5)`;

/* =========================================================
   Bộ lọc nâng cao: mã lọc (whitelist ở controller) → điều kiện SQL
   Không dùng thêm tham số nên $8/$9 vẫn là LIMIT/OFFSET.
   ========================================================= */
const SAO_LOC = {
    '5': `base.sao_tb >= 4.5`,
    '4': `base.sao_tb >= 4 AND base.sao_tb < 4.5`,
    '3': `base.sao_tb >= 3 AND base.sao_tb < 4`,
    '2': `base.sao_tb >= 2 AND base.sao_tb < 3`,
    '1': `base.sao_tb > 0 AND base.sao_tb < 2`,
    '0': `base.sao_tb = 0`,
};

const MUA_LOC = {
    '0': `COALESCE(base.sp_luotmua, 0) = 0`,
    '1-10': `base.sp_luotmua BETWEEN 1 AND 10`,
    '11-50': `base.sp_luotmua BETWEEN 11 AND 50`,
    '51-200': `base.sp_luotmua BETWEEN 51 AND 200`,
    '200+': `base.sp_luotmua > 200`,
};

const XEM_LOC = {
    '0': `COALESCE(base.sp_luotxem, 0) = 0`,
    '1-100': `base.sp_luotxem BETWEEN 1 AND 100`,
    '101-1000': `base.sp_luotxem BETWEEN 101 AND 1000`,
    '1001-10000': `base.sp_luotxem BETWEEN 1001 AND 10000`,
    '10000+': `base.sp_luotxem > 10000`,
};

// Giá: sản phẩm khớp khi KHOẢNG giá của nó giao với khoảng đang chọn
const GIA_LOC = {
    'duoi-100k': `base.min_price IS NOT NULL AND base.min_price <= 100000`,
    '100k-500k': `base.max_price >= 100000 AND base.min_price <= 500000`,
    '500k-1tr': `base.max_price >= 500000 AND base.min_price <= 1000000`,
    '1tr-5tr': `base.max_price >= 1000000 AND base.min_price <= 5000000`,
    'tren-5tr': `base.max_price >= 5000000`,
};

const DUYET_LOC = {
    homnay: `base.duyet_luc >= date_trunc('day', NOW())`,
    '7n': `base.duyet_luc >= NOW() - INTERVAL '7 days'`,
    '30n': `base.duyet_luc >= NOW() - INTERVAL '30 days'`,
    '90n': `base.duyet_luc >= NOW() - INTERVAL '90 days'`,
    chua: `base.duyet_luc IS NULL`,
};

const SORT_MAP = {
    moi: `base.sp_ma DESC`,
    mua: `base.sp_luotmua DESC NULLS LAST, base.sp_ma DESC`,
    xem: `base.sp_luotxem DESC NULLS LAST, base.sp_ma DESC`,
    sao: `base.sao_tb DESC, base.sp_ma DESC`,
    gia_tang: `base.min_price ASC NULLS LAST, base.sp_ma DESC`,
    gia_giam: `base.max_price DESC NULLS LAST, base.sp_ma DESC`,
    duyet: `base.duyet_luc DESC NULLS LAST, base.sp_ma DESC`,
};

const SanPhamModel = {
    // 1. Lấy tất cả sản phẩm của 1 Shop (giữ nguyên cho các trang khác dùng)
    getByGianHang: async (gh_ma) => {
        const query = `
            SELECT
                sp.sp_ma, sp.sp_ten, sp.sp_mota,
                sp.sp_luotxem, sp.sp_luotthich, sp.sp_luotmua, sp.sp_diemdanhgiatrungbinh,
                sp.gh_ma, sp.th_ma, sp.dmsp_ma,
                th.th_ten,
                dm.dmsp_ten
            FROM sanpham sp
            LEFT JOIN thuonghieu th ON sp.th_ma = th.th_ma
            LEFT JOIN danhmucsanpham dm ON sp.dmsp_ma = dm.dmsp_ma
            WHERE sp.gh_ma = $1
            ORDER BY sp.sp_ma DESC
        `;
        const result = await pool.query(query, [gh_ma]);
        return result.rows;
    },

    // 1b. Phân trang + tìm kiếm + lọc cơ bản + lọc nâng cao + sắp xếp
    getPhanTrang: async ({
        gh_ma,
        q = null,
        th_ma = null,
        dmsp_ma = null,
        status = null,
        sao = null,
        mua = null,
        xem = null,
        gia = null,
        duyet = null,
        sort = null,
        page = 1,
        limit = 12,
    }) => {
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 12));
        const offset = (pageNum - 1) * limitNum;
        const keyword = q && String(q).trim() ? String(q).trim() : null;

        // $1..$7 cho CTE
        const baseParams = [
            gh_ma,
            keyword,
            th_ma || null,
            dmsp_ma || null,
            status || null,
            TU,
            DEN,
        ];

        // Ghép điều kiện lọc (chỉ nhận mã có trong whitelist)
        const conds = [LOC_STATUS];
        if (sao && SAO_LOC[sao]) conds.push(SAO_LOC[sao]);
        if (mua && MUA_LOC[mua]) conds.push(MUA_LOC[mua]);
        if (xem && XEM_LOC[xem]) conds.push(XEM_LOC[xem]);
        if (gia && GIA_LOC[gia]) conds.push(GIA_LOC[gia]);
        if (duyet && DUYET_LOC[duyet]) conds.push(DUYET_LOC[duyet]);

        const where = conds.join(' AND ');
        const orderBy = SORT_MAP[sort] || SORT_MAP.moi;

        const { rows } = await pool.query(
            `${CTE}
             SELECT base.*, COUNT(*) OVER() AS total
             FROM base
             WHERE ${where}
             ORDER BY ${orderBy}
             LIMIT $8 OFFSET $9`,
            [...baseParams, limitNum, offset]
        );

        let total;
        if (rows.length > 0) {
            total = Number(rows[0].total) || 0;
        } else {
            // Chỉ truyền 7 tham số CTE → không còn tham số $8/$9 "mồ côi"
            const countRes = await pool.query(
                `${CTE} SELECT COUNT(*)::int AS total FROM base WHERE ${where}`,
                baseParams
            );
            total = countRes.rows[0]?.total || 0;
        }

        return {
            rows: rows.map(({ total: _total, ...rest }) => rest),
            total,
            page: pageNum,
            limit: limitNum,
            total_pages: Math.max(1, Math.ceil(total / limitNum)),
        };
    },

    // 2. Lấy 1 sản phẩm
    getById: async (id) => {
        const query = `SELECT * FROM sanpham WHERE sp_ma = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // 3. Sinh mã tự động (SP01, SP02...)
    getLatestMa: async () => {
        const query = `
            SELECT sp_ma FROM sanpham
            WHERE sp_ma ~ '^SP[0-9]+$'
            ORDER BY CAST(SUBSTRING(sp_ma FROM 3) AS INTEGER) DESC
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ? result.rows[0].sp_ma : null;
    },

    // 4. Thêm mới sản phẩm
    create: async (data) => {
        const query = `
            INSERT INTO sanpham (
                sp_ma, sp_ten, sp_mota, gh_ma, th_ma, dmsp_ma
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
        const values = [
            data.sp_ma,
            data.sp_ten,
            data.sp_mota,
            data.gh_ma,
            data.th_ma || null,
            data.dmsp_ma || null,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 5. Cập nhật sản phẩm (Chỉ cập nhật các trường cho phép)
    update: async (id, data) => {
        const query = `
            UPDATE sanpham
            SET sp_ten = $1, sp_mota = $2, th_ma = $3, dmsp_ma = $4
            WHERE sp_ma = $5
            RETURNING *
        `;
        const values = [
            data.sp_ten,
            data.sp_mota,
            data.th_ma || null,
            data.dmsp_ma || null,
            id,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 6. Xóa sản phẩm
    delete: async (id) => {
        const query = 'DELETE FROM sanpham WHERE sp_ma = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },
};

module.exports = SanPhamModel;