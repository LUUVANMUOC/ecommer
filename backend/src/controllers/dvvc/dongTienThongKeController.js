// backend/src/controllers/dvvc/dongTienThongKeController.js
const DongTienThongKeService = require('../../services/dvvc/dongTienThongKeService');

const traVe = (res, data, status = 200) => {
  if (data === null || data === undefined) {
    return res.status(404).json({ message: 'Không tìm thấy dữ liệu.' });
  }
  return res.status(status).json(data);
};

const xuLy = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: error.message || 'Lỗi máy chủ khi xử lý dữ liệu dòng tiền.',
    });
  }
};

const DongTienThongKeController = {
  getDanhMuc: xuLy(async (req, res) => {
    const data = await DongTienThongKeService.getDanhMuc(req.params.dvvc_ma);
    return traVe(res, data);
  }),

  getTongQuan: xuLy(async (req, res) => {
    const data = await DongTienThongKeService.getTongQuan(
      req.params.dvvc_ma,
      req.query,
    );
    return traVe(res, data);
  }),

  getDonDangGiu: xuLy(async (req, res) => {
    const data = await DongTienThongKeService.getDonDangGiu(
      req.params.dvvc_ma,
      req.query,
    );
    return traVe(res, data);
  }),

  getDonChuaLap: xuLy(async (req, res) => {
    const data = await DongTienThongKeService.getDonChuaLap(
      req.params.dvvc_ma,
      req.query,
    );
    return traVe(res, data);
  }),

  getDanhSachPhieu: xuLy(async (req, res) => {
    const data = await DongTienThongKeService.getDanhSachPhieu(
      req.params.dvvc_ma,
      req.query,
    );
    return traVe(res, data);
  }),

  getPhieuChiTiet: xuLy(async (req, res) => {
    const data = await DongTienThongKeService.getPhieuChiTiet(
      req.params.dvvc_ma,
      req.params.pcd_ma,
    );
    return traVe(res, data);
  }),
};

module.exports = DongTienThongKeController;