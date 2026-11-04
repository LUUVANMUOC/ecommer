import axiosClient from '../../config/axiosClient';

export const authService = {
    // API Đăng nhập
    loginAdmin: (data) => {
        return axiosClient.post('/auth/admin/login', data);
    },

    // API Đăng ký
    registerAdmin: (data) => {
        return axiosClient.post('/auth/admin/register', data);
    }
};