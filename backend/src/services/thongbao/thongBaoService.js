// backend/src/services/thongbao/thongBaoService.js
const ThongBaoModel = require('../../models/thongbao/thongBaoModel');
const Realtime = require('../../realtime/socket');

const loi = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const chuoi = (value) => (typeof value === 'string' ? value.trim() : '');

const soNguyenDuong = (value, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const LOAI_HOP_LE = new Set([
  'PHI_CHIET_KHAU',
  'CUOC_VAN_CHUYEN',
  'MA_GIAM_GIA',
  'HE_THONG',
  'SU_CO',
]);
const NGUON_HOP_LE = new Set(['SAN', 'DVVC', 'SHOP', 'HE_THONG']);
const NN_HOP_LE = new Set(['SHOP', 'KHACHHANG', 'SAN', 'DVVC', 'SHIPPER']);

// Nhận mảng từ JSON body hoặc từ multipart (chuỗi JSON / 1 giá trị)
const docMang = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const s = value.trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [s];
};

const chuanHoaNguoiNhan = (ds, loaiMacDinh) => {
  const map = new Map();
  for (const item of Array.isArray(ds) ? ds : []) {
    const ma = chuoi(typeof item === 'string' ? item : item?.ma);
    if (!ma) continue;
    const loai = chuoi(item?.loai) || loaiMacDinh;
    if (!NN_HOP_LE.has(loai)) continue;
    map.set(`${loai}:${ma}`, { loai, ma });
  }
  return [...map.values()];
};

const gomTep = (files = {}) => {
  const ds = [];
  for (const f of files.anh || []) {
    ds.push({
      loai: 'image',
      ten: f.originalname,
      duongdan: `/uploads/thongbao/${f.filename}`,
      kichthuoc: f.size,
    });
  }
  for (const f of files.pdf || []) {
    ds.push({
      loai: 'pdf',
      ten: f.originalname,
      duongdan: `/uploads/thongbao/${f.filename}`,
      kichthuoc: f.size,
    });
  }
  return ds;
};

const chuanHoaNnLoai = (value) => {
  const loai = chuoi(value).toUpperCase();
  if (!NN_HOP_LE.has(loai)) throw loi('Loại người nhận không hợp lệ.');
  return loai;
};

// ================== GỬI ==================

const taoThongBaoVaGui = async (duLieu) => {
  const tieu_de = chuoi(duLieu.tieu_de);
  const noi_dung = chuoi(duLieu.noi_dung);
  const loai = chuoi(duLieu.loai) || 'HE_THONG';
  const nguon = chuoi(duLieu.nguon) || 'HE_THONG';

  if (tieu_de.length < 5 || tieu_de.length > 200) {
    throw loi('Tiêu đề phải từ 5 đến 200 ký tự.');
  }
  if (!noi_dung) throw loi('Nội dung thông báo không được để trống.');
  if (noi_dung.length > 5000) throw loi('Nội dung tối đa 5.000 ký tự.');
  if (!LOAI_HOP_LE.has(loai)) throw loi('Loại thông báo không hợp lệ.');
  if (!NGUON_HOP_LE.has(nguon)) throw loi('Nguồn gửi không hợp lệ.');

  const dsNguoiNhan = chuanHoaNguoiNhan(duLieu.ds_nguoinhan);
  if (!dsNguoiNhan.length) throw loi('Chưa chọn người nhận thông báo.');

  const thongBao = await ThongBaoModel.taoVaGui(
    {
      tieu_de,
      noi_dung,
      loai,
      nguon,
      nguon_ma: chuoi(duLieu.nguon_ma),
      doituong_loai: chuoi(duLieu.doituong_loai),
      doituong_ma: chuoi(duLieu.doituong_ma),
      link: chuoi(duLieu.link),
      tep: Array.isArray(duLieu.tep) ? duLieu.tep : [],
      nhom: chuoi(duLieu.nhom),
    },
    dsNguoiNhan,
  );

  const dayDu = await ThongBaoModel.getThongBao(thongBao.tb_ma);
  Realtime.emitMoi(dsNguoiNhan, { ...dayDu, nn_dadoc: false });

  return {
    tb_ma: thongBao.tb_ma,
    so_nguoi_nhan: dsNguoiNhan.length,
    thong_bao: dayDu,
  };
};

// Shop gửi cho khách đang theo dõi shop
const guiTuShop = async (gh_ma, duLieu, files) => {
  const maShop = chuoi(gh_ma);
  if (!maShop) throw loi('Thiếu mã gian hàng.');

  const dsTheoDoi = await ThongBaoModel.getKhachHangTheoDoi(maShop, '');
  if (!dsTheoDoi.length) {
    throw loi('Shop chưa có khách hàng theo dõi để gửi thông báo.');
  }

  const guiTatCa = duLieu.gui_tat_ca === true || duLieu.gui_tat_ca === 'true';
  const hopLe = new Set(dsTheoDoi.map((k) => k.kh_ma));
  const dsChon = docMang(duLieu.ds_kh_ma)
    .map(chuoi)
    .filter((ma) => hopLe.has(ma));

  const dsKhach = guiTatCa
    ? dsTheoDoi.map((k) => k.kh_ma)
    : [...new Set(dsChon)];

  if (!dsKhach.length) {
    throw loi(
      'Chưa chọn khách hàng hợp lệ (chỉ gửi được cho khách đang theo dõi shop).',
    );
  }

  return taoThongBaoVaGui({
    tieu_de: duLieu.tieu_de,
    noi_dung: duLieu.noi_dung,
    loai: 'HE_THONG',
    nguon: 'SHOP',
    nguon_ma: maShop,
    link: chuoi(duLieu.link),
    tep: gomTep(files),
    ds_nguoinhan: dsKhach.map((ma) => ({ loai: 'KHACHHANG', ma })),
  });
};

// Sàn gửi cho shop
const guiTuSan = async (stmdt_ma, duLieu, files) => {
  const maSan = chuoi(stmdt_ma);
  if (!maSan) throw loi('Thiếu mã sàn.');

  const dsShop = await ThongBaoModel.getShopDeGui('');
  if (!dsShop.length) throw loi('Chưa có gian hàng nào để gửi thông báo.');

  const guiTatCa = duLieu.gui_tat_ca === true || duLieu.gui_tat_ca === 'true';
  const hopLe = new Set(dsShop.map((s) => s.gh_ma));
  const dsChon = docMang(duLieu.ds_gh_ma)
    .map(chuoi)
    .filter((ma) => hopLe.has(ma));

  const dsShopGui = guiTatCa
    ? dsShop.map((s) => s.gh_ma)
    : [...new Set(dsChon)];

  if (!dsShopGui.length) throw loi('Chưa chọn gian hàng hợp lệ.');

  return taoThongBaoVaGui({
    tieu_de: duLieu.tieu_de,
    noi_dung: duLieu.noi_dung,
    loai: 'HE_THONG',
    nguon: 'SAN',
    nguon_ma: maSan,
    link: chuoi(duLieu.link),
    tep: gomTep(files),
    ds_nguoinhan: dsShopGui.map((ma) => ({ loai: 'SHOP', ma })),
  });
};

// ================== TỰ ĐỘNG ==================

// Sàn đổi phí chiết khấu ngành hàng
const thongBaoDoiPhi = async ({
  stmdt_ma,
  nh_ma,
  ten_nganh,
  phan_tram_cu,
  phan_tram_moi,
  ds_gh_ma,
}) => {
  const ds = chuanHoaNguoiNhan(ds_gh_ma, 'SHOP');
  if (!ds.length) return null;

  const so = (v) => (v === null || v === undefined ? null : Number(v));
  const cu = so(phan_tram_cu);
  const moi = so(phan_tram_moi);
  const ten = ten_nganh || nh_ma;

  const noi_dung =
    cu === null
      ? `Phí chiết khấu ngành hàng "${ten}" được cập nhật thành ${moi}%. Giá bán sản phẩm của shop đã được điều chỉnh theo mức phí mới.`
      : `Phí chiết khấu ngành hàng "${ten}" thay đổi từ ${cu}% thành ${moi}%. Giá bán sản phẩm của shop đã được điều chỉnh theo mức phí mới.`;

  return taoThongBaoVaGui({
    tieu_de: `Thay đổi phí chiết khấu: ${ten}`,
    noi_dung,
    loai: 'PHI_CHIET_KHAU',
    nguon: 'SAN',
    nguon_ma: stmdt_ma,
    doituong_loai: 'NGANH_HANG',
    doituong_ma: nh_ma,
    link: '/nguoi-ban/quan-ly-san-pham',
    ds_nguoinhan: ds,
  });
};

// ĐVVC đổi giá vận chuyển
const thongBaoDoiCuoc = async ({
  dvvc_ma,
  tieu_de,
  noi_dung,
  doituong_ma,
  ds_gh_ma,
}) => {
  const ds = chuanHoaNguoiNhan(ds_gh_ma, 'SHOP');
  if (!ds.length) return null;

  return taoThongBaoVaGui({
    tieu_de,
    noi_dung,
    loai: 'CUOC_VAN_CHUYEN',
    nguon: 'DVVC',
    nguon_ma: dvvc_ma,
    doituong_loai: 'BANG_GIA',
    doituong_ma,
    link: '/nguoi-ban/van-chuyen',
    ds_nguoinhan: ds,
  });
};

// Shop tạo mã giảm giá mới
const thongBaoVoucherMoi = async ({ gh_ma, ten_shop, voucher, ds_kh_ma }) => {
  const ds = chuanHoaNguoiNhan(ds_kh_ma, 'KHACHHANG');
  if (!ds.length) return null;

  const phanTram = Number(voucher?.mgg_shop_phantramgiam || 0);
  const donToiThieu = Number(voucher?.mgg_shop_giatridontoithieu || 0);
  const phan = [];

  if (phanTram > 0) phan.push(`giảm ${phanTram}%`);
  if (donToiThieu > 0) {
    phan.push(`cho đơn từ ${donToiThieu.toLocaleString('vi-VN')} đ`);
  }

  const noi_dung = `Shop "${ten_shop}" vừa tạo mã giảm giá "${voucher?.mgg_shop_ten}". ${
    phan.length ? `Ưu đãi ${phan.join(', ')}.` : ''
  } Xem ngay tại trang shop.`;

  return taoThongBaoVaGui({
    tieu_de: `Mã giảm giá mới từ ${ten_shop}`,
    noi_dung,
    loai: 'MA_GIAM_GIA',
    nguon: 'SHOP',
    nguon_ma: gh_ma,
    doituong_loai: 'MA_GIAM_GIA',
    doituong_ma: voucher?.mgg_shop_ma || '',
    link: `/shop/${gh_ma}`,
    ds_nguoinhan: ds,
  });
};

// ================== HỘP THƯ ==================

const getHopThu = async (nn_loai, nn_ma, query = {}) => {
  const loai = chuanHoaNnLoai(nn_loai);
  const ma = chuoi(nn_ma);
  if (!ma) throw loi('Thiếu mã người nhận.');

  return ThongBaoModel.getHopThu({
    nn_loai: loai,
    nn_ma: ma,
    trang_thai: chuoi(query.trang_thai),
    loai: chuoi(query.loai).toUpperCase(),
    nguon: chuoi(query.nguon).toUpperCase(),
    q: chuoi(query.q),
    page: soNguyenDuong(query.page, 1),
    limit: Math.min(50, soNguyenDuong(query.limit, 10)),
  });
};

const getChiTiet = async (nn_loai, nn_ma, tb_ma) => {
  const loai = chuanHoaNnLoai(nn_loai);
  const ma = chuoi(nn_ma);
  const id = chuoi(String(tb_ma ?? ''));
  if (!/^\d+$/.test(id)) throw loi('Mã thông báo không hợp lệ.', 400);

  const duLieu = await ThongBaoModel.getChiTiet(id, loai, ma);
  if (!duLieu) throw loi('Không tìm thấy thông báo của bạn.', 404);
  return duLieu;
};

const demChuaDoc = async (nn_loai, nn_ma) => {
  const loai = chuanHoaNnLoai(nn_loai);
  const ma = chuoi(nn_ma);
  if (!ma) throw loi('Thiếu mã người nhận.');

  const so_luong = await ThongBaoModel.demChuaDoc(loai, ma);
  return { so_luong };
};

const danhDauDaDoc = async (nn_loai, nn_ma, tb_ma) => {
  const loai = chuanHoaNnLoai(nn_loai);
  const ma = chuoi(nn_ma);
  const id = chuoi(String(tb_ma ?? ''));
  if (!id) throw loi('Thiếu mã thông báo.');
  if (!/^\d+$/.test(id)) throw loi('Mã thông báo không hợp lệ.', 400);

  const daDoc = await ThongBaoModel.danhDauDaDoc(id, loai, ma);
  if (!daDoc) throw loi('Không tìm thấy thông báo của bạn.', 404);

  const so_chua_doc = await ThongBaoModel.demChuaDoc(loai, ma);
  Realtime.emitDaDoc({ loai, ma }, { tb_ma: id, so_chua_doc });

  return { tb_ma: id, da_doc: true, so_chua_doc };
};

const danhDauDaDocTatCa = async (nn_loai, nn_ma) => {
  const loai = chuanHoaNnLoai(nn_loai);
  const ma = chuoi(nn_ma);
  if (!ma) throw loi('Thiếu mã người nhận.');

  const so_da_doc = await ThongBaoModel.danhDauDaDocTatCa(loai, ma);
  Realtime.emitDaDoc({ loai, ma }, { tb_ma: null, so_chua_doc: 0 });

  return { so_da_doc, so_chua_doc: 0 };
};

const getKhachHangTheoDoi = async (gh_ma, q = '') => {
  const ma = chuoi(gh_ma);
  if (!ma) throw loi('Thiếu mã gian hàng.');
  return ThongBaoModel.getKhachHangTheoDoi(ma, chuoi(q));
};

const getShopDeGui = async (q = '') => ThongBaoModel.getShopDeGui(chuoi(q));

module.exports = {
  taoThongBaoVaGui,
  guiTuShop,
  guiTuSan,
  thongBaoDoiPhi,
  thongBaoDoiCuoc,
  thongBaoVoucherMoi,
  getHopThu,
  getChiTiet,
  demChuaDoc,
  danhDauDaDoc,
  danhDauDaDocTatCa,
  getKhachHangTheoDoi,
  getShopDeGui,
};