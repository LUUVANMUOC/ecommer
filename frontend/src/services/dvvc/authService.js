// src/services/dvvc/authService.js
import axiosClient from '../../config/axiosClient';

export const authDVVCService = {
    // API Đăng nhập dành riêng cho ĐVVC
    login: (data) => {
        // data: { email, password }
        return axiosClient.post('/dvvc/auth/login', data);
    },

    // API Đăng ký dành riêng cho ĐVVC
    register: (formData) => {
        // formData chứa cả text và file ảnh
        return axiosClient.post('/dvvc/auth/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    }
};