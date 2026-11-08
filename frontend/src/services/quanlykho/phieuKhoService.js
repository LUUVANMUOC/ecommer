import axiosClient from '../../config/axiosClient';

const phieuKhoService = {
  getChoXacNhan: (kho_ma, loai) =>
    axiosClient.get(`/quan-ly-kho/phieu-kho/cho-xac-nhan/${kho_ma}?loai=${loai}`),

  xacNhanNhap: (pk_ma, formData) =>
    axiosClient.put(`/quan-ly-kho/phieu-kho/xac-nhan/${pk_ma}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  xacNhanXuat: (pk_ma, formData) =>
    axiosClient.put(`/quan-ly-kho/phieu-kho/xac-nhan-xuat/${pk_ma}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getLichSu: (kho_ma, params = {}) =>
    axiosClient.get(`/quan-ly-kho/phieu-kho/lich-su/${kho_ma}`, { params }),

  getChiTiet: (pk_ma) => axiosClient.get(`/quan-ly-kho/phieu-kho/${pk_ma}`),
};

export default phieuKhoService;