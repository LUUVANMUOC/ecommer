// backend/src/controllers/suco/suCoController.js
const SuCoService = require('../../services/suco/suCoService');
const { gomTepSuCo } = require('../../config/uploadSuCo');

const xuLy = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || 'Lỗi máy chủ khi xử lý sự cố.',
    });
  }
};

// Người dùng hiện tại: client gửi ct_ma + ma (không có middleware JWT)
// Người dùng hiện tại: client gửi ct_ma + ma (không có middleware JWT)
// Express 5: req.body là undefined với GET → luôn fallback về {}
const nguoiDung = (req) => {
  const body = req.body || {};
  return {
    ct_ma: req.query.ct_ma || body.ct_ma || '',
    ma: req.query.ma || body.ma || body.ma_nguoi_gui || '',
  };
};

const nguoiDuyet = (req) => {
  const body = req.body || {};
  return body.stmdt_ma || body.nguoi_duyet || req.query.stmdt_ma || '';
};

const SuCoController = {
  // ---------- Danh mục ----------
  getLoaiSuCo: xuLy(async (req, res) => {
    const data = await SuCoService.layLoaiSuCo(req.query.ct_ma);
    return res.status(200).json(data);
  }),

  getTrangThai: xuLy(async (req, res) => {
    const data = await SuCoService.layTrangThai();
    return res.status(200).json(data);
  }),

  // ---------- Đơn hàng ----------
  getDonHang: xuLy(async (req, res) => {
    const { ct_ma, ma } = nguoiDung(req);
    const data = await SuCoService.layDonHang(req.params.dts_ma, ct_ma, ma);
    return res.status(200).json(data);
  }),

  // ---------- Tạo phiếu ----------
  taoPhieu: xuLy(async (req, res) => {
    const duLieu = {
      dts_ma: req.body.dts_ma,
      ct_ma_denghi: req.body.ct_ma_denghi || req.body.ct_ma,
      ma_nguoi_gui: req.body.ma_nguoi_gui || req.body.ma,
      lsc_ma: req.body.lsc_ma,
      ycxlsc_ten: req.body.ycxlsc_ten,
      ycxlsc_denghi: req.body.ycxlsc_denghi,
      ycxlsc_mota: req.body.ycxlsc_mota,
    };

    const data = await SuCoService.taoPhieu(
      duLieu,
      gomTepSuCo(req.files || {})
    );
    return res.status(201).json(data);
  }),

  // ---------- Danh sách / chi tiết ----------
  getDanhSach: xuLy(async (req, res) => {
    const data = await SuCoService.layDanhSach(req.query, nguoiDung(req));
    return res.status(200).json(data);
  }),
  getDanhSachAdmin: xuLy(async (req, res) => {
    const data = await SuCoService.layDanhSach(req.query, {
      ct_ma: 'CT01',
      ma: '',
    });
    return res.status(200).json(data);
  }),

  getChiTiet: xuLy(async (req, res) => {
    const data = await SuCoService.layChiTiet(
      req.params.ycxlsc_ma,
      nguoiDung(req)
    );
    return res.status(200).json(data);
  }),

  // ---------- Người gửi ----------
  themMinhChung: xuLy(async (req, res) => {
    const data = await SuCoService.themMinhChung(
      req.params.ycxlsc_ma,
      gomTepSuCo(req.files || {}),
      nguoiDung(req)
    );
    return res.status(200).json(data);
  }),

  huy: xuLy(async (req, res) => {
    const data = await SuCoService.huy(
      req.params.ycxlsc_ma,
      nguoiDung(req),
      req.body.ly_do
    );
    return res.status(200).json(data);
  }),

  // ---------- Admin ----------
  getKpi: xuLy(async (req, res) => {
    const data = await SuCoService.getKpi();
    return res.status(200).json(data);
  }),

  tiepNhan: xuLy(async (req, res) => {
    const data = await SuCoService.tiepNhan(
      req.params.ycxlsc_ma,
      nguoiDuyet(req),
      req.body.ghichu
    );
    return res.status(200).json(data);
  }),

  yeuCauBoSung: xuLy(async (req, res) => {
    const data = await SuCoService.yeuCauBoSung(
      req.params.ycxlsc_ma,
      nguoiDuyet(req),
      req.body.ghichu
    );
    return res.status(200).json(data);
  }),

  ketLuan: xuLy(async (req, res) => {
    const data = await SuCoService.ketLuan(
      req.params.ycxlsc_ma,
      req.body,
      nguoiDuyet(req)
    );
    return res.status(200).json(data);
  }),

  tuChoi: xuLy(async (req, res) => {
    const data = await SuCoService.tuChoi(
      req.params.ycxlsc_ma,
      nguoiDuyet(req),
      req.body.ly_do
    );
    return res.status(200).json(data);
  }),

  hoanTat: xuLy(async (req, res) => {
    const data = await SuCoService.hoanTat(
      req.params.ycxlsc_ma,
      nguoiDuyet(req),
      req.body.ghichu
    );
    return res.status(200).json(data);
  }),

  xacNhanChi: xuLy(async (req, res) => {
    const data = await SuCoService.xacNhanChi(
      req.params.ycxlsc_ma,
      req.params.ht_ma,
      nguoiDuyet(req),
      req.body.ma_giao_dich
    );
    return res.status(200).json(data);
  }),

  huyHoanTien: xuLy(async (req, res) => {
    const data = await SuCoService.huyHoanTien(
      req.params.ycxlsc_ma,
      req.params.ht_ma,
      nguoiDuyet(req),
      req.body.ly_do
    );
    return res.status(200).json(data);
  }),
};

module.exports = SuCoController;