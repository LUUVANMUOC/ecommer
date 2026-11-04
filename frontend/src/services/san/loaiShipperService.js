// src/services/san/loaiShipperService.js
import axiosClient from '../../config/axiosClient';

const loaiShipperService = {
  getAll: () => axiosClient.get('/loai-shipper'),
};

export default loaiShipperService;