// backend/src/controllers/shipper/tienDangGiuController.js
const TienDangGiuService = require('../../services/shipper/tienDangGiuService');

const xuLy = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    return res.status(error.status || 500).json({
      message:
        error.message || 'Lỗi máy chủ khi xử lý dữ liệu tiền đang giữ.',
    });
  }
};

const TienDangGiuController = {
  getThongTin: xuLy(async (req, res) => {
    const data = await TienDangGiuService.getThongTin(req.params.shipper_ma);
    return res.status(200).json(data);
  }),

  getDangGiu: xuLy(async (req, res) => {
    const data = await TienDangGiuService.getDangGiu(
      req.params.shipper_ma,
      req.query,
    );
    return res.status(200).json(data);
  }),

  getThongKe: xuLy(async (req, res) => {
    const data = await TienDangGiuService.getThongKe(
      req.params.shipper_ma,
      req.query,
    );
    return res.status(200).json(data);
  }),

  getLichSuNop: xuLy(async (req, res) => {
    const data = await TienDangGiuService.getLichSuNop(
      req.params.shipper_ma,
      req.query,
    );
    return res.status(200).json(data);
  }),
};

module.exports = TienDangGiuController;