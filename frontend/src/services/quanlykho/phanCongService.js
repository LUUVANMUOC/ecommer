import axiosClient from '../../config/axiosClient';

const qlkPhanCongService = {
  getPendingOrders: (kho_ma) => axiosClient.get(`/quan-ly-kho/phan-cong/don-cho-lay/${kho_ma}`),
  getShippersByKho: (kho_ma) => axiosClient.get(`/quan-ly-kho/phan-cong/shipper-theo-kho/${kho_ma}`),
  assignShipper: (data) => axiosClient.post('/quan-ly-kho/phan-cong/phan-cong', data),
};

export default qlkPhanCongService;