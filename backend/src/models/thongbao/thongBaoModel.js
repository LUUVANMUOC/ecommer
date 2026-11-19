// backend/src/models/thongbao/thongBaoModel.js
const pool = require('../../config/db');

// Lấy tên + ảnh của nguồn gửi (sàn / ĐVVC / shop)
const NGUON_JOIN = `
  LEFT JOIN san_thuong_mai_dien_tu s ON t.tb_nguon = 'SAN'  AND s.stmdt_ma = t.tb_nguon_ma
  LEFT JOIN donvivanchuyen       d ON t.tb_nguon = 'DVVC' AND d.dvvc_ma  = t.tb_nguon_ma
  LEFT JOIN gianhang             g ON t.tb_nguon = 'SHOP' AND g.gh_ma    = t.tb_nguon_ma
`;

const COT_NGUON = `
  COALESCE(s.stmdt_ten, d.dvvc_ten, g.gh_ten, 'Hệ thống') AS nguon_ten,
  COALESCE(d.dvvc_hinhanh, g.gh_hinhanh, '')              AS nguon_hinhanh
`;

// Với thông báo PHI_CHIET_KHAU: lấy thêm mức phí cũ / phí mới.
// Ghép theo ngành hàng + sàn và chọn lần đổi gần thời điểm gửi thông báo nhất.
const PHI_JOIN = `
  LEFT JOIN LATERAL (
    SELECT
      p.psck_phantram AS phi_moi,
      (
        SELECT p2.psck_phantram
        FROM phisanchieckhau p2
        WHERE p2.nh_ma = p.nh_ma
          AND p2.stmdt_ma = p.stmdt_ma
          AND p2.psck_thoidiem < p.psck_thoidiem
        ORDER BY p2.psck_thoidiem DESC
        LIMIT 1
      ) AS phi_cu
    FROM phisanchieckhau p
    WHERE t.tb_loai = 'PHI_CHIET_KHAU'
      AND p.nh_ma = t.tb_doituong_ma
      AND p.stmdt_ma = t.tb_nguon_ma
    ORDER BY ABS(EXTRACT(EPOCH FROM (p.psck_thoidiem - t.tb_thoidiemtao)))
    LIMIT 1
  ) phi ON true
`;

const COT_PHI = `
  phi.phi_cu  AS tb_phi_cu,
  phi.phi_moi AS tb_phi_moi
`;

const COT_CHUNG = `
  t.tb_ma::text AS tb_ma,
  t.tb_tieude, t.tb_noidung, t.tb_loai, t.tb_nguon, t.tb_nguon_ma,
  t.tb_doituong_loai, t.tb_doituong_ma, t.tb_link, t.tb_tepdinhlieu,
  t.tb_nhom, t.tb_thoidiemtao,
  nn.nn_dadoc, nn.nn_thoidiemdoc,
  ${COT_PHI}
`;

// ================== GHI ==================

const taoThongBao = async (client, duLieu) => {
  const query = `
    INSERT INTO thongbao (
      tb_tieude, tb_noidung, tb_loai, tb_nguon, tb_nguon_ma,
      tb_doituong_loai, tb_doituong_ma, tb_link, tb_tepdinhlieu, tb_nhom
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
    RETURNING tb_ma::text AS tb_ma, *;
  `;
  const values = [
    duLieu.tieu_de,
    duLieu.noi_dung,
    duLieu.loai,
    duLieu.nguon,
    duLieu.nguon_ma || null,
    duLieu.doituong_loai || null,
    duLieu.doituong_ma || null,
    duLieu.link || null,
    JSON.stringify(Array.isArray(duLieu.tep) ? duLieu.tep : []),
    duLieu.nhom || null,
  ];
  const res = await client.query(query, values);
  return res.rows[0];
};

const themNguoiNhan = async (client, tb_ma, nn_loai, dsMa) => {
  if (!dsMa.length) return 0;
  const res = await client.query(
    `INSERT INTO thongbao_nguoinhan (tb_ma, nn_loai, nn_ma)
     SELECT $1::bigint, $2::varchar, x::varchar
     FROM unnest($3::text[]) AS x
     ON CONFLICT DO NOTHING`,
    [tb_ma, nn_loai, dsMa],
  );
  return res.rowCount;
};

// Tạo 1 thông báo + N người nhận trong cùng 1 transaction
const taoVaGui = async (duLieu, dsNguoiNhan) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const thongBao = await taoThongBao(client, duLieu);

    const theoLoai = new Map();
    for (const { loai, ma } of dsNguoiNhan) {
      if (!theoLoai.has(loai)) theoLoai.set(loai, []);
      theoLoai.get(loai).push(ma);
    }

    for (const [loai, dsMa] of theoLoai) {
      await themNguoiNhan(client, thongBao.tb_ma, loai, dsMa);
    }

    await client.query('COMMIT');
    return thongBao;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ================== ĐỌC ==================

const getThongBao = async (tb_ma) => {
  const res = await pool.query(
    `SELECT t.tb_ma::text AS tb_ma, t.tb_tieude, t.tb_noidung, t.tb_loai,
            t.tb_nguon, t.tb_nguon_ma, t.tb_doituong_loai, t.tb_doituong_ma,
            t.tb_link, t.tb_tepdinhlieu, t.tb_nhom, t.tb_thoidiemtao,
            ${COT_NGUON},
            ${COT_PHI}
     FROM thongbao t
     ${NGUON_JOIN}
     ${PHI_JOIN}
     WHERE t.tb_ma = $1::bigint`,
    [tb_ma],
  );
  return res.rows[0] || null;
};

const getHopThu = async ({
  nn_loai,
  nn_ma,
  trang_thai,
  loai,
  nguon,
  q,
  page = 1,
  limit = 10,
}) => {
  const dieuKien = ['nn.nn_loai = $1', 'nn.nn_ma = $2'];
  const thamSo = [nn_loai, nn_ma];

  if (trang_thai === 'chua_doc') dieuKien.push('nn.nn_dadoc = false');
  else if (trang_thai === 'da_doc') dieuKien.push('nn.nn_dadoc = true');

  if (loai) {
    thamSo.push(loai);
    dieuKien.push(`t.tb_loai = $${thamSo.length}`);
  }
  if (nguon) {
    thamSo.push(nguon);
    dieuKien.push(`t.tb_nguon = $${thamSo.length}`);
  }
  if (q) {
    thamSo.push(`%${q}%`);
    dieuKien.push(
      `(t.tb_tieude ILIKE $${thamSo.length} OR t.tb_noidung ILIKE $${thamSo.length})`,
    );
  }

  const where = dieuKien.join(' AND ');
  const offset = (page - 1) * limit;

  const [demRes, dsRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS tong,
              COUNT(*) FILTER (WHERE nn.nn_dadoc = false)::int AS chua_doc
       FROM thongbao t
       JOIN thongbao_nguoinhan nn ON nn.tb_ma = t.tb_ma
       WHERE ${where}`,
      thamSo,
    ),
    pool.query(
      `SELECT ${COT_CHUNG}, ${COT_NGUON}
       FROM thongbao t
       JOIN thongbao_nguoinhan nn ON nn.tb_ma = t.tb_ma
       ${NGUON_JOIN}
       ${PHI_JOIN}
       WHERE ${where}
       ORDER BY t.tb_thoidiemtao DESC, t.tb_ma DESC
       LIMIT $${thamSo.length + 1} OFFSET $${thamSo.length + 2}`,
      [...thamSo, limit, offset],
    ),
  ]);

  const tong = demRes.rows[0]?.tong || 0;

  return {
    rows: dsRes.rows,
    total: tong,
    chua_doc: demRes.rows[0]?.chua_doc || 0,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(tong / limit)),
  };
};

const getChiTiet = async (tb_ma, nn_loai, nn_ma) => {
  const res = await pool.query(
    `SELECT ${COT_CHUNG}, ${COT_NGUON}
     FROM thongbao t
     JOIN thongbao_nguoinhan nn ON nn.tb_ma = t.tb_ma
     ${NGUON_JOIN}
     ${PHI_JOIN}
     WHERE t.tb_ma = $1::bigint AND nn.nn_loai = $2 AND nn.nn_ma = $3`,
    [tb_ma, nn_loai, nn_ma],
  );
  return res.rows[0] || null;
};

const demChuaDoc = async (nn_loai, nn_ma) => {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS so_luong
     FROM thongbao_nguoinhan
     WHERE nn_loai = $1 AND nn_ma = $2 AND nn_dadoc = false`,
    [nn_loai, nn_ma],
  );
  return res.rows[0]?.so_luong || 0;
};

const danhDauDaDoc = async (tb_ma, nn_loai, nn_ma) => {
  const res = await pool.query(
    `UPDATE thongbao_nguoinhan
     SET nn_dadoc = true,
         nn_thoidiemdoc = COALESCE(nn_thoidiemdoc, now())
     WHERE tb_ma = $1::bigint AND nn_loai = $2 AND nn_ma = $3
     RETURNING tb_ma::text AS tb_ma, nn_dadoc, nn_thoidiemdoc`,
    [tb_ma, nn_loai, nn_ma],
  );
  return res.rows[0] || null;
};

const danhDauDaDocTatCa = async (nn_loai, nn_ma) => {
  const res = await pool.query(
    `UPDATE thongbao_nguoinhan
     SET nn_dadoc = true,
         nn_thoidiemdoc = COALESCE(nn_thoidiemdoc, now())
     WHERE nn_loai = $1 AND nn_ma = $2 AND nn_dadoc = false`,
    [nn_loai, nn_ma],
  );
  return res.rowCount;
};

// ================== DANH SÁCH ĐỂ GỬI ==================

const getKhachHangTheoDoi = async (gh_ma, q = '') => {
  const tuKhoa = q ? `%${q}%` : null;
  const res = await pool.query(
    `SELECT kh.kh_ma, kh.kh_ten, kh.kh_email, kh.kh_sdt, kh.kh_avatar,
            t.td_thoidiem
     FROM khachhang_theodoi_shop t
     JOIN khachhang kh ON kh.kh_ma = t.kh_ma
     WHERE t.gh_ma = $1
       AND ($2::text IS NULL
            OR kh.kh_ten ILIKE $2
            OR kh.kh_sdt ILIKE $2
            OR kh.kh_email ILIKE $2)
     ORDER BY t.td_thoidiem DESC`,
    [gh_ma, tuKhoa],
  );
  return res.rows;
};

const getShopDeGui = async (q = '') => {
  const tuKhoa = q ? `%${q}%` : null;
  const res = await pool.query(
    `SELECT gh.gh_ma, gh.gh_ten, gh.gh_hinhanh, gh.gh_email,
            (SELECT COUNT(*)::int
             FROM khachhang_theodoi_shop t
             WHERE t.gh_ma = gh.gh_ma) AS so_khach_theo_doi
     FROM gianhang gh
     WHERE ($1::text IS NULL
            OR gh.gh_ten ILIKE $1
            OR gh.gh_email ILIKE $1)
     ORDER BY gh.gh_ten ASC`,
    [tuKhoa],
  );
  return res.rows;
};

module.exports = {
  taoThongBao,
  themNguoiNhan,
  taoVaGui,
  getThongBao,
  getHopThu,
  getChiTiet,
  demChuaDoc,
  danhDauDaDoc,
  danhDauDaDocTatCa,
  getKhachHangTheoDoi,
  getShopDeGui,
};