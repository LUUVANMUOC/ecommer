import axiosClient from '../../config/axiosClient';

const trungChuyenService = {
  getDonChoGui: (kho_di_ma) => axiosClient.get(`/quan-ly-kho/trung-chuyen/cho-gui/${kho_di_ma}`),
  getShippersLSP02: (kho_di_ma) => axiosClient.get(`/quan-ly-kho/trung-chuyen/shipper-lsp02/${kho_di_ma}`),
  guiTrungChuyen: (data) => axiosClient.post('/quan-ly-kho/trung-chuyen/gui', data),

  getDonChoNhan: (kho_den_ma) => axiosClient.get(`/quan-ly-kho/trung-chuyen/cho-nhan/${kho_den_ma}`),
  nhanHang: (dts_ma, kho_den_ma) => axiosClient.put(`/quan-ly-kho/trung-chuyen/nhan/${dts_ma}`, { kho_den_ma }),
};

export default trungChuyenService;