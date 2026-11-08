const PhieuKhoModel = require('../../models/quanlykho/phieuKhoModel');

const PhieuKhoService = {
  getChoXacNhan: async (kho_ma, loai) => {
    if (!kho_ma || !loai) throw new Error('Thiếu mã kho hoặc loại phiếu!');
    return await PhieuKhoModel.getChoXacNhan(kho_ma, loai);
  },
  xacNhanNhap: async (pk_ma, kho_ma, hinhanh, ghichu) => {
    if (!pk_ma || !kho_ma) throw new Error('Thiếu thông tin phiếu hoặc kho!');
    if (!hinhanh) throw new Error('Bắt buộc phải có ảnh minh chứng nhập kho!');
    return await PhieuKhoModel.xacNhanNhap(pk_ma, kho_ma, hinhanh, ghichu);
  },
  xacNhanXuat: async (pk_ma, kho_ma, hinhanh, ghichu) => {
    if (!pk_ma || !kho_ma) throw new Error('Thiếu thông tin phiếu hoặc kho!');
    if (!hinhanh) throw new Error('Bắt buộc phải có ảnh minh chứng xuất kho!');
    return await PhieuKhoModel.xacNhanXuat(pk_ma, kho_ma, hinhanh, ghichu);
  },
  getLichSu: async (kho_ma, loai, lyDo) => {
    if (!kho_ma) throw new Error('Thiếu mã kho!');
    return await PhieuKhoModel.getLichSu(kho_ma, loai, lyDo);
  },
  getChiTiet: async (pk_ma) => {
    const data = await PhieuKhoModel.getChiTiet(pk_ma);
    if (!data) throw new Error('Không tìm thấy phiếu!');
    return data;
  },
};
module.exports = PhieuKhoService;