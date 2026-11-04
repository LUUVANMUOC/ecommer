import axiosClient from '../../config/axiosClient';

const qlkShipperService = {
  getAll: (kho_ma) => axiosClient.get(`/quan-ly-kho/shipper/${kho_ma}`),

  create: (formData) =>
    axiosClient.post('/quan-ly-kho/shipper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (shipper_ma, formData) =>
    axiosClient.put(`/quan-ly-kho/shipper/${shipper_ma}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (shipper_ma, kho_ma) =>
    axiosClient.delete(`/quan-ly-kho/shipper/${shipper_ma}`, {
      params: { kho_ma },
    }),
};

export default qlkShipperService;