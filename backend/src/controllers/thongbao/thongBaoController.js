// backend/src/controllers/thongbao/thongBaoController.js
const ThongBaoService = require('../../services/thongbao/thongBaoService');

const LOI_UPLOAD = {
  LIMIT_FILE_SIZE: 'Mỗi tệp đính kèm tối đa 10MB.',
  LIMIT_FILE_COUNT: 'Tối đa 5 tệp đính kèm cho mỗi thông báo.',
  LIMIT_UNEXPECTED_FILE: 'Chỉ được gửi tối đa 3 ảnh và 2 tệp PDF.',
};

const xuLy = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    const laLoiUpload = Boolean(LOI_UPLOAD[error.code]);
    const status = laLoiUpload ? 400 : error.status || 500;
    const message =
      LOI_UPLOAD[error.code] ||
      error.message ||
      'Lỗi máy chủ khi xử lý thông báo.';

    if (!laLoiUpload && status >= 500) {
      console.error('❌ Lỗi xử lý thông báo:', error);
    }
    return res.status(status).json({ message });
  }
};

const ThongBaoController = {
  // ===== Hộp thư =====
  getHopThu: xuLy(async (req, res) => {
    const data = await ThongBaoService.getHopThu(
      req.params.nn_loai,
      req.params.nn_ma,
      req.query,
    );
    return res.status(200).json(data);
  }),

  getChiTiet: xuLy(async (req, res) => {
    const data = await ThongBaoService.getChiTiet(
      req.params.nn_loai,
      req.params.nn_ma,
      req.params.tb_ma,
    );
    return res.status(200).json(data);
  }),

  demChuaDoc: xuLy(async (req, res) => {
    const data = await ThongBaoService.demChuaDoc(
      req.params.nn_loai,
      req.params.nn_ma,
    );
    return res.status(200).json(data);
  }),

  danhDauDaDoc: xuLy(async (req, res) => {
    const data = await ThongBaoService.danhDauDaDoc(
      req.params.nn_loai,
      req.params.nn_ma,
      req.params.tb_ma,
    );
    return res.status(200).json(data);
  }),

  danhDauDaDocTatCa: xuLy(async (req, res) => {
    const data = await ThongBaoService.danhDauDaDocTatCa(
      req.params.nn_loai,
      req.params.nn_ma,
    );
    return res.status(200).json(data);
  }),

  // ===== Danh sách để chọn người nhận =====
  getKhachHangTheoDoi: xuLy(async (req, res) => {
    const data = await ThongBaoService.getKhachHangTheoDoi(
      req.params.gh_ma,
      req.query.q,
    );
    return res.status(200).json(data);
  }),

  getShopDeGui: xuLy(async (req, res) => {
    const data = await ThongBaoService.getShopDeGui(req.query.q);
    return res.status(200).json(data);
  }),

  // ===== Gửi hàng loạt =====
  guiTuShop: xuLy(async (req, res) => {
    const gh_ma = req.body.gh_ma || req.body.GH_Ma || req.params.gh_ma;
    const data = await ThongBaoService.guiTuShop(
      gh_ma,
      req.body,
      req.files || {},
    );
    return res.status(201).json(data);
  }),

  guiTuSan: xuLy(async (req, res) => {
    const stmdt_ma =
      req.body.stmdt_ma || req.body.STMDT_Ma || req.params.stmdt_ma;
    const data = await ThongBaoService.guiTuSan(
      stmdt_ma,
      req.body,
      req.files || {},
    );
    return res.status(201).json(data);
  }),
};

module.exports = ThongBaoController;