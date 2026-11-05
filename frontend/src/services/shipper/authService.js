import axiosClient from '../../config/axiosClient';

const shipperAuthService = {
  login: (data) => axiosClient.post('/dvvc/shipper/auth/login', data),
  
  // 🟢 Gọi API đổi mật khẩu
  changePassword: (data) => axiosClient.put('/dvvc/shipper/auth/change-password', data),
};

export default shipperAuthService;