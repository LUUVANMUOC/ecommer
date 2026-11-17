// backend/src/services/thongbao/thongBaoSanPham.js
// Thông báo tự động cho luồng duyệt sản phẩm:
//   - Shop gửi duyệt 1 phân loại      -> báo Sàn (admin)
//   - Shop gửi duyệt hàng loạt        -> báo Sàn (1 thông báo tổng hợp)
//   - Sàn duyệt / đình chỉ phân loại  -> báo Shop
const pool = require('../../config/db');
const ThongBaoService = require('./thongBaoService');

const LINK_DUYET_SAN_PHAM = '/admin/duyet-san-pham';
const linkQuanLySanPham = (sp_ma) => `/nguoi-ban/quan-ly-san-pham/${sp_ma}`;

// Cắt chuỗi để không vượt giới hạn tiêu đề (200) của thongBaoService
const cat = (value, max) => {
  const s = String(value ?? '').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

// Lấy tên phân loại + sản phẩm + shop từ 1 ctsp_ma
const layTheoCtsp = async (ctsp_ma) => {
  const res = await pool.query(
    `SELECT ctsp.ctsp_ma, ctsp.ctsp_ten,
            sp.sp_ma, sp.sp_ten,
            gh.gh_ma, gh.gh_ten
     FROM chitietsanpham ctsp
     JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
     JOIN gianhang gh ON sp.gh_ma = gh.gh_ma
     WHERE ctsp.ctsp_ma = $1`,
    [ctsp_ma],
  );
  return res.rows[0] || null;
};

// Lấy tên sản phẩm + shop từ sp_ma (dùng cho gửi duyệt hàng loạt)
const layTheoSp = async (sp_ma) => {
  const res = await pool.query(
    `SELECT sp.sp_ma, sp.sp_ten, gh.gh_ma, gh.gh_ten
     FROM sanpham sp
     JOIN gianhang gh ON sp.gh_ma = gh.gh_ma
     WHERE sp.sp_ma = $1`,
    [sp_ma],
  );
  return res.rows[0] || null;
};

// ==========================================================
// 1. Shop gửi duyệt 1 phân loại -> báo Sàn
// ==========================================================
const guiSanChoDuyet = async ({ ctsp_ma, yeucau, stmdt_ma }) => {
  if (!ctsp_ma || !stmdt_ma) return null;

  const info = await layTheoCtsp(ctsp_ma);
  if (!info) return null;

  const loiNhan = cat(yeucau, 300) || 'Yêu cầu duyệt sản phẩm';

  return ThongBaoService.taoThongBaoVaGui({
    tieu_de: cat(`Phân loại "${info.ctsp_ten}" chờ duyệt`, 200),
    noi_dung:
      `Shop "${info.gh_ten}" (${info.gh_ma}) vừa gửi duyệt phân loại ` +
      `"${info.ctsp_ten}" của sản phẩm "${info.sp_ten}" (${info.sp_ma}). ` +
      `Lời nhắn: "${loiNhan}". Vào trang Duyệt sản phẩm để xem xét.`,
    loai: 'HE_THONG',
    nguon: 'SHOP',
    nguon_ma: info.gh_ma,
    doituong_loai: 'SAN_PHAM',
    doituong_ma: info.sp_ma,
    nhom: 'SAN_PHAM',
    link: LINK_DUYET_SAN_PHAM,
    ds_nguoinhan: [{ loai: 'SAN', ma: stmdt_ma }],
  });
};

// ==========================================================
// 2. Shop gửi duyệt hàng loạt -> 1 thông báo tổng hợp cho Sàn
// ==========================================================
const guiSanChoDuyetHangLoat = async ({ sp_ma, count, stmdt_ma }) => {
  const soLuong = Number(count) || 0;
  if (!sp_ma || !soLuong || !stmdt_ma) return null;

  const info = await layTheoSp(sp_ma);
  if (!info) return null;

  return ThongBaoService.taoThongBaoVaGui({
    tieu_de: cat(`Shop "${info.gh_ten}" gửi duyệt ${soLuong} phân loại`, 200),
    noi_dung:
      `Shop "${info.gh_ten}" (${info.gh_ma}) vừa gửi duyệt ${soLuong} phân loại ` +
      `của sản phẩm "${info.sp_ten}" (${info.sp_ma}). ` +
      'Vào trang Duyệt sản phẩm để xem xét.',
    loai: 'HE_THONG',
    nguon: 'SHOP',
    nguon_ma: info.gh_ma,
    doituong_loai: 'SAN_PHAM',
    doituong_ma: info.sp_ma,
    nhom: 'SAN_PHAM',
    link: LINK_DUYET_SAN_PHAM,
    ds_nguoinhan: [{ loai: 'SAN', ma: stmdt_ma }],
  });
};

// ==========================================================
// 3. Sàn duyệt / đình chỉ -> báo Shop
// ==========================================================
const guiShopKetQuaDuyet = async ({ ctsp_ma, stmdt_ma, daDuyet, phanhoi }) => {
  if (!ctsp_ma || !stmdt_ma) return null;

  const info = await layTheoCtsp(ctsp_ma);
  if (!info) return null;

  const phanHoi = cat(phanhoi, 500) || (daDuyet ? 'Đã duyệt' : 'Bị đình chỉ');
  const ketQua = daDuyet ? 'đã được duyệt' : 'bị đình chỉ';

  const noi_dung = daDuyet
    ? `Sàn đã phê duyệt phân loại "${info.ctsp_ten}" của sản phẩm ` +
      `"${info.sp_ten}" (${info.sp_ma}). Phản hồi: "${phanHoi}". ` +
      'Sản phẩm có thể được bán.'
    : `Sàn đã đình chỉ phân loại "${info.ctsp_ten}" của sản phẩm ` +
      `"${info.sp_ten}" (${info.sp_ma}). Lý do: "${phanHoi}". ` +
      'Sản phẩm không thể bán cho đến khi được duyệt lại.';

  return ThongBaoService.taoThongBaoVaGui({
    tieu_de: cat(`Phân loại "${info.ctsp_ten}" ${ketQua}`, 200),
    noi_dung,
    loai: 'HE_THONG',
    nguon: 'SAN',
    nguon_ma: stmdt_ma,
    doituong_loai: 'SAN_PHAM',
    doituong_ma: info.sp_ma,
    nhom: 'SAN_PHAM',
    link: linkQuanLySanPham(info.sp_ma),
    ds_nguoinhan: [{ loai: 'SHOP', ma: info.gh_ma }],
  });
};

module.exports = {
  guiSanChoDuyet,
  guiSanChoDuyetHangLoat,
  guiShopKetQuaDuyet,
};