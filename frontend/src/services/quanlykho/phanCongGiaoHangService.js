import axiosClient from '../../config/axiosClient';

const phanCongGiaoHangService = {
  getDonChoPhanCong: (kho_ma) => axiosClient.get(`/quan-ly-kho/phan-cong-giao-hang/don-cho-phan-cong/${kho_ma}`),
  getShippersLSP03: (kho_ma) => axiosClient.get(`/quan-ly-kho/phan-cong-giao-hang/shipper-lsp03/${kho_ma}`),
  phanCong: (data) => axiosClient.post('/quan-ly-kho/phan-cong-giao-hang/phan-cong', data),
};

export default phanCongGiaoHangService;