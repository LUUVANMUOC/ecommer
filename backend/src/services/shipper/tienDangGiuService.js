// backend/src/services/shipper/tienDangGiuService.js
const TienDangGiuModel = require('../../models/shipper/tienDangGiuModel');

const TZ = 'Asia/Ho_Chi_Minh';
const SO_NGAY_MAC_DINH = 30;
const SO_NGAY_TOI_DA = 366;

const loi = (message, status = 400) => Object.assign(new Error(message), { status });

const so = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isoTheoTZ = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const homNay = () => isoTheoTZ(new Date());

const congNgay = (iso, soNgay) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + soNgay);
  return dt.toISOString().slice(0, 10);
};

const demNgay = (tu_ngay, den_ngay) =>
  Math.round((Date.parse(den_ngay) - Date.parse(tu_ngay)) / 86400000) + 1;

const nhanNgay = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

const soTuanISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const thu = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - thu + 3);
  const nguong = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  return 1 + Math.round((dt - nguong) / (7 * 86400000));
};

const kiemTraMa = (value) => {
  const ma = String(value || '').trim();
  if (!ma) throw loi('Thiếu mã shipper.');
  if (ma.length > 10) throw loi('Mã shipper không hợp lệ.');
  return ma;
};

const kiemTraNgay = (value, ten) => {
  const ngay = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) {
    throw loi(`${ten} không hợp lệ (định dạng YYYY-MM-DD).`);
  }
  const [y, m, d] = ngay.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw loi(`${ten} không hợp lệ.`);
  }
  return ngay;
};

const layKhoangNgay = (query = {}) => {
  const den_ngay = query.den_ngay
    ? kiemTraNgay(query.den_ngay, 'Đến ngày')
    : homNay();
  const tu_ngay = query.tu_ngay
    ? kiemTraNgay(query.tu_ngay, 'Từ ngày')
    : congNgay(den_ngay, -(SO_NGAY_MAC_DINH - 1));

  if (tu_ngay > den_ngay) {
    throw loi('Từ ngày phải nhỏ hơn hoặc bằng đến ngày.');
  }
  if (demNgay(tu_ngay, den_ngay) > SO_NGAY_TOI_DA) {
    throw loi(`Khoảng thời gian tối đa ${SO_NGAY_TOI_DA} ngày.`);
  }

  return { tu_ngay, den_ngay };
};

const chuanHoaDon = (row) => ({
  dts_ma: row.dts_ma,
  thoi_diem_giao: row.thoi_diem_giao || null,
  ngay_giao: row.ngay_giao || null,
  gh_ten: row.gh_ten || '',
  da_xac_nhan: row.da_xac_nhan === true,
  khach_tra: so(row.khach_tra),
  tra_shop: so(row.tra_shop),
  phi_san: so(row.phi_san),
  cuoc_ship: so(row.cuoc_ship),
});

const chuanHoaKpi = (row = {}) => ({
  dang_giu: { so_don: so(row.dang_giu_don), tien: so(row.dang_giu_tien) },
  cho_xac_nhan: {
    so_don: so(row.cho_xac_nhan_don),
    tien: so(row.cho_xac_nhan_tien),
  },
  da_nop: { so_don: so(row.da_nop_don), tien: so(row.da_nop_tien) },
  giao_30: { so_don: so(row.giao_30_don), tien: so(row.giao_30_tien) },
});

const gomTheoTuan = (theo_ngay, den_ngay) => {
  const map = new Map();

  for (const row of theo_ngay) {
    const [y, m, d] = row.ngay.split('-').map(Number);
    const thu = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const lech = (thu + 6) % 7; // thứ 2 = 0
    const dauTuan = congNgay(row.ngay, -lech);

    if (!map.has(dauTuan)) {
      const cuoiTuan = congNgay(dauTuan, 6);
      map.set(dauTuan, {
        tuan: soTuanISO(dauTuan),
        nam: Number(dauTuan.slice(0, 4)),
        tu_ngay: dauTuan,
        den_ngay: cuoiTuan > den_ngay ? den_ngay : cuoiTuan,
        label: `T${soTuanISO(dauTuan)}`,
        so_don_vao: 0,
        tien_vao: 0,
        so_don_ra: 0,
        tien_ra: 0,
        so_du_cuoi_ky: 0,
      });
    }

    const tuan = map.get(dauTuan);
    tuan.so_don_vao += row.so_don_vao;
    tuan.tien_vao += row.tien_vao;
    tuan.so_don_ra += row.so_don_ra;
    tuan.tien_ra += row.tien_ra;
    tuan.so_du_cuoi_ky = row.so_du_cuoi_ky;
  }

  return [...map.values()];
};

const TienDangGiuService = {
  getThongTin: async (shipper_ma) => {
    const ma = kiemTraMa(shipper_ma);
    const shipper = await TienDangGiuModel.getThongTin(ma);

    if (!shipper) throw loi('Không tìm thấy shipper.', 404);

    const kpi = await TienDangGiuModel.getKpi(ma);

    return { shipper, kpi: chuanHoaKpi(kpi) };
  },

  getDangGiu: async (shipper_ma, query = {}) => {
    const ma = kiemTraMa(shipper_ma);
    const tu_ngay = query.tu_ngay ? kiemTraNgay(query.tu_ngay, 'Từ ngày') : null;
    const den_ngay = query.den_ngay
      ? kiemTraNgay(query.den_ngay, 'Đến ngày')
      : null;

    if (tu_ngay && den_ngay && tu_ngay > den_ngay) {
      throw loi('Từ ngày phải nhỏ hơn hoặc bằng đến ngày.');
    }

    const rows = await TienDangGiuModel.getDangGiu(ma, tu_ngay, den_ngay);
    const danhSach = rows.map(chuanHoaDon);
    const dang_giu = danhSach.filter((r) => r.da_xac_nhan);
    const cho_xac_nhan = danhSach.filter((r) => !r.da_xac_nhan);

    return {
      tu_ngay,
      den_ngay,
      dang_giu,
      cho_xac_nhan,
      tong: {
        so_don: dang_giu.length,
        tien: dang_giu.reduce((s, r) => s + r.khach_tra, 0),
        cho_xac_nhan_don: cho_xac_nhan.length,
        cho_xac_nhan_tien: cho_xac_nhan.reduce((s, r) => s + r.khach_tra, 0),
      },
    };
  },

  getThongKe: async (shipper_ma, query = {}) => {
    const ma = kiemTraMa(shipper_ma);
    const { tu_ngay, den_ngay } = layKhoangNgay(query);

    const [dauKy, rows] = await Promise.all([
      TienDangGiuModel.getSoDuDauKy(ma, tu_ngay),
      TienDangGiuModel.getTheoNgay(ma, tu_ngay, den_ngay),
    ]);

    const so_du_dau_ky = so(dauKy);
    const theoMap = new Map(rows.map((r) => [r.ngay, r]));

    const theo_ngay = [];
    let soDu = so_du_dau_ky;
    let tongVao = 0;
    let tongRa = 0;
    let donVao = 0;
    let donRa = 0;

    for (let i = 0; i < demNgay(tu_ngay, den_ngay); i += 1) {
      const ngay = congNgay(tu_ngay, i);
      const row = theoMap.get(ngay);
      const tien_vao = so(row && row.tien_vao);
      const tien_ra = so(row && row.tien_ra);
      const so_don_vao = so(row && row.so_don_vao);
      const so_don_ra = so(row && row.so_don_ra);

      soDu += tien_vao - tien_ra;
      tongVao += tien_vao;
      tongRa += tien_ra;
      donVao += so_don_vao;
      donRa += so_don_ra;

      theo_ngay.push({
        ngay,
        label: nhanNgay(ngay),
        so_don_vao,
        tien_vao,
        so_don_ra,
        tien_ra,
        so_du_cuoi_ky: soDu,
      });
    }

    return {
      tu_ngay,
      den_ngay,
      so_du_dau_ky,
      tong: {
        so_don_vao: donVao,
        tien_vao: tongVao,
        so_don_ra: donRa,
        tien_ra: tongRa,
        so_du_cuoi_ky: soDu,
      },
      theo_ngay,
      theo_tuan: gomTheoTuan(theo_ngay, den_ngay),
    };
  },

  getLichSuNop: async (shipper_ma, query = {}) => {
    const ma = kiemTraMa(shipper_ma);
    const { tu_ngay, den_ngay } = layKhoangNgay(query);
    const rows = await TienDangGiuModel.getLichSuNop(ma, tu_ngay, den_ngay);

    const map = new Map();

    for (const row of rows) {
      const thoiDiem = new Date(row.thoi_diem_nop);
      const khoa = thoiDiem.toISOString();

      if (!map.has(khoa)) {
        map.set(khoa, {
          khoa,
          thoi_diem_nop: row.thoi_diem_nop,
          ngay_nop: isoTheoTZ(thoiDiem),
          so_don: 0,
          tong_tien: 0,
          don: [],
        });
      }

      const lan = map.get(khoa);
      const don = chuanHoaDon(row);
      lan.so_don += 1;
      lan.tong_tien += don.khach_tra;
      lan.don.push(don);
    }

    const danh_sach = [...map.values()].sort(
      (a, b) => new Date(b.thoi_diem_nop) - new Date(a.thoi_diem_nop),
    );

    return {
      tu_ngay,
      den_ngay,
      danh_sach,
      tong: {
        so_lan: danh_sach.length,
        so_don: danh_sach.reduce((s, b) => s + b.so_don, 0),
        tong_tien: danh_sach.reduce((s, b) => s + b.tong_tien, 0),
      },
    };
  },
};

module.exports = TienDangGiuService;