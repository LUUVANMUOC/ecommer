// backend/src/models/suco/suCoModel.js
const pool = require('../../config/db');

// ---------- Mảnh SQL dùng lại ----------
const DON_SELECT = `
  dts.dts_ma,
  dts.dts_ngaylap,
  dts.dts_thoidiemdukiengiao,
  dts.dts_tongtienhang,
  dts.dts_tienvanchuyen,
  dts.dts_tongtienphisan,
  dts.dts_tonggiamgiashop,
  dts.dts_tonggiamgiavanchuyen,
  dts.dts_tongtienkhachhangthanhtoan,
  dts.dts_trangthaithanhtoan,
  (dts.dts_tongtienhang - COALESCE(dts.dts_tonggiamgiashop, 0)) AS so_tien_shop,
  dts.gh_ma,
  gh.gh_ten,
  dts.dvvc_ma,
  dv.dvvc_ten,
  dm.kh_ma,
  kh.kh_ten,
  kh.kh_sdt,
  ttgh.shipper_ma,
  sp.shipper_ten,
  ttgh.ttgh_thoidiem,
  ttgh.ttgh_da_nop_tien,
  st.ttdh_ma AS trang_thai_don,
  ttdh.ttdh_ten AS trang_thai_don_ten,
  EXISTS (
    SELECT 1
    FROM chitiet_tat_toan c
    JOIN phieu_tat_toan p ON p.ptt_ma = c.ptt_ma
    WHERE c.dts_ma = dts.dts_ma
      AND p.ptt_trang_thai_thanh_toan <> 'HUY'
  ) AS da_tat_toan
`;

const DON_JOIN = `
  JOIN gianhang gh ON gh.gh_ma = dts.gh_ma
  LEFT JOIN donvivanchuyen dv ON dv.dvvc_ma = dts.dvvc_ma
  LEFT JOIN donhangkhachmua dm ON dm.dm_ma = dts.dm_ma
  LEFT JOIN khachhang kh ON kh.kh_ma = dm.kh_ma
  LEFT JOIN thongtingiaohang ttgh ON ttgh.dts_ma = dts.dts_ma
  LEFT JOIN shipper sp ON sp.shipper_ma = ttgh.shipper_ma
  LEFT JOIN LATERAL (
    SELECT c.ttdh_ma
      FROM chitiettrangthaidonhang c
     WHERE c.dts_ma = dts.dts_ma
     ORDER BY c.ctttdh_thoidiem DESC
     LIMIT 1
  ) st ON TRUE
  LEFT JOIN trangthaidonhang ttdh ON ttdh.ttdh_ma = st.ttdh_ma
`;

const DON_FROM = `
  FROM donhangtheoshop dts
  ${DON_JOIN}
`;

// ---------- Tiện ích ----------
const sinhMa = async (client, bang, cot, tienTo) => {
  const r = await client.query(
    `SELECT ${cot} AS ma FROM ${bang} ORDER BY ${cot} DESC LIMIT 1`
  );
  let so = 1;
  if (r.rows.length) {
    const n = parseInt(String(r.rows[0].ma).replace(/\D/g, ''), 10);
    if (Number.isFinite(n)) so = n + 1;
  }
  return tienTo + String(so).padStart(8, '0');
};

const ghiLichSu = async (
  client,
  ycxlsc_ma,
  ttxlsc_ma,
  { ct_ma = null, nguoi = null, ghichu = null } = {}
) => {
  await client.query(
    `INSERT INTO chitiettrangthaisuco
       (ycxlsc_ma, ttxlsc_ma, ctxlsc_thoidiem, ctxlsc_ghichu,
        ctxlsc_ct_ma, ctxlsc_nguoi_thuc_hien)
     VALUES ($1, $2, clock_timestamp(), $3, $4, $5)`,
    [ycxlsc_ma, ttxlsc_ma, ghichu, ct_ma, nguoi]
  );
};

const themSla = (row) => {
  if (!row) return row;
  const han = row.ycxlsc_han_ket_luan
    ? new Date(row.ycxlsc_han_ket_luan).getTime()
    : null;
  const conLai = han ? Math.round((han - Date.now()) / 1000) : null;
  const dangMo = ['TTXLSC01', 'TTXLSC02', 'TTXLSC03'].includes(
    row.ycxlsc_trang_thai
  );
  return {
    ...row,
    con_lai_giay: conLai,
    qua_han_ket_luan: Boolean(dangMo && conLai !== null && conLai < 0),
    sap_han: Boolean(
      dangMo && conLai !== null && conLai >= 0 && conLai <= 4 * 3600
    ),
  };
};

const giaiToa = async (client, ycxlsc_ma) => {
  await client.query(
    `UPDATE giu_tien_su_co
        SET gtsc_trang_thai = 'DA_GIAI_TOA',
            gtsc_thoidiem_giai_toa = now()
      WHERE ycxlsc_ma = $1
        AND gtsc_trang_thai = 'DANG_GIU'`,
    [ycxlsc_ma]
  );
};

// ---------- Danh mục ----------
const layLoaiSuCo = async (ct_ma, client = pool) => {
  const r = await client.query(
    `SELECT l.lsc_ma, l.lsc_ten, l.lsc_mota
       FROM loaisuco l
      WHERE $1 = 'CT01'
         OR EXISTS (
              SELECT 1 FROM loaisuco_chuthe lc
               WHERE lc.lsc_ma = l.lsc_ma AND lc.ct_ma = $1
            )
      ORDER BY l.lsc_ma`,
    [ct_ma]
  );
  return r.rows;
};

const layTrangThai = async (client = pool) => {
  const r = await client.query(
    `SELECT ttxlsc_ma, ttxlsc_ten, ttxlsc_mota
       FROM trangthaixulysuco
      ORDER BY ttxlsc_ma`
  );
  return r.rows;
};

// ---------- Đơn hàng ----------
const layDonHang = async (dts_ma, client = pool) => {
  const r = await client.query(
    `SELECT ${DON_SELECT} ${DON_FROM} WHERE dts.dts_ma = $1`,
    [dts_ma]
  );
  return r.rows[0] || null;
};

// ---------- Phiếu ----------
const layPhieuGon = async (ycxlsc_ma, client = pool) => {
  const r = await client.query(
    `SELECT ycxlsc_ma, ycxlsc_trang_thai, dts_ma, lsc_ma,
            ct_ma_denghi, ycxlsc_ma_nguoi_gui, ycxlsc_han_ket_luan
       FROM yeucauxulysuco
      WHERE ycxlsc_ma = $1`,
    [ycxlsc_ma]
  );
  return r.rows[0] || null;
};

const demPhieuDangMo = async (
  dts_ma,
  lsc_ma,
  ct_ma,
  ma_nguoi_gui,
  client = pool
) => {
  const r = await client.query(
    `SELECT COUNT(*)::int AS so
       FROM yeucauxulysuco
      WHERE dts_ma = $1
        AND lsc_ma = $2
        AND ct_ma_denghi = $3
        AND ycxlsc_ma_nguoi_gui = $4
        AND ycxlsc_trang_thai NOT IN ('TTXLSC05','TTXLSC06','TTXLSC07')`,
    [dts_ma, lsc_ma, ct_ma, ma_nguoi_gui]
  );
  return r.rows[0]?.so || 0;
};

const themMinhChung = async (ycxlsc_ma, dsTep, client = pool) => {
  let dem = 0;
  for (const tep of dsTep) {
    dem += 1;
    const mcsc_ma = await sinhMa(client, 'minhchungsuco', 'mcsc_ma', 'MC');
    await client.query(
      `INSERT INTO minhchungsuco
         (mcsc_ma, mcsc_ten, mcsc_mota, mcsc_video, mcsc_thoidiem, ycxlsc_ma,
          mcsc_loai, mcsc_duongdan, mcsc_ct_ma, mcsc_ma_nguoi_gui)
       VALUES ($1, $2, $3, $4, clock_timestamp(), $5, $6, $7, $8, $9)`,
      [
        mcsc_ma,
        tep.ten || `Minh chứng ${dem}`,
        tep.mota || '',
        tep.loai === 'VIDEO' ? tep.duongdan : null,
        ycxlsc_ma,
        tep.loai || 'IMAGE',
        tep.duongdan,
        tep.ct_ma || null,
        tep.ma_nguoi_gui || null,
      ]
    );
  }
  return dem;
};

const taoPhieu = async (duLieu, dsTep = []) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ycxlsc_ma = await sinhMa(client, 'yeucauxulysuco', 'ycxlsc_ma', 'SC');

    await client.query(
      `INSERT INTO yeucauxulysuco
         (ycxlsc_ma, ycxlsc_thoidiem, ycxlsc_ten, ycxlsc_denghi, ycxlsc_mota,
          lsc_ma, dts_ma, ct_ma_denghi, ycxlsc_ma_nguoi_gui,
          ycxlsc_trang_thai, ycxlsc_han_ket_luan)
       VALUES ($1, now(), $2, $3, $4, $5, $6, $7, $8,
               'TTXLSC01', now() + interval '24 hours')`,
      [
        ycxlsc_ma,
        duLieu.ycxlsc_ten,
        duLieu.ycxlsc_denghi,
        duLieu.ycxlsc_mota,
        duLieu.lsc_ma,
        duLieu.dts_ma,
        duLieu.ct_ma_denghi,
        duLieu.ma_nguoi_gui,
      ]
    );

    await ghiLichSu(client, ycxlsc_ma, 'TTXLSC01', {
      ct_ma: duLieu.ct_ma_denghi,
      nguoi: duLieu.ma_nguoi_gui,
      ghichu: 'Khởi tạo phiếu sự cố',
    });

    // Ép kiểu tường minh: $1 xuất hiện ở cả SELECT và mệnh đề WHERE,
    // PostgreSQL suy luận text/varchar lệch nhau nếu không ép kiểu.
    const giu = await client.query(
      `INSERT INTO giu_tien_su_co
         (dts_ma, ycxlsc_ma, gtsc_so_tien, gtsc_ly_do)
       SELECT $1::varchar(10), $2::varchar(10), $3::numeric, $4::text
        WHERE NOT EXISTS (
          SELECT 1
          FROM chitiet_tat_toan c
          JOIN phieu_tat_toan p ON p.ptt_ma = c.ptt_ma
          WHERE c.dts_ma = $1::varchar(10)
            AND p.ptt_trang_thai_thanh_toan <> 'HUY'
        )
       ON CONFLICT (dts_ma, ycxlsc_ma) DO NOTHING`,
      [
        duLieu.dts_ma,
        ycxlsc_ma,
        duLieu.so_tien_shop || 0,
        'Giữ tiền do có sự cố chưa kết luận',
      ]
    );

    if (dsTep.length) {
      await themMinhChung(ycxlsc_ma, dsTep, client);
    }

    const han = await client.query(
      `SELECT ycxlsc_han_ket_luan FROM yeucauxulysuco WHERE ycxlsc_ma = $1`,
      [ycxlsc_ma]
    );

    await client.query('COMMIT');

    return {
      ycxlsc_ma,
      ycxlsc_trang_thai: 'TTXLSC01',
      ycxlsc_han_ket_luan: han.rows[0]?.ycxlsc_han_ket_luan || null,
      da_giu_tien: giu.rowCount > 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const layDanhSach = async (boLoc = {}) => {
  const {
    ct_ma,
    ma_nguoi_gui,
    admin = false,
    trang_thai,
    lsc_ma,
    qua_han,
    tu_ngay,
    den_ngay,
    q,
    page = 1,
    page_size = 20,
  } = boLoc;

  const dk = [];
  const ts = [];
  let idx = 1;

  if (!admin) {
    const cot = {
      CT02: 'dts.gh_ma',
      CT03: 'dts.dvvc_ma',
      CT04: 'dm.kh_ma',
      CT05: 'ttgh.shipper_ma',
    }[ct_ma];

    if (!cot) throw new Error('Loại chủ thể không hợp lệ.');

    dk.push(
      `((y.ct_ma_denghi = $${idx} AND y.ycxlsc_ma_nguoi_gui = $${idx + 1})
        OR ${cot} = $${idx + 1})`
    );
    ts.push(ct_ma, ma_nguoi_gui);
    idx += 2;
  }

  if (trang_thai) {
    dk.push(`y.ycxlsc_trang_thai = $${idx++}`);
    ts.push(trang_thai);
  }
  if (lsc_ma) {
    dk.push(`y.lsc_ma = $${idx++}`);
    ts.push(lsc_ma);
  }
  if (qua_han === '1' || qua_han === true) {
    dk.push(
      `(y.ycxlsc_han_ket_luan < now()
        AND y.ycxlsc_trang_thai IN ('TTXLSC01','TTXLSC02','TTXLSC03'))`
    );
  }
  if (tu_ngay) {
    dk.push(`y.ycxlsc_thoidiem >= $${idx++}::date`);
    ts.push(tu_ngay);
  }
  if (den_ngay) {
    dk.push(`y.ycxlsc_thoidiem < ($${idx++}::date + interval '1 day')`);
    ts.push(den_ngay);
  }
  if (q) {
    dk.push(
      `(y.ycxlsc_ma ILIKE $${idx}
        OR y.dts_ma ILIKE $${idx}
        OR y.ycxlsc_ten ILIKE $${idx})`
    );
    ts.push(`%${q}%`);
    idx += 1;
  }

  const whereSql = dk.length ? `WHERE ${dk.join(' AND ')}` : '';

  const fromSql = `
    FROM yeucauxulysuco y
    JOIN loaisuco l ON l.lsc_ma = y.lsc_ma
    JOIN trangthaixulysuco t ON t.ttxlsc_ma = y.ycxlsc_trang_thai
    JOIN donhangtheoshop dts ON dts.dts_ma = y.dts_ma
    ${DON_JOIN}
  `;

  const limit = Math.min(Math.max(Number(page_size) || 20, 1), 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const dem = await pool.query(
    `SELECT COUNT(*)::int AS tong ${fromSql} ${whereSql}`,
    ts
  );

  const ds = await pool.query(
    `SELECT
       y.ycxlsc_ma, y.ycxlsc_thoidiem, y.ycxlsc_ten, y.ycxlsc_denghi,
       y.ycxlsc_trang_thai, y.ycxlsc_huong_xu_ly, y.ycxlsc_can_chi_tien,
       y.ycxlsc_han_ket_luan, y.ycxlsc_nguoi_duyet, y.ycxlsc_thoidiem_duyet,
       y.ct_ma_denghi, y.ycxlsc_ma_nguoi_gui,
       l.lsc_ma, l.lsc_ten,
       t.ttxlsc_ten,
       ${DON_SELECT},
       (SELECT COUNT(*)::int FROM minhchungsuco m
         WHERE m.ycxlsc_ma = y.ycxlsc_ma) AS so_minh_chung
     ${fromSql}
     ${whereSql}
     ORDER BY y.ycxlsc_thoidiem DESC
     LIMIT ${limit} OFFSET ${offset}`,
    ts
  );

  return {
    danh_sach: ds.rows.map(themSla),
    tong: dem.rows[0]?.tong || 0,
    page: Number(page) || 1,
    page_size: limit,
  };
};

const layChiTiet = async (ycxlsc_ma) => {
  const phieuRes = await pool.query(
    `SELECT y.*, l.lsc_ten, t.ttxlsc_ten
       FROM yeucauxulysuco y
       JOIN loaisuco l ON l.lsc_ma = y.lsc_ma
       JOIN trangthaixulysuco t ON t.ttxlsc_ma = y.ycxlsc_trang_thai
      WHERE y.ycxlsc_ma = $1`,
    [ycxlsc_ma]
  );

  if (!phieuRes.rows.length) return null;
  const phieu = phieuRes.rows[0];

  const [don, mc, ls, tn, gt] = await Promise.all([
    layDonHang(phieu.dts_ma),
    pool.query(
      `SELECT mcsc_ma, mcsc_ten, mcsc_mota, mcsc_video, mcsc_duongdan,
              mcsc_loai, mcsc_thoidiem, mcsc_ct_ma, mcsc_ma_nguoi_gui
         FROM minhchungsuco
        WHERE ycxlsc_ma = $1
        ORDER BY mcsc_thoidiem`,
      [ycxlsc_ma]
    ),
    pool.query(
      `SELECT c.ctxlsc_thoidiem, c.ttxlsc_ma, t.ttxlsc_ten,
              c.ctxlsc_ghichu, c.ctxlsc_ct_ma, ch.ct_ten,
              c.ctxlsc_nguoi_thuc_hien
         FROM chitiettrangthaisuco c
         JOIN trangthaixulysuco t ON t.ttxlsc_ma = c.ttxlsc_ma
         LEFT JOIN chuthe ch ON ch.ct_ma = c.ctxlsc_ct_ma
        WHERE c.ycxlsc_ma = $1
        ORDER BY c.ctxlsc_thoidiem`,
      [ycxlsc_ma]
    ),
    pool.query(
      `SELECT ct.ct_ma_chiutrachnhiem AS ct_ma, ch.ct_ten,
              ct.cttn_vai_tro
         FROM chiutrachnhiemsuco ct
         JOIN chuthe ch ON ch.ct_ma = ct.ct_ma_chiutrachnhiem
        WHERE ct.ycxlsc_ma = $1
        ORDER BY ct.cttn_vai_tro, ct.ct_ma_chiutrachnhiem`,
      [ycxlsc_ma]
    ),
    pool.query(
      `SELECT gtsc_id, dts_ma, gtsc_so_tien, gtsc_ly_do, gtsc_trang_thai,
              gtsc_thoidiem_tao, gtsc_thoidiem_giai_toa
         FROM giu_tien_su_co
        WHERE ycxlsc_ma = $1`,
      [ycxlsc_ma]
    ),
  ]);

  return {
    phieu: themSla(phieu),
    don,
    minh_chung: mc.rows,
    lich_su: ls.rows,
    trach_nhiem: tn.rows,
    giu_tien: gt.rows[0] || null,
  };
};

// ---------- Chuyển trạng thái ----------
const chuyenTrangThai = async ({
  ycxlsc_ma,
  trang_thai,
  ct_ma = 'CT01',
  nguoi = null,
  ghichu = null,
  cotThem = {},
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sets = ['ycxlsc_trang_thai = $2'];
    const ts = [ycxlsc_ma, trang_thai];
    let idx = 3;

    for (const [cot, giaTri] of Object.entries(cotThem)) {
      sets.push(`${cot} = $${idx++}`);
      ts.push(giaTri);
    }

    await client.query(
      `UPDATE yeucauxulysuco SET ${sets.join(', ')} WHERE ycxlsc_ma = $1`,
      ts
    );

    if (trang_thai === 'TTXLSC05' || trang_thai === 'TTXLSC06') {
      await giaiToa(client, ycxlsc_ma);
    }

    await ghiLichSu(client, ycxlsc_ma, trang_thai, { ct_ma, nguoi, ghichu });

    await client.query('COMMIT');
    return { ycxlsc_ma, ycxlsc_trang_thai: trang_thai };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ---------- Kết luận ----------
const ketLuan = async (duLieu) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      ycxlsc_ma,
      nguoi_duyet,
      ket_luan,
      huong_xu_ly,
      trach_nhiem = [],
    } = duLieu;

    await client.query(
      `UPDATE yeucauxulysuco
          SET ycxlsc_trang_thai = 'TTXLSC04',
              ycxlsc_ket_luan = $2,
              ycxlsc_huong_xu_ly = $3,
              ycxlsc_can_chi_tien = false,
              ycxlsc_nguoi_duyet = $4,
              ycxlsc_thoidiem_duyet = now()
        WHERE ycxlsc_ma = $1`,
      [ycxlsc_ma, ket_luan, huong_xu_ly, nguoi_duyet]
    );

    await client.query(
      `DELETE FROM chiutrachnhiemsuco WHERE ycxlsc_ma = $1`,
      [ycxlsc_ma]
    );

    for (const tn of trach_nhiem) {
      await client.query(
        `INSERT INTO chiutrachnhiemsuco
           (ct_ma_chiutrachnhiem, ycxlsc_ma, cttn_vai_tro,
            cttn_phan_tram, cttn_so_tien)
         VALUES ($1, $2, $3, 0, 0)
         ON CONFLICT (ct_ma_chiutrachnhiem, ycxlsc_ma) DO UPDATE
           SET cttn_vai_tro = EXCLUDED.cttn_vai_tro`,
        [tn.ct_ma, ycxlsc_ma, tn.vai_tro]
      );
    }

    await ghiLichSu(client, ycxlsc_ma, 'TTXLSC04', {
      ct_ma: 'CT01',
      nguoi: nguoi_duyet,
      ghichu: ket_luan,
    });

    await client.query('COMMIT');

    return {
      ycxlsc_ma,
      ycxlsc_trang_thai: 'TTXLSC04',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ---------- KPI ----------
const getKpi = async () => {
  const r = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ycxlsc_trang_thai = 'TTXLSC01')::int AS cho_tiep_nhan,
       COUNT(*) FILTER (WHERE ycxlsc_trang_thai = 'TTXLSC02')::int AS dang_xem_xet,
       COUNT(*) FILTER (WHERE ycxlsc_trang_thai = 'TTXLSC04')::int AS da_ket_luan,
       COUNT(*) FILTER (WHERE ycxlsc_trang_thai = 'TTXLSC05')::int AS hoan_tat,
       COUNT(*) FILTER (
         WHERE ycxlsc_trang_thai IN ('TTXLSC01','TTXLSC02','TTXLSC03')
           AND ycxlsc_han_ket_luan >= now()
           AND ycxlsc_han_ket_luan <= now() + interval '4 hours'
       )::int AS sap_han,
       COUNT(*) FILTER (
         WHERE ycxlsc_trang_thai IN ('TTXLSC01','TTXLSC02','TTXLSC03')
           AND ycxlsc_han_ket_luan < now()
       )::int AS qua_han_ket_luan
     FROM yeucauxulysuco`
  );

  return r.rows[0];
};

// ---------- Quét SLA ----------
const layPhieuQuaHanKetLuan = async (gioiHan = 50) => {
  const r = await pool.query(
    `SELECT y.ycxlsc_ma, y.ycxlsc_ten, y.ycxlsc_han_ket_luan,
            y.dts_ma, y.ct_ma_denghi, y.ycxlsc_ma_nguoi_gui,
            y.ycxlsc_nhac_lan
       FROM yeucauxulysuco y
      WHERE y.ycxlsc_trang_thai IN ('TTXLSC01','TTXLSC02','TTXLSC03')
        AND y.ycxlsc_han_ket_luan < now()
        AND y.ycxlsc_nhac_lan < 3
        AND (y.ycxlsc_nhac_luc IS NULL
             OR y.ycxlsc_nhac_luc < now() - interval '12 hours')
      ORDER BY y.ycxlsc_han_ket_luan
      LIMIT $1`,
    [gioiHan]
  );
  return r.rows;
};

const danhDauNhacKetLuan = async (ycxlsc_ma) => {
  await pool.query(
    `UPDATE yeucauxulysuco
        SET ycxlsc_nhac_lan = ycxlsc_nhac_lan + 1,
            ycxlsc_nhac_luc = now()
      WHERE ycxlsc_ma = $1`,
    [ycxlsc_ma]
  );
};

module.exports = {
  layLoaiSuCo,
  layTrangThai,
  layDonHang,
  layPhieuGon,
  demPhieuDangMo,
  themMinhChung,
  taoPhieu,
  layDanhSach,
  layChiTiet,
  chuyenTrangThai,
  ketLuan,
  getKpi,
  layPhieuQuaHanKetLuan,
  danhDauNhacKetLuan,
};