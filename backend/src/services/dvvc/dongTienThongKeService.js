// backend/src/services/dvvc/dongTienThongKeService.js
const DongTienThongKeModel = require('../../models/dvvc/dongTienThongKeModel');

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

const soTrang = (value) => soNguyenDuong(value, 1);
const soDong = (value) => Math.min(100, soNguyenDuong(value, 10));

const namHopLe = (value) => {
  if (value === undefined || value === null || value === '') {
    return new Date().getFullYear();
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 2000 || n > 2100) {
    throw loi('Năm không hợp lệ.');
  }
  return n;
};

const thangHopLe = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 12) {
    throw loi('Tháng không hợp lệ. Chỉ nhận giá trị từ 1 đến 12.');
  }
  return n;
};

const dvvcHopLe = (value) => {
  const ma = chuoi(value);
  if (!ma) throw loi('Thiếu mã đơn vị vận chuyển.');
  return ma;
};

const DongTienThongKeService = {
  getDanhMuc: async (dvvc_ma) => {
    return DongTienThongKeModel.getDanhMuc(dvvcHopLe(dvvc_ma));
  },

     getTongQuan: async (dvvc_ma, query = {}) => {
     const nam = namHopLe(query.nam);
     const thang = thangHopLe(query.thang);
     const kho_ma = chuoi(query.kho_ma) || null;
    const tinh_ma = chuoi(query.tinh_ma) || null;
    const xa_ma = chuoi(query.xa_ma) || null;

     return DongTienThongKeModel.getTongQuan({
       dvvc_ma: dvvcHopLe(dvvc_ma),
       kho_ma,
      tinh_ma,
      xa_ma,
       nam,
       thang,
     });
   },

  getDonDangGiu: async (dvvc_ma, query = {}) => {
    const loai = chuoi(query.loai).toLowerCase();
    if (!['shipper', 'kho'].includes(loai)) {
      throw loi('Loại đang giữ phải là "shipper" hoặc "kho".');
    }

    const ma = chuoi(query.ma);
    if (!ma) throw loi('Thiếu mã shipper hoặc mã kho.');

    return DongTienThongKeModel.getDonDangGiu({
      dvvc_ma: dvvcHopLe(dvvc_ma),
      loai,
      ma,
      page: soTrang(query.page),
      limit: soDong(query.limit),
    });
  },

  getDonChuaLap: async (dvvc_ma, query = {}) => {
    const kho_ma = chuoi(query.kho_ma) || null;

    return DongTienThongKeModel.getDonChuaLap({
      dvvc_ma: dvvcHopLe(dvvc_ma),
      kho_ma,
      page: soTrang(query.page),
      limit: soDong(query.limit),
    });
  },

  getDanhSachPhieu: async (dvvc_ma, query = {}) => {
    return DongTienThongKeModel.getDanhSachPhieu({
      dvvc_ma: dvvcHopLe(dvvc_ma),
      nam: namHopLe(query.nam),
      thang: thangHopLe(query.thang),
      page: soTrang(query.page),
      limit: soDong(query.limit),
    });
  },

  getPhieuChiTiet: async (dvvc_ma, pcd_ma) => {
    const maPhieu = chuoi(pcd_ma);
    if (!maPhieu) throw loi('Thiếu mã phiếu chi.');

    return DongTienThongKeModel.getPhieuChiTiet({
      dvvc_ma: dvvcHopLe(dvvc_ma),
      pcd_ma: maPhieu,
    });
  },
};

module.exports = DongTienThongKeService;