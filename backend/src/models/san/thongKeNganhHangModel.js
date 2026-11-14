// backend/src/models/san/thongKeNganhHangModel.js
// Thống kê doanh thu theo ngành hàng / thương hiệu / shop / sản phẩm / tháng / năm.
// Nguyên tắc:
//  - Chỉ tính đơn có trạng thái mới nhất = TTDH05 (đã hoàn thành)
//  - Mốc thời gian: ctttdh_thoidiem của TTDH05
//  - Doanh thu = SUM(ctdh_thanhtien) của các món thuộc phạm vi
//  - Phí sàn / giảm giá shop của đơn được phân bổ về từng món theo tỷ trọng
//    ctdh_thanhtien / tổng ctdh_thanhtien của TOÀN BỘ món trong đơn
//    (mẫu số luôn là cả đơn, kể cả khi đang lọc thương hiệu/ngành)
//  - Shop nhận = Doanh thu - Phí sàn - Giảm giá shop
//  - Lượt xem/thích: bộ đếm lũy kế trên chitietsanpham, không lọc theo thời gian
//  - Lọc thương hiệu: sanpham.th_ma (NULL = tất cả)
//
//  Tham số CTE_DON: $1 tu_ngay, $2 den_ngay, $3 gh_ma, $4 nh_ma, $5 th_ma

const pool = require('../../config/db');

const TZ = 'Asia/Ho_Chi_Minh';
const TU = (p) => `(${p}::date::timestamp AT TIME ZONE '${TZ}')`;
const DEN = (p) => `((${p}::date + 1)::timestamp AT TIME ZONE '${TZ}')`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Shop thực nhận = Doanh thu (giá khách trả) - phí sàn - giảm giá shop
const shopNhan = (dt, ps, gg = 0) => Math.max(num(dt) - num(ps) - num(gg), 0);

const namHienTai = () => new Date().getFullYear();

const khoangThoiGian = (nam, thang) => {
  const y = Number(nam) || namHienTai();
  const m = Number(thang);
  if (m >= 1 && m <= 12) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = String(m).padStart(2, '0');
    return {
      tu_ngay: `${y}-${mm}-01`,
      den_ngay: `${y}-${mm}-${String(last).padStart(2, '0')}`,
    };
  }
  return { tu_ngay: `${y}-01-01`, den_ngay: `${y}-12-31` };
};

// ===== CTE dùng chung: chỉ cần bảng ngành hàng =====
const CTE_NH = `
  WITH RECURSIVE nh_up AS (
    SELECT nh_ma AS node, nh_ma AS ancestor
    FROM nganhhang
    UNION ALL
    SELECT u.node, p.nh_cha
    FROM nh_up u
    JOIN nganhhang p ON p.nh_ma = u.ancestor
    WHERE p.nh_cha IS NOT NULL
  )
`;

// ===== CTE dùng chung: đơn hoàn thành + items + map ngành/thương hiệu =====
const CTE_DON = `
  WITH RECURSIVE
  don_ht AS (
    SELECT o.dts_ma,
           o.gh_ma,
           COALESCE(o.dts_tongtienphisan, 0) AS phi_san_don,
           COALESCE(o.dts_tonggiamgiashop, 0) AS giam_gia_shop_don,
           ht.hoan_tat_luc
    FROM donhangtheoshop o
    JOIN LATERAL (
      SELECT c.ttdh_ma, c.ctttdh_thoidiem AS hoan_tat_luc
      FROM chitiettrangthaidonhang c
      WHERE c.dts_ma = o.dts_ma
      ORDER BY c.ctttdh_thoidiem DESC
      LIMIT 1
    ) ht ON true
    WHERE ht.ttdh_ma = 'TTDH05'
      AND ($1::date IS NULL OR ht.hoan_tat_luc >= ${TU('$1')})
      AND ($2::date IS NULL OR ht.hoan_tat_luc <  ${DEN('$2')})
      AND ($3::varchar IS NULL OR o.gh_ma = $3)
  ),
  nh_up AS (
    SELECT nh_ma AS node, nh_ma AS ancestor
    FROM nganhhang
    UNION ALL
    SELECT u.node, p.nh_cha
    FROM nh_up u
    JOIN nganhhang p ON p.nh_ma = u.ancestor
    WHERE p.nh_cha IS NOT NULL
  ),
  -- Toàn bộ món của các đơn hoàn thành (chưa lọc ngành / thương hiệu)
  item_all AS (
    SELECT d.dts_ma,
           ctdh.ctdh_thanhtien,
           ctsp.sp_ma,
           ctsp.ctsp_ma,
           ctsp.nh_ma,
           sp.th_ma,
           ctdh.ctdh_soluong::numeric AS so_luong
    FROM don_ht d
    JOIN chitietdonhang ctdh ON ctdh.dts_ma = d.dts_ma
    JOIN chitietsanpham ctsp ON ctsp.ctsp_ma = ctdh.ctsp_ma
    JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
  ),
  -- Tổng giá trị món của từng đơn: mẫu số phân bổ phí sàn / giảm giá shop
  tong_don AS (
    SELECT dts_ma, SUM(ctdh_thanhtien) AS tong_item
    FROM item_all
    GROUP BY dts_ma
  ),
  -- Món đã lọc theo ngành + thương hiệu + doanh thu / phí sàn / giảm giá shop
  items AS (
    SELECT a.dts_ma,
           d.gh_ma,
           d.hoan_tat_luc,
           a.sp_ma,
           a.ctsp_ma,
           a.nh_ma,
           a.th_ma,
           a.so_luong,
           a.ctdh_thanhtien AS doanh_thu,
           CASE WHEN t.tong_item > 0
                THEN d.phi_san_don * a.ctdh_thanhtien / t.tong_item
                ELSE 0 END AS phi_san,
           CASE WHEN t.tong_item > 0
                THEN d.giam_gia_shop_don * a.ctdh_thanhtien / t.tong_item
                ELSE 0 END AS giam_gia_shop
    FROM item_all a
    JOIN don_ht d ON d.dts_ma = a.dts_ma
    JOIN tong_don t ON t.dts_ma = a.dts_ma
    WHERE ($4::varchar IS NULL
           OR a.nh_ma IN (SELECT node FROM nh_up WHERE ancestor = $4))
      AND ($5::varchar IS NULL OR a.th_ma = $5)
  )
`;

const ThongKeNganhHangModel = {
  // =========================================================
  // 1. DANH MỤC
  // =========================================================
  getDanhMuc: async () => {
    const [nhRes, ghRes, thRes, namRes] = await Promise.all([
      pool.query(
        `SELECT nh_ma, nh_ten, nh_cha FROM nganhhang ORDER BY nh_ten ASC`
      ),
      pool.query(`SELECT gh_ma, gh_ten FROM gianhang ORDER BY gh_ten ASC`),
      // Chỉ trả thương hiệu đang có sản phẩm, tránh danh sách rỗng/không dùng được
      pool.query(`
        SELECT th.th_ma, th.th_ten
        FROM thuonghieu th
        WHERE EXISTS (SELECT 1 FROM sanpham sp WHERE sp.th_ma = th.th_ma)
        ORDER BY th.th_ten ASC
      `),
      pool.query(`
        SELECT DISTINCT
               EXTRACT(YEAR FROM ht.hoan_tat_luc AT TIME ZONE '${TZ}')::int AS nam
        FROM donhangtheoshop o
        JOIN LATERAL (
          SELECT c.ttdh_ma, c.ctttdh_thoidiem AS hoan_tat_luc
          FROM chitiettrangthaidonhang c
          WHERE c.dts_ma = o.dts_ma
          ORDER BY c.ctttdh_thoidiem DESC
          LIMIT 1
        ) ht ON true
        WHERE ht.ttdh_ma = 'TTDH05'
          AND ht.hoan_tat_luc IS NOT NULL
        ORDER BY nam DESC
      `),
    ]);

    const namData = namRes.rows
      .map((r) => num(r.nam))
      .filter((n) => n > 0);

    // Năm mặc định: năm có dữ liệu mới nhất, không phải năm hiện tại
    const namMacDinh = namData.length ? Math.max(...namData) : namHienTai();

    const dsNam = Array.from(new Set([...namData, namHienTai()]))
      .filter((n) => n > 0)
      .sort((a, b) => b - a);

    return {
      nganh_hang: nhRes.rows,
      shop: ghRes.rows,
      thuong_hieu: thRes.rows,
      nam: dsNam,
      nam_mac_dinh: namMacDinh,
      nam_hien_tai: namHienTai(),
    };
  },

  // =========================================================
  // 2. TỔNG QUAN
  // =========================================================
  getTongQuan: async ({
    nh_ma = null,
    gh_ma = null,
    th_ma = null,
    nam,
    thang = null,
  }) => {
    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);
    const namSo = Number(nam) || namHienTai();
    const p = [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma];

    // 2.1. KPI doanh thu
    const kpiSql = `${CTE_DON}
      SELECT COALESCE(SUM(doanh_thu), 0) AS doanh_thu,
             COALESCE(SUM(phi_san), 0) AS phi_san,
             COALESCE(SUM(giam_gia_shop), 0) AS giam_gia_shop,
             COALESCE(SUM(so_luong), 0) AS so_luong,
             COUNT(DISTINCT dts_ma)::int AS so_don,
             COUNT(DISTINCT sp_ma)::int AS so_sp
      FROM items`;

    // 2.2. Lượt xem / thích (lũy kế, không theo thời gian) — lọc cả thương hiệu
    const viewSql = `${CTE_NH}
      SELECT COALESCE(SUM(ctsp.ctsp_luotxem), 0) AS luot_xem,
             COALESCE(SUM(ctsp.ctsp_luotthich), 0) AS luot_thich
      FROM chitietsanpham ctsp
      JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
      WHERE ($1::varchar IS NULL OR sp.gh_ma = $1)
        AND ($2::varchar IS NULL
             OR ctsp.nh_ma IN (SELECT node FROM nh_up WHERE ancestor = $2))
        AND ($3::varchar IS NULL OR sp.th_ma = $3)`;

    // 2.3. Series 12 tháng
    const thangSql = `${CTE_DON},
      thang AS (
        SELECT generate_series(
          make_date($6::int, 1, 1),
          make_date($6::int, 12, 1),
          interval '1 month'
        )::date AS thang
      ),
      agg AS (
        SELECT date_trunc('month', hoan_tat_luc AT TIME ZONE '${TZ}')::date AS thang,
               SUM(doanh_thu) AS doanh_thu,
               SUM(phi_san) AS phi_san,
               SUM(giam_gia_shop) AS giam_gia_shop,
               SUM(so_luong) AS so_luong,
               COUNT(DISTINCT dts_ma)::int AS so_don
        FROM items
        GROUP BY 1
      )
      SELECT EXTRACT(MONTH FROM t.thang)::int AS thang,
             COALESCE(a.doanh_thu, 0) AS doanh_thu,
             COALESCE(a.phi_san, 0) AS phi_san,
             COALESCE(a.giam_gia_shop, 0) AS giam_gia_shop,
             COALESCE(a.so_luong, 0) AS so_luong,
             COALESCE(a.so_don, 0) AS so_don
      FROM thang t
      LEFT JOIN agg a ON a.thang = t.thang
      ORDER BY t.thang`;

    // 2.4. Series theo năm: KHÔNG lọc năm để chart xu hướng có nhiều điểm
    const namSql = `${CTE_DON}
      SELECT EXTRACT(YEAR FROM hoan_tat_luc AT TIME ZONE '${TZ}')::int AS nam,
             SUM(doanh_thu) AS doanh_thu,
             SUM(phi_san) AS phi_san,
             SUM(giam_gia_shop) AS giam_gia_shop,
             SUM(so_luong) AS so_luong,
             COUNT(DISTINCT dts_ma)::int AS so_don
      FROM items
      GROUP BY 1
      ORDER BY 1`;

    // 2.5. Ngành cấp 1
    const nganhGocSql = `${CTE_DON},
      nh_goc AS (
        SELECT u.node AS nh_ma,
               u.ancestor AS goc_ma
        FROM nh_up u
        JOIN nganhhang g
          ON g.nh_ma = u.ancestor
         AND g.nh_cha IS NULL
      ),
      agg AS (
        SELECT g.goc_ma,
               SUM(i.doanh_thu) AS doanh_thu,
               SUM(i.phi_san) AS phi_san,
               SUM(i.giam_gia_shop) AS giam_gia_shop,
               COUNT(DISTINCT i.dts_ma)::int AS so_don
        FROM items i
        JOIN nh_goc g ON g.nh_ma = i.nh_ma
        GROUP BY g.goc_ma
      )
      SELECT nh.nh_ma, nh.nh_ten,
             COALESCE(a.doanh_thu, 0) AS doanh_thu,
             COALESCE(a.phi_san, 0) AS phi_san,
             COALESCE(a.giam_gia_shop, 0) AS giam_gia_shop,
             COALESCE(a.so_don, 0) AS so_don
      FROM agg a
      JOIN nganhhang nh ON nh.nh_ma = a.goc_ma
      ORDER BY a.doanh_thu DESC`;

    // 2.6. Top shop
    const topShopSql = `${CTE_DON}
      SELECT i.gh_ma, gh.gh_ten,
             SUM(i.doanh_thu) AS doanh_thu,
             SUM(i.phi_san) AS phi_san,
             SUM(i.giam_gia_shop) AS giam_gia_shop,
             COUNT(DISTINCT i.dts_ma)::int AS so_don
      FROM items i
      JOIN gianhang gh ON gh.gh_ma = i.gh_ma
      GROUP BY i.gh_ma, gh.gh_ten
      ORDER BY doanh_thu DESC
      LIMIT 8`;

    const [kpiRes, viewRes, thangRes, namRes, nganhGocRes, topShopRes] =
      await Promise.all([
        pool.query(kpiSql, p),
        pool.query(viewSql, [gh_ma, nh_ma, th_ma]),
        pool.query(thangSql, [...p, namSo]),
        pool.query(namSql, [null, null, gh_ma, nh_ma, th_ma]),
        pool.query(nganhGocSql, p),
        pool.query(topShopSql, p),
      ]);

    const k = kpiRes.rows[0] || {};
    const v = viewRes.rows[0] || {};
    const doanh_thu = num(k.doanh_thu);
    const phi_san = num(k.phi_san);
    const giam_gia_shop = num(k.giam_gia_shop);

    return {
      pham_vi: {
        nh_ma,
        gh_ma,
        th_ma,
        nam: namSo,
        thang: thang || null,
        tu_ngay,
        den_ngay,
        moc: 'hoan_thanh',
      },
      kpi: {
        doanh_thu,
        phi_san,
        giam_gia_shop,
        shop_nhan: shopNhan(doanh_thu, phi_san, giam_gia_shop),
        so_don: num(k.so_don),
        so_sp: num(k.so_sp),
        so_luong: num(k.so_luong),
        luot_xem: num(v.luot_xem),
        luot_thich: num(v.luot_thich),
      },
      theo_thang: thangRes.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          thang: num(r.thang),
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          so_don: num(r.so_don),
          so_luong: num(r.so_luong),
        };
      }),
      theo_nam: namRes.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          nam: num(r.nam),
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          so_don: num(r.so_don),
          so_luong: num(r.so_luong),
        };
      }),
      theo_nganh_goc: nganhGocRes.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          nh_ma: r.nh_ma,
          nh_ten: r.nh_ten,
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          so_don: num(r.so_don),
        };
      }),
      top_shop: topShopRes.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          gh_ma: r.gh_ma,
          gh_ten: r.gh_ten,
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          so_don: num(r.so_don),
        };
      }),
    };
  },

  // =========================================================
  // 3. THEO NGÀNH HÀNG (cây đầy đủ, đã cuộn lên cha)
  // =========================================================
  getTheoNganh: async ({
    nh_ma = null,
    gh_ma = null,
    th_ma = null,
    nam,
    thang = null,
  }) => {
    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);

    const sql = `${CTE_DON},
      agg AS (
        SELECT u.ancestor AS nh_ma,
               SUM(i.doanh_thu) AS doanh_thu,
               SUM(i.phi_san) AS phi_san,
               SUM(i.giam_gia_shop) AS giam_gia_shop,
               SUM(i.so_luong) AS so_luong,
               COUNT(DISTINCT i.dts_ma)::int AS so_don,
               COUNT(DISTINCT i.sp_ma)::int AS so_sp
        FROM items i
        JOIN nh_up u ON u.node = i.nh_ma
        GROUP BY u.ancestor
      ),
      view_agg AS (
        SELECT u.ancestor AS nh_ma,
               SUM(ctsp.ctsp_luotxem) AS luot_xem,
               SUM(ctsp.ctsp_luotthich) AS luot_thich
        FROM chitietsanpham ctsp
        JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
        JOIN nh_up u ON u.node = ctsp.nh_ma
        WHERE ($3::varchar IS NULL OR sp.gh_ma = $3)
          AND ($5::varchar IS NULL OR sp.th_ma = $5)
        GROUP BY u.ancestor
      )
      SELECT nh.nh_ma, nh.nh_ten, nh.nh_cha,
             COALESCE(a.so_don, 0)::int AS so_don,
             COALESCE(a.so_sp, 0)::int AS so_sp,
             COALESCE(a.so_luong, 0) AS so_luong,
             COALESCE(a.doanh_thu, 0) AS doanh_thu,
             COALESCE(a.phi_san, 0) AS phi_san,
             COALESCE(a.giam_gia_shop, 0) AS giam_gia_shop,
             COALESCE(v.luot_xem, 0) AS luot_xem,
             COALESCE(v.luot_thich, 0) AS luot_thich
      FROM nganhhang nh
      LEFT JOIN agg a ON a.nh_ma = nh.nh_ma
      LEFT JOIN view_agg v ON v.nh_ma = nh.nh_ma
      WHERE ($4::varchar IS NULL
             OR nh.nh_ma IN (SELECT node FROM nh_up WHERE ancestor = $4))
        AND (COALESCE(a.so_don, 0) > 0
             OR COALESCE(v.luot_xem, 0) > 0
             OR COALESCE(v.luot_thich, 0) > 0)
      ORDER BY nh.nh_ma ASC`;

    const res = await pool.query(sql, [
      tu_ngay,
      den_ngay,
      gh_ma,
      nh_ma,
      th_ma,
    ]);

    return {
      rows: res.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          nh_ma: r.nh_ma,
          nh_ten: r.nh_ten,
          nh_cha: r.nh_cha,
          so_don: num(r.so_don),
          so_sp: num(r.so_sp),
          so_luong: num(r.so_luong),
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          luot_xem: num(r.luot_xem),
          luot_thich: num(r.luot_thich),
        };
      }),
    };
  },

  // =========================================================
  // 4. THEO SHOP (phân trang + tìm kiếm)
  // =========================================================
  getTheoShop: async ({
    nh_ma = null,
    gh_ma = null,
    th_ma = null,
    nam,
    thang = null,
    q = null,
    page = 1,
    limit = 10,
  }) => {
    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;

    const base = `${CTE_DON},
      agg AS (
        SELECT i.gh_ma,
               COUNT(DISTINCT i.dts_ma)::int AS so_don,
               SUM(i.so_luong) AS so_luong,
               SUM(i.doanh_thu) AS doanh_thu,
               SUM(i.phi_san) AS phi_san,
               SUM(i.giam_gia_shop) AS giam_gia_shop
        FROM items i
        GROUP BY i.gh_ma
      ),
      -- Không join nh_up ở đây: chỉ lọc trực tiếp để tránh nhân lượt xem/thích
      view_agg AS (
        SELECT sp.gh_ma,
               SUM(ctsp.ctsp_luotxem) AS luot_xem,
               SUM(ctsp.ctsp_luotthich) AS luot_thich
        FROM chitietsanpham ctsp
        JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
        WHERE ($3::varchar IS NULL OR sp.gh_ma = $3)
          AND ($4::varchar IS NULL
               OR ctsp.nh_ma IN (SELECT node FROM nh_up WHERE ancestor = $4))
          AND ($5::varchar IS NULL OR sp.th_ma = $5)
        GROUP BY sp.gh_ma
      ),
      shop_data AS (
        SELECT gh.gh_ma, gh.gh_ten,
               COALESCE(a.so_don, 0)::int AS so_don,
               COALESCE(a.so_luong, 0) AS so_luong,
               COALESCE(a.doanh_thu, 0) AS doanh_thu,
               COALESCE(a.phi_san, 0) AS phi_san,
               COALESCE(a.giam_gia_shop, 0) AS giam_gia_shop,
               COALESCE(v.luot_xem, 0) AS luot_xem,
               COALESCE(v.luot_thich, 0) AS luot_thich
        FROM gianhang gh
        LEFT JOIN agg a ON a.gh_ma = gh.gh_ma
        LEFT JOIN view_agg v ON v.gh_ma = gh.gh_ma
        WHERE ($3::varchar IS NULL OR gh.gh_ma = $3)
          AND ($6::text IS NULL
               OR gh.gh_ma ILIKE '%' || $6 || '%'
               OR gh.gh_ten ILIKE '%' || $6 || '%')
      )`;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `${base}
         SELECT * FROM shop_data
         WHERE so_don > 0 OR luot_xem > 0 OR luot_thich > 0
         ORDER BY doanh_thu DESC, gh_ten ASC
         LIMIT $7 OFFSET $8`,
        [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma, q, l, offset]
      ),
      pool.query(
        `${base}
         SELECT COUNT(*)::int AS total FROM shop_data
         WHERE so_don > 0 OR luot_xem > 0 OR luot_thich > 0`,
        [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma, q]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          gh_ma: r.gh_ma,
          gh_ten: r.gh_ten,
          so_don: num(r.so_don),
          so_luong: num(r.so_luong),
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          luot_xem: num(r.luot_xem),
          luot_thich: num(r.luot_thich),
        };
      }),
      total,
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
    };
  },

  // =========================================================
  // 4b. THEO THƯƠNG HIỆU (phân trang + tìm kiếm)
  //  - Gom theo sanpham.th_ma (mỗi thương hiệu 1 dòng)
  //  - Sản phẩm chưa gán thương hiệu (th_ma IS NULL) gom vào dòng
  //    "Chưa xác định thương hiệu" để tổng bảng khớp KPI.
  //  - Lượt xem/thích: lũy kế trên toàn bộ sản phẩm của thương hiệu.
  //  Tham số: $1 tu_ngay, $2 den_ngay, $3 gh_ma, $4 nh_ma, $5 th_ma,
  //          $6 q, $7 limit, $8 offset
  // =========================================================
  getTheoThuongHieu: async ({
    nh_ma = null,
    gh_ma = null,
    th_ma = null,
    nam,
    thang = null,
    q = null,
    page = 1,
    limit = 10,
  }) => {
    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (p - 1) * l;

    const base = `${CTE_DON},
      agg AS (
        SELECT i.th_ma,
               COUNT(DISTINCT i.sp_ma)::int AS so_sp,
               COUNT(DISTINCT i.dts_ma)::int AS so_don,
               SUM(i.so_luong) AS so_luong,
               SUM(i.doanh_thu) AS doanh_thu,
               SUM(i.phi_san) AS phi_san,
               SUM(i.giam_gia_shop) AS giam_gia_shop
        FROM items i
        GROUP BY i.th_ma
      ),
      -- Không join nh_up ở đây: chỉ lọc trực tiếp để tránh nhân lượt xem/thích
      view_agg AS (
        SELECT sp.th_ma,
               SUM(ctsp.ctsp_luotxem) AS luot_xem,
               SUM(ctsp.ctsp_luotthich) AS luot_thich
        FROM chitietsanpham ctsp
        JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
        WHERE ($3::varchar IS NULL OR sp.gh_ma = $3)
          AND ($4::varchar IS NULL
               OR ctsp.nh_ma IN (SELECT node FROM nh_up WHERE ancestor = $4))
          AND ($5::varchar IS NULL OR sp.th_ma = $5)
        GROUP BY sp.th_ma
      ),
      brand_rows AS (
        SELECT th.th_ma::text AS th_ma,
               th.th_ten::text AS th_ten,
               COALESCE(a.so_sp, 0)::int AS so_sp,
               COALESCE(a.so_don, 0)::int AS so_don,
               COALESCE(a.so_luong, 0) AS so_luong,
               COALESCE(a.doanh_thu, 0) AS doanh_thu,
               COALESCE(a.phi_san, 0) AS phi_san,
               COALESCE(a.giam_gia_shop, 0) AS giam_gia_shop,
               COALESCE(v.luot_xem, 0) AS luot_xem,
               COALESCE(v.luot_thich, 0) AS luot_thich
        FROM thuonghieu th
        LEFT JOIN agg a ON a.th_ma = th.th_ma
        LEFT JOIN view_agg v ON v.th_ma = th.th_ma
        WHERE ($5::varchar IS NULL OR th.th_ma = $5)
      ),
      -- Dòng "Chưa xác định thương hiệu" cho sản phẩm có th_ma IS NULL
      brand_null AS (
        SELECT '__KHONG_XAC_DINH__'::text AS th_ma,
               'Chưa xác định thương hiệu'::text AS th_ten,
               COALESCE(a.so_sp, 0)::int AS so_sp,
               COALESCE(a.so_don, 0)::int AS so_don,
               COALESCE(a.so_luong, 0) AS so_luong,
               COALESCE(a.doanh_thu, 0) AS doanh_thu,
               COALESCE(a.phi_san, 0) AS phi_san,
               COALESCE(a.giam_gia_shop, 0) AS giam_gia_shop,
               COALESCE(v.luot_xem, 0) AS luot_xem,
               COALESCE(v.luot_thich, 0) AS luot_thich
        FROM (SELECT 1) x
        LEFT JOIN agg a ON a.th_ma IS NULL
        LEFT JOIN view_agg v ON v.th_ma IS NULL
        WHERE $5::varchar IS NULL
      ),
      brand_all AS (
        SELECT * FROM brand_rows
        UNION ALL
        SELECT * FROM brand_null
      ),
      brand_data AS (
        SELECT * FROM brand_all
        WHERE (so_don > 0 OR luot_xem > 0 OR luot_thich > 0)
          AND ($6::text IS NULL
               OR th_ma ILIKE '%' || $6 || '%'
               OR th_ten ILIKE '%' || $6 || '%')
      )`;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `${base}
         SELECT * FROM brand_data
         ORDER BY doanh_thu DESC, th_ten ASC
         LIMIT $7 OFFSET $8`,
        [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma, q, l, offset]
      ),
      pool.query(
        `${base} SELECT COUNT(*)::int AS total FROM brand_data`,
        [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma, q]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          th_ma: r.th_ma,
          th_ten: r.th_ten,
          so_sp: num(r.so_sp),
          so_don: num(r.so_don),
          so_luong: num(r.so_luong),
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          luot_xem: num(r.luot_xem),
          luot_thich: num(r.luot_thich),
        };
      }),
      total,
      page: p,
      limit: l,
      total_pages: Math.max(1, Math.ceil(total / l)),
    };
  },

  // =========================================================
  // 5. THEO SẢN PHẨM (top sản phẩm, mỗi dòng = 1 phân loại)
  // =========================================================
  getTheoSanPham: async ({
    nh_ma = null,
    gh_ma = null,
    th_ma = null,
    nam,
    thang = null,
    q = null,
    sort = 'doanh_thu',
    page = 1,
    limit = 10,
  }) => {
    const { tu_ngay, den_ngay } = khoangThoiGian(nam, thang);

    const p = Math.max(1, Number(page) || 1);
    const rawLimit = Number(limit);
    const all = !Number.isFinite(rawLimit) || rawLimit <= 0;
    const l = all ? 0 : Math.min(500, Math.max(1, rawLimit));
    const offset = all ? 0 : (p - 1) * l;
    const sortCol = sort === 'so_luong' ? 'so_luong' : 'doanh_thu';

    const base = `${CTE_DON},
      agg AS (
        SELECT i.ctsp_ma,
               COUNT(DISTINCT i.dts_ma)::int AS so_don,
               SUM(i.so_luong) AS so_luong,
               SUM(i.doanh_thu) AS doanh_thu,
               SUM(i.phi_san) AS phi_san,
               SUM(i.giam_gia_shop) AS giam_gia_shop
        FROM items i
        GROUP BY i.ctsp_ma
      ),
      sp_data AS (
        SELECT ctsp.ctsp_ma,
               ctsp.ctsp_ten,
               ctsp.sp_ma,
               sp.sp_ten,
               ctsp.nh_ma,
               nh.nh_ten,
               sp.gh_ma,
               gh.gh_ten,
               COALESCE(a.so_don, 0)::int AS so_don,
               COALESCE(a.so_luong, 0) AS so_luong,
               COALESCE(a.doanh_thu, 0) AS doanh_thu,
               COALESCE(a.phi_san, 0) AS phi_san,
               COALESCE(a.giam_gia_shop, 0) AS giam_gia_shop,
               COALESCE(ctsp.ctsp_luotxem, 0)::int AS luot_xem,
               COALESCE(ctsp.ctsp_luotthich, 0)::int AS luot_thich
        FROM agg a
        JOIN chitietsanpham ctsp ON ctsp.ctsp_ma = a.ctsp_ma
        JOIN sanpham sp ON sp.sp_ma = ctsp.sp_ma
        JOIN nganhhang nh ON nh.nh_ma = ctsp.nh_ma
        JOIN gianhang gh ON gh.gh_ma = sp.gh_ma
        WHERE ($6::text IS NULL
               OR ctsp.ctsp_ma ILIKE '%' || $6 || '%'
               OR ctsp.ctsp_ten ILIKE '%' || $6 || '%'
               OR sp.sp_ma ILIKE '%' || $6 || '%'
               OR sp.sp_ten ILIKE '%' || $6 || '%'
               OR gh.gh_ten ILIKE '%' || $6 || '%')
      )`;

    const orderSql = `ORDER BY ${sortCol} DESC, so_don DESC, sp_ten ASC, ctsp_ten ASC`;
    const limitSql = all ? '' : 'LIMIT $7 OFFSET $8';

    const listParams = all
      ? [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma, q]
      : [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma, q, l, offset];

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `${base} SELECT * FROM sp_data ${orderSql} ${limitSql}`,
        listParams
      ),
      pool.query(
        `${base} SELECT COUNT(*)::int AS total FROM sp_data`,
        [tu_ngay, den_ngay, gh_ma, nh_ma, th_ma, q]
      ),
    ]);

    const total = num(countRes.rows[0]?.total);

    return {
      rows: rowsRes.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          ctsp_ma: r.ctsp_ma,
          ctsp_ten: r.ctsp_ten,
          sp_ma: r.sp_ma,
          sp_ten: r.sp_ten,
          nh_ma: r.nh_ma,
          nh_ten: r.nh_ten,
          gh_ma: r.gh_ma,
          gh_ten: r.gh_ten,
          so_don: num(r.so_don),
          so_luong: num(r.so_luong),
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          luot_xem: num(r.luot_xem),
          luot_thich: num(r.luot_thich),
        };
      }),
      total,
      page: all ? 1 : p,
      limit: all ? 0 : l,
      total_pages: all ? 1 : Math.max(1, Math.ceil(total / l)),
    };
  },

  // =========================================================
  // 6. SHOP × THÁNG / SHOP × NĂM
  // =========================================================
  getShopThoiGian: async ({
    che_do = 'thang',
    nh_ma = null,
    gh_ma = null,
    th_ma = null,
    nam,
  }) => {
    const mode = che_do === 'nam' ? 'nam' : 'thang';
    const { tu_ngay, den_ngay } =
      mode === 'thang'
        ? khoangThoiGian(nam, null)
        : { tu_ngay: null, den_ngay: null };

    const bieuThuc =
      mode === 'thang'
        ? `EXTRACT(MONTH FROM i.hoan_tat_luc AT TIME ZONE '${TZ}')::int`
        : `EXTRACT(YEAR FROM i.hoan_tat_luc AT TIME ZONE '${TZ}')::int`;

    const sql = `${CTE_DON}
      SELECT i.gh_ma,
             gh.gh_ten,
             ${bieuThuc} AS ky,
             SUM(i.doanh_thu) AS doanh_thu,
             SUM(i.phi_san) AS phi_san,
             SUM(i.giam_gia_shop) AS giam_gia_shop,
             COUNT(DISTINCT i.dts_ma)::int AS so_don
      FROM items i
      JOIN gianhang gh ON gh.gh_ma = i.gh_ma
      GROUP BY i.gh_ma, gh.gh_ten, 3
      ORDER BY gh.gh_ten ASC, 3 ASC`;

    const res = await pool.query(sql, [
      tu_ngay,
      den_ngay,
      gh_ma,
      nh_ma,
      th_ma,
    ]);

    return {
      che_do: mode,
      nam: mode === 'thang' ? Number(nam) || namHienTai() : null,
      rows: res.rows.map((r) => {
        const dt = num(r.doanh_thu);
        const ps = num(r.phi_san);
        const gg = num(r.giam_gia_shop);
        return {
          gh_ma: r.gh_ma,
          gh_ten: r.gh_ten,
          ky: num(r.ky),
          doanh_thu: dt,
          phi_san: ps,
          giam_gia_shop: gg,
          shop_nhan: shopNhan(dt, ps, gg),
          so_don: num(r.so_don),
        };
      }),
    };
  },
};

module.exports = ThongKeNganhHangModel;