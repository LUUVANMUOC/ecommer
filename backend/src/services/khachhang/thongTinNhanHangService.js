// backend/src/services/khachhang/thongTinNhanHangService.js
const pool = require('../../config/db');
const ThongTinNhanHangModel = require('../../models/khachhang/thongTinNhanHangModel');

// Dựng snapshot từ dữ liệu thật trong DB, tránh "undefined, undefined"
const buildSnapshot = async (dc_mota, xa_ma) => {
  if (!dc_mota || !String(dc_mota).trim()) {
    throw new Error('Vui lòng nhập địa chỉ chi tiết.');
  }
  const { rows } = await pool.query(
    `SELECT xa.xa_ten, tinh.tinh_ten
     FROM xaphuong xa
     JOIN tinhtp tinh ON xa.tinh_ma = tinh.tinh_ma
     WHERE xa.xa_ma = $1`,
    [xa_ma],
  );
  if (!rows[0]) throw new Error('Tỉnh/Xã không hợp lệ.');

  return `${String(dc_mota).trim()}, ${rows[0].xa_ten}, ${rows[0].tinh_ten}`;
};

const ThongTinNhanHangService = {
  getAll: async (kh_ma) => await ThongTinNhanHangModel.getAllByCustomer(kh_ma),

  create: async (data) => {
    if (!data.ttnh_ten || !String(data.ttnh_ten).trim()) {
      throw new Error('Vui lòng nhập tên người nhận.');
    }
    if (!data.ttnh_sdt || !String(data.ttnh_sdt).trim()) {
      throw new Error('Vui lòng nhập số điện thoại người nhận.');
    }

    let newTtnhMa = 'TTNH01';
    const latestTtnh = await ThongTinNhanHangModel.getLatestTTNHMa();
    if (latestTtnh) {
      const num = parseInt(latestTtnh.substring(4), 10) + 1;
      newTtnhMa = 'TTNH' + num.toString().padStart(2, '0');
    }
    data.ttnh_ma = newTtnhMa;

    let newDcMa = 'DC01';
    const latestDc = await ThongTinNhanHangModel.getLatestDCMa();
    if (latestDc) {
      const num = parseInt(latestDc.substring(2), 10) + 1;
      newDcMa = 'DC' + num.toString().padStart(2, '0');
    }
    data.dc_ma = newDcMa;

    // Snapshot địa chỉ để lưu trữ
    data.ttnh_diachisnapshot = await buildSnapshot(data.dc_mota, data.xa_ma);

    return await ThongTinNhanHangModel.create(data);
  },

  update: async (ttnh_ma, data) => {
    if (!data.ttnh_ten || !String(data.ttnh_ten).trim()) {
      throw new Error('Vui lòng nhập tên người nhận.');
    }
    if (!data.ttnh_sdt || !String(data.ttnh_sdt).trim()) {
      throw new Error('Vui lòng nhập số điện thoại người nhận.');
    }

    data.ttnh_diachisnapshot = await buildSnapshot(data.dc_mota, data.xa_ma);
    return await ThongTinNhanHangModel.update(ttnh_ma, data);
  },

  delete: async (ttnh_ma) => await ThongTinNhanHangModel.delete(ttnh_ma),

  setDefault: async (kh_ma, ttnh_ma) =>
    await ThongTinNhanHangModel.setDefault(kh_ma, ttnh_ma),
};

module.exports = ThongTinNhanHangService;