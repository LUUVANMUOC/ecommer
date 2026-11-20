// backend/src/models/suco/suCoThanhToanModel.js
// Thanh toán khoản hoàn tiền/bồi thường của sự cố:
// tạo QR nhận tiền (VietQR) và tự xác nhận khi webhook SePay báo tiền vào.
const pool = require('../../config/db');

const TAI_KHOAN_SQL = {
  CT01: `
    SELECT t.stmdt_ma AS chu_the_ma,
           t.ttnt_stmdt_sotaikhoan AS so_tai_khoan,
           t.ttnt_stmdt_tentaikhoan AS ten_tai_khoan,
           n.nhg_ma AS nganhang_ma,
           n.nhg_ten AS nganhang_ten,
           s.stmdt_ten AS ten_chu_the
      FROM thongtinnhantien_stmdt t
      JOIN nganhang n ON n.nhg_ma = t.nganhang_ma
      LEFT JOIN san_thuong_mai_dien_tu s ON s.stmdt_ma = t.stmdt_ma
     ORDER BY t.stmdt_ma
     LIMIT 1`,
  CT02: `
    SELECT t.gh_ma AS chu_the_ma,
           t.ttnt_gianhang_sotaikhoan AS so_tai_khoan,
           t.ttnt_gianhang_tentaikhoan AS ten_tai_khoan,
           n.nhg_ma AS nganhang_ma,
           n.nhg_ten AS nganhang_ten,
           g.gh_ten AS ten_chu_the
      FROM thongtinnhantien_gianhang t
      JOIN nganhang n ON n.nhg_ma = t.nh_ma
      LEFT JOIN gianhang g ON g.gh_ma = t.gh_ma
     WHERE t.gh_ma = $1
     LIMIT 1`,
  CT03: `
    SELECT t.dvvc_ma AS chu_the_ma,
           t.ttnt_dvvc_sotaikhoan AS so_tai_khoan,
           t.ttnt_dvvc_tentaikhoan AS ten_tai_khoan,
           n.nhg_ma AS nganhang_ma,
           n.nhg_ten AS nganhang_ten,
           d.dvvc_ten AS ten_chu_the
      FROM thongtinnhantien_dvvc t
      JOIN nganhang n ON n.nhg_ma = t.nganhang_ma
      LEFT JOIN donvivanchuyen d ON d.dvvc_ma = t.dvvc_ma
     WHERE t.dvvc_ma = $1
     LIMIT 1`,
  CT04: `
    SELECT t.kh_ma AS chu_the_ma,
           t.ttnt_kh_sotaikhoan AS so_tai_khoan,
           t.ttnt_kh_tennguoinhan AS ten_tai_khoan,
           n.nhg_ma AS nganhang_ma,
           n.nhg_ten AS nganhang_ten,
           k.kh_ten AS ten_chu_the
      FROM thongtinnhantien_kh t
      JOIN nganhang n ON n.nhg_ma = t.nganhang_ma
      LEFT JOIN khachhang k ON k.kh_ma = t.kh_ma
     WHERE t.kh_ma = $1
     LIMIT 1`,
};

const loiCoTrangThai = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const chupAnhChuThe = (row) => ({
  ct_ma: row.ct_ma,
  ten: row.ten,
});

// Lấy khoản hoàn tiền + đơn hàng liên quan.
const layKhoan = async (ht_ma, client = pool) => {
  const r = await client.query(
    `SELECT h.*,
            y.dts_ma,
            y.ycxlsc_trang_thai,
            dts.gh_ma,
            dts.dvvc_ma,
            dm.kh_ma,
            (SELECT g.shipper_ma
               FROM thongtingiaohang g
              WHERE g.dts_ma = dts.dts_ma
              ORDER BY g.ttgh_thoidiemtao DESC
              LIMIT 1) AS shipper_ma
       FROM hoantien h
       JOIN yeucauxulysuco y ON y.ycxlsc_ma = h.ycxlsc_ma
       JOIN donhangtheoshop dts ON dts.dts_ma = y.dts_ma
       LEFT JOIN donhangkhachmua dm ON dm.dm_ma = dts.dm_ma
      WHERE h.ht_ma = $1`,
    [ht_ma]
  );
  return r.rows[0] || null;
};

const layTenChuThe = async (client = pool) => {
  const r = await client.query(`SELECT ct_ma, ct_ten FROM chuthe`);
  return new Map(r.rows.map((x) => [x.ct_ma, x.ct_ten]));
};

// Tài khoản nhận tiền của chủ thể được đền bù.
const layTaiKhoanNhan = async (khoan, client = pool) => {
  const ct = String(khoan.ct_nhantien || '').toUpperCase();
  const sql = TAI_KHOAN_SQL[ct];
  if (!sql) {
    return {
      thieu_tk: true,
      ly_do:
        ct === 'CT05'
          ? 'Shipper chưa có thông tin tài khoản nhận tiền. Vui lòng xác nhận chi thủ công.'
          : 'Chủ thể nhận tiền không hỗ trợ chuyển khoản.',
    };
  }

  let thamSo = [];
  if (ct === 'CT02') thamSo = [khoan.gh_ma || ''];
  if (ct === 'CT03') thamSo = [khoan.dvvc_ma || ''];
  if (ct === 'CT04') thamSo = [khoan.kh_ma || ''];

  const r = await client.query(sql, thamSo);
  const tk = r.rows[0];
  if (!tk?.so_tai_khoan) {
    return {
      thieu_tk: true,
      ly_do: 'Bên nhận chưa cấu hình tài khoản nhận tiền.',
    };
  }
  return { ...tk, thieu_tk: false };
};

const taoQr = async (ht_ma) => {
  const ma = String(ht_ma || '').trim().toUpperCase();
  if (!ma) throw loiCoTrangThai('Thiếu mã khoản hoàn tiền.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const khoanRes = await client.query(
      `SELECT h.*
         FROM hoantien h
        WHERE h.ht_ma = $1
        FOR UPDATE`,
      [ma]
    );
    const khoan = khoanRes.rows[0];
    if (!khoan) throw loiCoTrangThai('Không tìm thấy khoản hoàn tiền.', 404);

    if (!['CHO_CHI', 'QUA_HAN'].includes(khoan.ht_trang_thai)) {
      throw loiCoTrangThai('Khoản này đã được xử lý, không thể tạo QR.', 409);
    }

    const chiTiet = await layKhoan(ma, client);
    const tenChuThe = await layTenChuThe(client);
    const taiKhoan = await layTaiKhoanNhan(chiTiet, client);

    if (taiKhoan.thieu_tk) {
      throw loiCoTrangThai(
        taiKhoan.ly_do || 'Bên nhận chưa có tài khoản nhận tiền.',
        400
      );
    }

    const qrCu = await client.query(
      `SELECT * FROM qr_hoan_tien WHERE ht_ma = $1 FOR UPDATE`,
      [ma]
    );
    const daTra = qrCu.rows[0]?.qr_trang_thai === 'DA_THANH_TOAN';
    if (daTra) {
      throw loiCoTrangThai('Khoản này đã được xác nhận thanh toán.', 409);
    }

    if (qrCu.rows.length) {
      await client.query(
        `UPDATE qr_hoan_tien
            SET qr_so_tien = $2,
                qr_trang_thai = 'CHUA_THANH_TOAN',
                qr_tao_luc = now()
          WHERE ht_ma = $1`,
        [ma, khoan.ht_tongtienhoan]
      );
    } else {
      await client.query(
        `INSERT INTO qr_hoan_tien (qr_ma, ht_ma, qr_so_tien)
         VALUES ($1, $1, $2)`,
        [ma, khoan.ht_tongtienhoan]
      );
    }

    await client.query(
      `UPDATE hoantien SET ht_phuong_thuc = 'QR' WHERE ht_ma = $1`,
      [ma]
    );

    await client.query('COMMIT');

    return {
      qr_ma: ma,
      ht_ma: ma,
      so_tien: Number(khoan.ht_tongtienhoan),
      noi_dung: ma,
      trang_thai: 'CHUA_THANH_TOAN',
      het_han: khoan.ht_han_chi,
      ben_tra: chupAnhChuThe({
        ct_ma: khoan.ct_tratien,
        ten: tenChuThe.get(khoan.ct_tratien) || khoan.ct_tratien,
      }),
      ben_nhan: {
        ...chupAnhChuThe({
          ct_ma: khoan.ct_nhantien,
          ten: tenChuThe.get(khoan.ct_nhantien) || khoan.ct_nhantien,
        }),
        thieu_tk: Boolean(taiKhoan.thieu_tk),
        ly_do: taiKhoan.ly_do || '',
        so_tai_khoan: taiKhoan.so_tai_khoan || '',
        ten_tai_khoan: taiKhoan.ten_tai_khoan || '',
        nganhang_ma: taiKhoan.nganhang_ma || '',
        nganhang_ten: taiKhoan.nganhang_ten || '',
        ten_chu_the: taiKhoan.ten_chu_the || '',
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const layTrangThai = async (ht_ma) => {
  const ma = String(ht_ma || '').trim().toUpperCase();
  if (!ma) throw loiCoTrangThai('Thiếu mã khoản hoàn tiền.');

  const khoan = await layKhoan(ma);
  if (!khoan) throw loiCoTrangThai('Không tìm thấy khoản hoàn tiền.', 404);

  const qrRes = await pool.query(
    `SELECT qr_ma, qr_so_tien, qr_trang_thai, qr_ma_giao_dich, qr_thoi_diem_tt
       FROM qr_hoan_tien
      WHERE ht_ma = $1`,
    [ma]
  );

  return {
    ht_ma: ma,
    co_qr: qrRes.rows.length > 0,
    ...(qrRes.rows[0] || {}),
    trang_thai_hoan_tien: khoan.ht_trang_thai,
  };
};

// Thông tin thanh toán cho bên trả/bên nhận xem (chỉ đọc).
const layThongTin = async (ht_ma) => {
  const ma = String(ht_ma || '').trim().toUpperCase();
  if (!ma) throw loiCoTrangThai('Thiếu mã khoản hoàn tiền.');

  const khoan = await layKhoan(ma);
  if (!khoan) throw loiCoTrangThai('Không tìm thấy khoản hoàn tiền.', 404);

  const [tenChuThe, taiKhoan, qrRes] = await Promise.all([
    layTenChuThe(),
    layTaiKhoanNhan(khoan),
    pool.query(
      `SELECT qr_ma, qr_so_tien, qr_trang_thai, qr_ma_giao_dich, qr_thoi_diem_tt
         FROM qr_hoan_tien
        WHERE ht_ma = $1`,
      [ma]
    ),
  ]);

  const qr = qrRes.rows[0] || null;

  return {
    ht_ma: ma,
    ycxlsc_ma: khoan.ycxlsc_ma,
    co_qr: Boolean(qr),
    qr: qr
      ? {
          ...qr,
          qr_so_tien: Number(qr.qr_so_tien),
        }
      : null,
    so_tien: Number(khoan.ht_tongtienhoan),
    noi_dung: ma,
    het_han: khoan.ht_han_chi,
    trang_thai_hoan_tien: khoan.ht_trang_thai,
    baochuyen_luc: khoan.ht_baochuyen_luc,
    baochuyen_ghichu: khoan.ht_baochuyen_ghichu,
    ben_tra: chupAnhChuThe({
      ct_ma: khoan.ct_tratien,
      ten: tenChuThe.get(khoan.ct_tratien) || khoan.ct_tratien,
    }),
    ben_nhan: {
      ...chupAnhChuThe({
        ct_ma: khoan.ct_nhantien,
        ten: tenChuThe.get(khoan.ct_nhantien) || khoan.ct_nhantien,
      }),
      thieu_tk: Boolean(taiKhoan.thieu_tk),
      ly_do: taiKhoan.ly_do || '',
      so_tai_khoan: taiKhoan.so_tai_khoan || '',
      ten_tai_khoan: taiKhoan.ten_tai_khoan || '',
      nganhang_ma: taiKhoan.nganhang_ma || '',
      nganhang_ten: taiKhoan.nganhang_ten || '',
      ten_chu_the: taiKhoan.ten_chu_the || '',
    },
  };
};

// Bên trả báo đã chuyển khoản. Chỉ ghi nhận để admin đối soát.
const danhDauDaChuyen = async (ht_ma, ghi_chu = '') => {
  const ma = String(ht_ma || '').trim().toUpperCase();
  if (!ma) throw loiCoTrangThai('Thiếu mã khoản hoàn tiền.');

  const r = await pool.query(
    `UPDATE hoantien
        SET ht_baochuyen_luc = now(),
            ht_baochuyen_ghichu = COALESCE(NULLIF($2, ''), ht_baochuyen_ghichu)
      WHERE ht_ma = $1
        AND ht_trang_thai IN ('CHO_CHI', 'QUA_HAN')
      RETURNING ht_ma, ht_baochuyen_luc, ht_baochuyen_ghichu`,
    [ma, String(ghi_chu || '').trim()]
  );

  if (!r.rows.length) {
    throw loiCoTrangThai('Khoản này đã được xử lý, không thể báo chuyển.', 409);
  }

  return r.rows[0];
};

// Admin huỷ QR đang mở (khoản chi vẫn giữ nguyên để chi bằng cách khác).
const huyQr = async (ht_ma) => {
  const ma = String(ht_ma || '').trim().toUpperCase();
  if (!ma) throw loiCoTrangThai('Thiếu mã khoản hoàn tiền.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r = await client.query(
      `UPDATE qr_hoan_tien
          SET qr_trang_thai = 'HUY'
        WHERE ht_ma = $1
          AND qr_trang_thai = 'CHUA_THANH_TOAN'
        RETURNING qr_ma`,
      [ma]
    );

    if (!r.rows.length) {
      throw loiCoTrangThai('QR không tồn tại hoặc đã đóng.', 409);
    }

    await client.query(
      `UPDATE hoantien
          SET ht_phuong_thuc = 'CHUYEN_KHOAN'
        WHERE ht_ma = $1
          AND ht_phuong_thuc = 'QR'`,
      [ma]
    );

    await client.query('COMMIT');
    return { ht_ma: ma, qr_ma: r.rows[0].qr_ma, trang_thai: 'HUY' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Webhook báo tiền vào tài khoản của bên nhận.
// loai: 'SHOP' | 'DVVC' | 'SAN'
//
// Khớp QR + đóng khoản chi trong CÙNG một transaction: khoá QR bằng
// FOR UPDATE rồi gọi SuCoModel.xacNhanChi dùng lại client này, nhờ vậy
// webhook gửi trùng/đến đồng thời không thể xác nhận 2 lần.
const xuLyWebhook = async (loai, maChuThe, payload = {}) => {
  if (payload.transferType !== 'in') return { matched: false };

  const noiDung = String(payload.code || payload.content || '').toUpperCase();
  if (!/HT\d{8}/.test(noiDung)) return { matched: false };

  const client = await pool.connect();
  let qr = null;
  let khongKhop = false;
  let lech = null;
  let thieuTien = null;
  let ketQua = null;

  try {
    await client.query('BEGIN');

    const r = await client.query(
      `SELECT q.qr_ma, q.qr_so_tien,
              h.ht_ma, h.ycxlsc_ma, h.ht_tongtienhoan
         FROM qr_hoan_tien q
         JOIN hoantien h ON h.ht_ma = q.ht_ma
         JOIN yeucauxulysuco y ON y.ycxlsc_ma = h.ycxlsc_ma
         JOIN donhangtheoshop dts ON dts.dts_ma = y.dts_ma
        WHERE q.qr_trang_thai = 'CHUA_THANH_TOAN'
          AND h.ht_trang_thai IN ('CHO_CHI', 'QUA_HAN')
          AND $1 ~ ('\\y' || q.qr_ma || '\\y')
          AND (
                ($2 = 'SHOP' AND h.ct_nhantien = 'CT02' AND dts.gh_ma = $3)
             OR ($2 = 'DVVC' AND h.ct_nhantien = 'CT03' AND dts.dvvc_ma = $3)
             OR ($2 = 'SAN' AND h.ct_nhantien = 'CT01')
          )
        ORDER BY length(q.qr_ma) DESC
        LIMIT 1
        FOR UPDATE OF q`,
      [noiDung, loai, maChuThe || null]
    );

    qr = r.rows[0] || null;

    if (!qr) {
      // Tiền vào có mã khoản chi nhưng không có QR đang mở (QR đã huỷ,
      // hoặc khoản đã chi bằng cách khác) -> cần admin đối soát.
      const maKhoan = (noiDung.match(/HT\d{8}/) || [null])[0];
      if (maKhoan) {
        const h = await client.query(
          `SELECT ht_ma, ycxlsc_ma, ht_tongtienhoan
             FROM hoantien
            WHERE ht_ma = $1
              AND ht_trang_thai IN ('CHO_CHI', 'QUA_HAN')`,
          [maKhoan]
        );
        lech = h.rows[0] || null;
      }
      khongKhop = true;
      await client.query('COMMIT');
    } else {
      const soTienNhan = Number(payload.transferAmount) || 0;
      if (soTienNhan < Number(qr.qr_so_tien)) {
        // Bắt buộc một giao dịch đủ tiền: giữ QR mở, báo admin đối soát.
        thieuTien = { nhan: soTienNhan, can: Number(qr.qr_so_tien) };
        await client.query('COMMIT');
      } else {
        const SuCoModel = require('./suCoModel');
        ketQua = await SuCoModel.xacNhanChi({
          ht_ma: qr.ht_ma,
          nguoi: null,
          ma_giao_dich: String(payload.id || payload.referenceCode || ''),
          nguon: 'WEBHOOK',
          client,
        });
        await client.query('COMMIT');
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const SuCoThongBao = require('../../services/suco/suCoThongBao');
  const guiThongBao = (duLieu) => {
    Promise.resolve()
      .then(() => SuCoThongBao.gui(duLieu))
      .catch(() => {});
  };

  if (khongKhop) {
    if (lech) {
      guiThongBao({
        kieu: 'TIEN_KHONG_KHOP',
        phieu: { ycxlsc_ma: lech.ycxlsc_ma },
        hoan_tien: lech,
        so_tien_nhan: Number(payload.transferAmount) || 0,
        noi_dung_chuyen: noiDung,
        chi_admin: true,
      });
    }
    return { matched: false };
  }

  if (thieuTien) {
    console.warn(
      `⚠️ [SỰ CỐ] Chuyển thiếu cho ${qr.qr_ma}: nhận ${thieuTien.nhan}, cần ${thieuTien.can}`
    );
    guiThongBao({
      kieu: 'THIEU_TIEN',
      phieu: { ycxlsc_ma: qr.ycxlsc_ma },
      hoan_tien: { ht_ma: qr.ht_ma, ht_tongtienhoan: qr.ht_tongtienhoan },
      so_tien_nhan: thieuTien.nhan,
      so_tien_can: thieuTien.can,
      chi_admin: true,
    });
    return {
      matched: true,
      skipped: 'insufficient_amount',
      qr_ma: qr.qr_ma,
      ht_ma: qr.ht_ma,
      so_tien_nhan: thieuTien.nhan,
      so_tien_can: thieuTien.can,
    };
  }

  guiThongBao({
    kieu: 'XAC_NHAN_CHI',
    nguon: 'WEBHOOK',
    phieu: { ycxlsc_ma: qr.ycxlsc_ma },
    hoan_tien: { ht_ma: qr.ht_ma, ht_tongtienhoan: qr.ht_tongtienhoan },
  });

  return {
    matched: true,
    success: true,
    qr_ma: qr.qr_ma,
    ht_ma: qr.ht_ma,
    ycxlsc_ma: qr.ycxlsc_ma,
    ...ketQua,
  };
};

module.exports = {
  taoQr,
  huyQr,
  layTrangThai,
  layThongTin,
  danhDauDaChuyen,
  xuLyWebhook,
};
