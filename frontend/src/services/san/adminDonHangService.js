import axiosClient from '../../config/axiosClient';

const adminDonHangService = {
  getFilters: () => axiosClient.get('/admin/don-hang/filters'),
  getOrders: (params) => axiosClient.get('/admin/don-hang', { params }),
  getOrderDetail: (dts_ma) => axiosClient.get(`/admin/don-hang/chi-tiet/${dts_ma}`),
};

export default adminDonHangService;