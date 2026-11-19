const pool = require('../../config/db');

// Nhãn 3 chặng của hành trình vận chuyển.
const CHANG = {
  SHOP_KHO: 'Shop → Kho',
  KHO_KHO: 'Kho → Kho',
  KHO_KHACH: 'Kho → Khách',
};

// Một điểm trên lộ trình: shop / kho / khách.
const taoDiem = (loai, data = {}) => ({
  loai,
  ma: data.ma || null,
  ten: data.ten || null,
  diaChi: data.diaChi || null,
  xa: data.xa || null,
  tinh: data.tinh || null,
});

const diemShop = (o) => {
  const data = o || {};
  return taoDiem('shop', {
    ten: data.TenShop,
    diaChi: data.DiaChiLayHang,
    xa: data.Xa_LayHang,
    tinh: data.Tinh_LayHang,
  });
};

const diemKho = (o, prefix = '') => {
  const data = o || {};
  return taoDiem('kho', {
    ma: data[`${prefix}Ma`],
    ten: data[`${prefix}Ten`],
    diaChi: data[`${prefix}DiaChi`],
    xa: data[`${prefix}Xa`],
    tinh: data[`${prefix}Tinh`],
  });
};

const diemKhach = (o) => {
  const data = o || {};
  return taoDiem('khach', {
    ten: data.TenKhach,
    diaChi: data.DiaChiGiao,
  });
};

const coDiem = (diem) => Boolean(diem && (diem.ten || diem.diaChi));

// Bỏ các điểm trùng liên tiếp (ví dụ kho lấy hàng và kho đi là cùng một kho).
const taoLoTrinhDayDu = (dsDiem = []) => {
  const ketQua = [];
  for (const diem of dsDiem) {
    if (!coDiem(diem)) continue;
    const cuoi = ketQua[ketQua.length - 1];
    const trung =
      cuoi &&
      cuoi.loai === diem.loai &&
      (cuoi.ma || cuoi.ten) === (diem.ma || diem.ten);
    if (!trung) ketQua.push(diem);
  }
  return ketQua;
};

// Lấy đủ dữ liệu vị trí cho một hoặc nhiều đơn.
// Dùng LATERAL để mỗi đơn chỉ lấy bản ghi phân công mới nhất,
// tránh nhân dòng khi một đơn từng được phân công lại.
const NGU_CANH_SQL = `
  SELECT
    dts.dts_ma AS "DTS_Ma",
    gh.gh_ten AS "TenShop",
    dc_shop.dc_mota AS "DiaChiLayHang",
    xl.xa_ten AS "Xa_LayHang",
    tl.tinh_ten AS "Tinh_LayHang",
    ttnh.ttnh_ten AS "TenKhach",
    ttnh.ttnh_diachisnapshot AS "DiaChiGiao",

    k1.kho_ma AS "Kho_LSP01_Ma",
    k1.kho_ten AS "Kho_LSP01_Ten",
    dc1.dc_mota AS "Kho_LSP01_DiaChi",
    x1.xa_ten AS "Kho_LSP01_Xa",
    t1.tinh_ten AS "Kho_LSP01_Tinh",

    k_di.kho_ma AS "Kho_Di_Ma",
    k_di.kho_ten AS "Kho_Di_Ten",
    dc_di.dc_mota AS "Kho_Di_DiaChi",
    x_di.xa_ten AS "Kho_Di_Xa",
    t_di.tinh_ten AS "Kho_Di_Tinh",

    k_den.kho_ma AS "Kho_Den_Ma",
    k_den.kho_ten AS "Kho_Den_Ten",
    dc_den.dc_mota AS "Kho_Den_DiaChi",
    x_den.xa_ten AS "Kho_Den_Xa",
    t_den.tinh_ten AS "Kho_Den_Tinh",

    k3.kho_ma AS "Kho_LSP03_Ma",
    k3.kho_ten AS "Kho_LSP03_Ten",
    dc3.dc_mota AS "Kho_LSP03_DiaChi",
    x3.xa_ten AS "Kho_LSP03_Xa",
    t3.tinh_ten AS "Kho_LSP03_Tinh",

    (ttlh.dts_ma IS NOT NULL) AS "Co_LSP01",
    (ttc.dts_ma IS NOT NULL) AS "Co_LSP02",
    (ttgh.dts_ma IS NOT NULL) AS "Co_LSP03",
    (ttlh.ttlh_thoidiem IS NOT NULL) AS "DaLayHang",
    (ttc.ttc_thoidiemdi IS NOT NULL) AS "DaGiaoKhoDich",
    (ttgh.ttgh_thoidiem IS NOT NULL) AS "DaGiaoKhach"
  FROM donhangtheoshop dts
  JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
  JOIN diachi dc_shop ON dts.dc_layhangma = dc_shop.dc_ma
  LEFT JOIN xaphuong xl ON dc_shop.xa_ma = xl.xa_ma
  LEFT JOIN tinhtp tl ON xl.tinh_ma = tl.tinh_ma
  JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
  JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma

  LEFT JOIN LATERAL (
    SELECT t.*
    FROM thongtinlayhang t
    WHERE t.dts_ma = dts.dts_ma
    ORDER BY (t.ttlh_thoidiem IS NOT NULL) DESC, t.ttlh_thoidiemtao DESC
    LIMIT 1
  ) ttlh ON TRUE
  LEFT JOIN shipper s1 ON ttlh.shipper_ma = s1.shipper_ma
  LEFT JOIN kho k1 ON s1.kho_ma = k1.kho_ma
  LEFT JOIN diachi dc1 ON k1.dc_ma = dc1.dc_ma
  LEFT JOIN xaphuong x1 ON dc1.xa_ma = x1.xa_ma
  LEFT JOIN tinhtp t1 ON x1.tinh_ma = t1.tinh_ma

  LEFT JOIN thongtintrungchuyen ttc ON ttc.dts_ma = dts.dts_ma
  LEFT JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma
  LEFT JOIN diachi dc_di ON k_di.dc_ma = dc_di.dc_ma
  LEFT JOIN xaphuong x_di ON dc_di.xa_ma = x_di.xa_ma
  LEFT JOIN tinhtp t_di ON x_di.tinh_ma = t_di.tinh_ma
  LEFT JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma
  LEFT JOIN diachi dc_den ON k_den.dc_ma = dc_den.dc_ma
  LEFT JOIN xaphuong x_den ON dc_den.xa_ma = x_den.xa_ma
  LEFT JOIN tinhtp t_den ON x_den.tinh_ma = t_den.tinh_ma

  LEFT JOIN LATERAL (
    SELECT g.*
    FROM thongtingiaohang g
    WHERE g.dts_ma = dts.dts_ma
    ORDER BY (g.ttgh_thoidiem IS NOT NULL) DESC, g.ttgh_thoidiemtao DESC
    LIMIT 1
  ) ttgh ON TRUE
  LEFT JOIN shipper s3 ON ttgh.shipper_ma = s3.shipper_ma
  LEFT JOIN kho k3 ON s3.kho_ma = k3.kho_ma
  LEFT JOIN diachi dc3 ON k3.dc_ma = dc3.dc_ma
  LEFT JOIN xaphuong x3 ON dc3.xa_ma = x3.xa_ma
  LEFT JOIN tinhtp t3 ON x3.tinh_ma = t3.tinh_ma

  WHERE dts.dts_ma = ANY($1::varchar[])
`;

const layNguCanhNhieu = async (danhSachDtsMa = []) => {
  const ids = [...new Set(danhSachDtsMa.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const res = await pool.query(NGU_CANH_SQL, [ids]);
  return new Map(res.rows.map((r) => [r.DTS_Ma, r]));
};

const layNguCanh = async (dts_ma) => {
  const map = await layNguCanhNhieu([dts_ma]);
  return map.get(dts_ma) || null;
};

const diemTheoSuKien = (maSuKien, row = {}, ctx = null) => {
  const ma = maSuKien || '';

  if (ma.startsWith('LSP01')) {
    const den = diemKho(ctx, 'Kho_LSP01_');
    return {
      loaiChang: 'SHOP_KHO',
      tu: diemShop(ctx),
      den: coDiem(den)
        ? den
        : taoDiem('kho', { ma: row.Kho_Ma, ten: row.Kho_Ten }),
    };
  }

  if (ma.startsWith('LSP02')) {
    const tu = diemKho(ctx, 'Kho_Di_');
    const den = diemKho(ctx, 'Kho_Den_');
    return {
      loaiChang: 'KHO_KHO',
      tu: coDiem(tu)
        ? tu
        : taoDiem('kho', { ma: row.Kho_Ma, ten: row.Kho_Ten }),
      den: coDiem(den)
        ? den
        : taoDiem('kho', { ma: row.Kho_Den_Ma, ten: row.Kho_Den_Ten }),
      cungKho: Boolean(
        (ctx?.Kho_Di_Ma && ctx?.Kho_Den_Ma && ctx.Kho_Di_Ma === ctx.Kho_Den_Ma) ||
          (ctx?.Kho_Di_Ten && ctx?.Kho_Den_Ten && ctx.Kho_Di_Ten === ctx.Kho_Den_Ten),
      ),
    };
  }

  if (ma.startsWith('LSP03')) {
    const tu = diemKho(ctx, 'Kho_LSP03_');
    return {
      loaiChang: 'KHO_KHACH',
      tu: coDiem(tu)
        ? tu
        : taoDiem('kho', { ma: row.Kho_Ma, ten: row.Kho_Ten }),
      den: diemKhach(ctx),
    };
  }

  // Sự kiện trạng thái hệ thống chung không gắn với một chặng cụ thể.
  return { loaiChang: null, tu: null, den: null };
};

// Lộ trình đã/đang diễn ra của một đơn: Shop → Kho lấy hàng → Kho đích → Khách.
// Chỉ thêm chặng khi đơn đã được phân công tương ứng, tránh vẽ ra đường đi chưa có.
// Các điểm trùng nhau (kho lấy hàng = kho đi, kho đi = kho đích) được gộp lại.
const loTrinhDayDu = (ctx) => {
  if (!ctx) return [];
  const ds = [diemShop(ctx), diemKho(ctx, 'Kho_LSP01_')];
  if (ctx.Co_LSP02) ds.push(diemKho(ctx, 'Kho_Di_'), diemKho(ctx, 'Kho_Den_'));
  if (ctx.Co_LSP03) ds.push(diemKhach(ctx));
  return taoLoTrinhDayDu(ds);
};

// Chặng đang diễn ra (chặng xa nhất đã được phân công).
const layChangHienTai = (ctx) => {
  if (!ctx) return null;

  if (ctx.Co_LSP03) {
    return {
      loaiChang: 'KHO_KHACH',
      tu: diemKho(ctx, 'Kho_LSP03_'),
      den: diemKhach(ctx),
      cungKho: false,
    };
  }

  if (ctx.Co_LSP02) {
    const tu = diemKho(ctx, 'Kho_Di_');
    const den = diemKho(ctx, 'Kho_Den_');
    return {
      loaiChang: 'KHO_KHO',
      tu,
      den,
      cungKho: Boolean(
        (tu?.ma && den?.ma && tu.ma === den.ma) ||
          (tu?.ten && den?.ten && tu.ten === den.ten),
      ),
    };
  }

  if (ctx.Co_LSP01) {
    return {
      loaiChang: 'SHOP_KHO',
      tu: diemShop(ctx),
      den: diemKho(ctx, 'Kho_LSP01_'),
      cungKho: false,
    };
  }

  return null;
};

// Gắn chặng hiện tại + lộ trình đầy đủ cho danh sách đơn.
const ganChangHienTai = (rows = [], ctxOrMap = null) => {
  const laMap = ctxOrMap && typeof ctxOrMap.get === 'function';

  for (const row of rows) {
    const ctx = laMap ? ctxOrMap.get(row.DTS_Ma) : ctxOrMap;
    const chang = layChangHienTai(ctx);

    row.Diem_Di = chang?.tu || null;
    row.Diem_Den = chang?.den || null;
    row.LoaiChang = chang?.loaiChang || null;
    row.TenChang = chang?.loaiChang ? CHANG[chang.loaiChang] : null;
    row.CungKho = Boolean(chang?.cungKho);
    row.LoTrinh = loTrinhDayDu(ctx);
    row.DaGiaoKhach = Boolean(ctx?.DaGiaoKhach);
  }

  return rows;
};

// Gắn cặp "đi từ đâu → đến đâu" cho từng mốc timeline / từng dòng lịch sử.
// ctxOrMap có thể là 1 object ngữ cảnh hoặc Map<DTS_Ma, ngữ cảnh>.
const ganLoTrinh = (rows = [], ctxOrMap = null) => {
  const laMap = ctxOrMap && typeof ctxOrMap.get === 'function';

  for (const row of rows) {
    const ctx = laMap ? ctxOrMap.get(row.DTS_Ma) : ctxOrMap;
    const { loaiChang, tu, den, cungKho } = diemTheoSuKien(
      row.MaSuKien,
      row,
      ctx,
    );

    row.Diem_Di = tu;
    row.Diem_Den = den;
    row.LoaiChang = loaiChang;
    row.TenChang = loaiChang ? CHANG[loaiChang] : null;
    row.CungKho = Boolean(cungKho);
  }

  return rows;
};

// Timeline 11 mốc dùng chung cho QLK, admin, shop và ĐVVC.
// Mỗi mốc có thêm "MaSuKien" để phía JS xác định chặng đi/đến.
const TIMELINE_SQL = `
  SELECT ctttdh.ctttdh_thoidiem AS "ThoiGian", 'Hệ thống' AS "NguoiThucHien", ttdh.ttdh_ten AS "HanhDong", ctttdh.ctttdh_ghichu AS "GhiChu", NULL::text AS "HinhAnh",
         NULL::varchar AS "Shipper_Ma", NULL::varchar AS "Shipper_Ten", NULL::varchar AS "Shipper_SDT", NULL::text AS "Shipper_HinhAnh", NULL::varchar AS "Kho_Ma", NULL::varchar AS "Kho_Ten", NULL::varchar AS "Kho_Den_Ma", NULL::varchar AS "Kho_Den_Ten", 'HE_THONG' AS "LoaiSuKien", 'HE_THONG' AS "MaSuKien"
  FROM chitiettrangthaidonhang ctttdh JOIN trangthaidonhang ttdh ON ctttdh.ttdh_ma = ttdh.ttdh_ma WHERE ctttdh.dts_ma = $1
  UNION ALL
  SELECT ttlh.ttlh_thoidiemtao, 'Quản lý kho', 'Phân công Lấy Hàng (LSP01)', 'Giao việc cho shipper', NULL::text, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'DIEU_PHOI' AS "LoaiSuKien", 'LSP01_PHANCONG' AS "MaSuKien"
  FROM thongtinlayhang ttlh JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttlh.dts_ma = $1
  UNION ALL
  SELECT ttlh.ttlh_thoidiem, s.shipper_ten, 'LSP01 đã lấy hàng từ Shop', ttlh.ttlh_ghichu, ttlh.ttlh_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'SHIPPER' AS "LoaiSuKien", 'LSP01_LAY' AS "MaSuKien"
  FROM thongtinlayhang ttlh JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttlh.dts_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL
  UNION ALL
  SELECT pk.pk_thoigian_xacnhan, 'Thủ kho', 'Thủ kho xác nhận Nhập kho (Từ LSP01)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien", 'LSP01_NHAP' AS "MaSuKien"
  FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'TU_LSP01' AND pk.pk_trangthai = 'DA_XAC_NHAN'
  UNION ALL
  SELECT ttc.ttc_thoidiemtao, 'Quản lý kho', 'Phân công Trung Chuyển (LSP02)', 'Giao việc cho shipper', NULL::text, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k_di.kho_ma, k_di.kho_ten, k_den.kho_ma, k_den.kho_ten, 'DIEU_PHOI' AS "LoaiSuKien", 'LSP02_PHANCONG' AS "MaSuKien"
  FROM thongtintrungchuyen ttc JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma WHERE ttc.dts_ma = $1
  UNION ALL
  SELECT pk.pk_thoigian_xacnhan, 'Thủ kho', 'Thủ kho xác nhận Xuất kho (Giao LSP02)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien", 'LSP02_XUAT' AS "MaSuKien"
  FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'TRUNG_CHUYEN_DI' AND pk.pk_trangthai = 'DA_XAC_NHAN'
  UNION ALL
  SELECT ttc.ttc_thoidiemdi, s.shipper_ten, 'LSP02 đã giao tới Kho Đích', ttc.ttc_ghichu, ttc.ttc_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k_di.kho_ma, k_di.kho_ten, k_den.kho_ma, k_den.kho_ten, 'SHIPPER' AS "LoaiSuKien", 'LSP02_GIAO' AS "MaSuKien"
  FROM thongtintrungchuyen ttc JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma WHERE ttc.dts_ma = $1 AND ttc.ttc_thoidiemdi IS NOT NULL
  UNION ALL
  SELECT pk.pk_thoigian_xacnhan, 'Thủ kho đích', 'Thủ kho Đích xác nhận Nhập kho (Từ LSP02)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien", 'LSP02_NHAP' AS "MaSuKien"
  FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'TRUNG_CHUYEN_DEN' AND pk.pk_trangthai = 'DA_XAC_NHAN'
  UNION ALL
  SELECT ttgh.ttgh_thoidiemtao, 'Quản lý kho', 'Phân công Giao Hàng (LSP03)', 'Giao việc cho shipper', NULL::text, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'DIEU_PHOI' AS "LoaiSuKien", 'LSP03_PHANCONG' AS "MaSuKien"
  FROM thongtingiaohang ttgh JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttgh.dts_ma = $1
  UNION ALL
  SELECT pk.pk_thoigian_xacnhan, 'Thủ kho đích', 'Thủ kho Đích xác nhận Xuất kho (Giao LSP03)', pk.pk_ghichu, pk.pk_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'THU_KHO' AS "LoaiSuKien", 'LSP03_XUAT' AS "MaSuKien"
  FROM phieu_kho pk JOIN kho k ON pk.kho_ma = k.kho_ma LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma WHERE pk.dts_ma = $1 AND pk.pk_ly_do = 'GIAO_LSP03' AND pk.pk_trangthai = 'DA_XAC_NHAN'
  UNION ALL
  SELECT ttgh.ttgh_thoidiem, s.shipper_ten, 'LSP03 đã giao hàng cho Khách', ttgh.ttgh_ghichu, ttgh.ttgh_hinhanh, s.shipper_ma, s.shipper_ten, s.shipper_sdt, s.shipper_hinhanh, k.kho_ma, k.kho_ten, NULL::varchar, NULL::varchar, 'SHIPPER' AS "LoaiSuKien", 'LSP03_GIAO' AS "MaSuKien"
  FROM thongtingiaohang ttgh JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE ttgh.dts_ma = $1 AND ttgh.ttgh_thoidiem IS NOT NULL
  ORDER BY "ThoiGian" ASC
`;

module.exports = {
  CHANG,
  TIMELINE_SQL,
  taoDiem,
  diemShop,
  diemKho,
  diemKhach,
  taoLoTrinhDayDu,
  loTrinhDayDu,
  layChangHienTai,
  layNguCanh,
  layNguCanhNhieu,
  ganLoTrinh,
  ganChangHienTai,
};
