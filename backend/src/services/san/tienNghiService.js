// frontend/src/services/san/tienNghiService.js
import axiosClient from '../../config/axiosClient';

const tienNghiService = {
  getAll: () => axiosClient.get('/tien-nghi'),
  create: (data) => axiosClient.post('/tien-nghi', data),
  update: (id, data) => axiosClient.put(`/tien-nghi/${id}`, data),
  delete: (id) => axiosClient.delete(`/tien-nghi/${id}`),
};

export default tienNghiService;