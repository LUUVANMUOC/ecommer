import axiosClient from '../../config/axiosClient';

const quanLyKhoAuthService = {
  login: (data) => axiosClient.post('/quan-ly-kho/auth/login', data),
};

export default quanLyKhoAuthService;