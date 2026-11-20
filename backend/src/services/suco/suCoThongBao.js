// backend/src/services/suco/suCoThongBao.js
// Gửi thông báo cho các bước xử lý sự cố. Mọi lỗi đều bị nuốt để không hỏng nghiệp vụ.
const pool = require('../../config/db');
const ThongBaoService = require('../thongbao/thongBaoService');

const LOAI_NGUOI = {
  CT01: 'SAN',
  CT02: 'SHOP',
  CT03: 'DVVC',
  CT04: 'KHACHHANG',
  CT05: 'SHIPPER',
};

const TEN_CHU_THE = {
  CT01: 'Sàn',
  CT02: 'Người bán',
  CT03: 'Đơn vị vận chuyển',
  CT04: 'Khách hàng',
  CT05: 'Shipper',
};

const TEN_HUONG = {
  KHONG_DEN: 'Không đền',
  HOAN_TIEN: 'Hoàn tiền',
  BOI_THUONG: 'Bồi thường',
  KHAC: 'Xử lý khác',
};

const LINK = {
  SAN: (ma) => `/admin/su-co/${ma}`,
  SHOP: (ma) => `/nguoi-ban/su-co/${ma}`,
  DVVC: (ma) => `/dvvc/su-co/${ma}`,
  KHACHHANG: (ma) => `/khach-hang/su-co/${ma}`,
  SHIPPER: (ma) => `/shipper/su-co/${ma}`,
};

const cat = (s, n) => (String(s || '').length > n ? `${String(s).slice(0, n - 1)}…` : String(s || ''));
const luc = (v) =>
  v
    ? new Date(v).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    : '';

const layNguCanh = async (ycxlsc_ma) => {
  const r = await pool.query(
    `SELECT y.ycxlsc_ma, y.ycxlsc_ten, y.dts_ma, y.ycxlsc_trang_thai,
            y.ycxlsc_huong_xu_ly, y.ycxlsc_ket_luan, y.ycxlsc_han_ket_luan,
            t.ttxlsc_ten, l.lsc_ten,
            d.gh_ma, d.dvvc_ma,
            dm.kh_ma, ttgh.shipper_ma
       FROM yeucauxulysuco y
       JOIN trangthaixulysuco t ON t.ttxlsc_ma = y.ycxlsc_trang_thai
       JOIN loaisuco l ON l.lsc_ma = y.lsc_ma
       JOIN donhangtheoshop d ON d.dts_ma = y.dts_ma
       LEFT JOIN donhangkhachmua dm ON dm.dm_ma = d.dm_ma
       LEFT JOIN thongtingiaohang ttgh ON ttgh.dts_ma = d.dts_ma
      WHERE y.ycxlsc_ma = $1`,
    [ycxlsc_ma]
  );
  if (!r.rows.length) return null;

  const admin = await pool.query(
    `SELECT stmdt_ma FROM san_thuong_mai_dien_tu`
  );

  return { ...r.rows[0], admin: admin.rows.map((x) => x.stmdt_ma) };
};

const taoNoiDung = (kieu, ctx, payload = {}) => {
  const ma = ctx.ycxlsc_ma;
  const don = ctx.dts_ma;
  const loaiSuCo = ctx.lsc_ten || 'Sự cố';
  const han = luc(ctx.ycxlsc_han_ket_luan);
  const nguoi = TEN_CHU_THE[payload.ct_ma] || 'Người dùng';

  switch (kieu) {
    case 'TAO':
      return {
        tieu_de: cat(`Sự cố mới: ${loaiSuCo} — đơn ${don}`, 200),
        noi_dung:
          `${nguoi} vừa báo sự cố "${loaiSuCo}" cho đơn ${don}.\n` +
          `Nội dung: ${ctx.ycxlsc_ten}.\n` +
          `Hạn admin phải kết luận: ${han}.`,
      };

    case 'DOI_TRANG_THAI':
      return {
        tieu_de: cat(`Sự cố ${ma} → ${ctx.ttxlsc_ten}`, 200),
        noi_dung:
          `Phiếu ${ma} (đơn ${don}) đã chuyển sang trạng thái "${ctx.ttxlsc_ten}".\n` +
          `Hạn kết luận: ${han}.`,
      };

    case 'KET_LUAN': {
      return {
        tieu_de: cat(`Kết luận sự cố ${ma}`, 200),
        noi_dung:
          `Phiếu ${ma} (đơn ${don}) đã có kết luận của Sàn.\n` +
          `Hướng xử lý: ${TEN_HUONG[ctx.ycxlsc_huong_xu_ly] || 'Khác'}.\n` +
          `Kết luận: ${ctx.ycxlsc_ket_luan || ''}`,
      };
    }

    case 'NHAC_KET_LUAN':
      return {
        tieu_de: cat(`Quá hạn kết luận sự cố ${ma}`, 200),
        noi_dung:
          `Phiếu ${ma} (đơn ${don}) đã quá hạn kết luận từ ${han}.\n` +
          `Vui lòng vào xử lý và quy trách nhiệm cho các bên.`,
      };

    default:
      return {
        tieu_de: cat(`Cập nhật sự cố ${ma}`, 200),
        noi_dung: `Phiếu ${ma} (đơn ${don}) vừa được cập nhật.`,
      };
  }
};

const gomNguoiNhan = (ctx, payload = {}) => {
  const nhom = { SAN: [], SHOP: [], DVVC: [], KHACHHANG: [], SHIPPER: [] };

  const them = (loai, ma) => {
    if (!loai || !ma || !nhom[loai]) return;
    const s = String(ma);
    if (!nhom[loai].includes(s)) nhom[loai].push(s);
  };

  for (const ma of ctx.admin || []) them('SAN', ma);

  if (!payload.chi_admin) {
    them('SHOP', ctx.gh_ma);
    them('DVVC', ctx.dvvc_ma);
    them('KHACHHANG', ctx.kh_ma);
    them('SHIPPER', ctx.shipper_ma);
  }

  // Khi tạo phiếu: người gửi không cần nhận lại thông báo của chính mình
  if (payload.kieu === 'TAO') {
    const loaiGui = LOAI_NGUOI[payload.ct_ma];
    if (loaiGui && payload.ma_nguoi_gui) {
      nhom[loaiGui] = nhom[loaiGui].filter(
        (ma) => ma !== String(payload.ma_nguoi_gui)
      );
    }
  }

  return nhom;
};

const gui = async (payload = {}) => {
  const ma = payload?.phieu?.ycxlsc_ma || payload?.ycxlsc_ma;
  if (!ma) return null;

  const ctx = await layNguCanh(ma);
  if (!ctx) return null;

  const { tieu_de, noi_dung } = taoNoiDung(payload.kieu, ctx, payload);
  const nhom = gomNguoiNhan(ctx, payload);

  const ketQua = [];
  for (const [loai, ds] of Object.entries(nhom)) {
    if (!ds.length) continue;
    try {
      const r = await ThongBaoService.taoThongBaoVaGui({
        tieu_de,
        noi_dung,
        loai: 'SU_CO',
        nguon: 'HE_THONG',
        nguon_ma: 'SU_CO',
        doituong_loai: 'SU_CO',
        doituong_ma: ctx.ycxlsc_ma,
        link: LINK[loai] ? LINK[loai](ctx.ycxlsc_ma) : '',
        nhom: 'SU_CO',
        ds_nguoinhan: ds.map((x) => ({ loai, ma: x })),
      });
      ketQua.push(r);
    } catch (error) {
      // bỏ qua để không ảnh hưởng nghiệp vụ
    }
  }

  return ketQua;
};

module.exports = { gui, layNguCanh, TEN_CHU_THE, LOAI_NGUOI };