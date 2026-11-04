// backend/src/services/khachhang/thongTinNhanHangService.js
const ThongTinNhanHangModel = require('../../models/khachhang/thongTinNhanHangModel');

const ThongTinNhanHangService = {
  getAll: async (kh_ma) => await ThongTinNhanHangModel.getAllByCustomer(kh_ma),
  
  create: async (data) => {
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

    // Tạo snapshot địa chỉ để lưu trữ
    data.ttnh_diachisnapshot = `${data.dc_mota}, ${data.xa_ten}, ${data.tinh_ten}`;

    return await ThongTinNhanHangModel.create(data);
  },
  
  update: async (ttnh_ma, data) => {
    data.ttnh_diachisnapshot = `${data.dc_mota}, ${data.xa_ten}, ${data.tinh_ten}`;
    return await ThongTinNhanHangModel.update(ttnh_ma, data);
  },
  
  delete: async (ttnh_ma) => await ThongTinNhanHangModel.delete(ttnh_ma),
  setDefault: async (kh_ma, ttnh_ma) => await ThongTinNhanHangModel.setDefault(kh_ma, ttnh_ma)
};

module.exports = ThongTinNhanHangService;