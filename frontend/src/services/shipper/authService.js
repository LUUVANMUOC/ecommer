// src/services/shipper/authService.js
import axiosClient from '../../config/axiosClient';

const shipperAuthService = {
  login: (data) => {
    // data: { sdt, password }
    return axiosClient.post('/dvvc/shipper/auth/login', data);
  }
};

export default shipperAuthService;