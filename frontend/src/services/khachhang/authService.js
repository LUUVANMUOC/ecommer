// src/services/khachhang/authService.js
import axiosClient from "../../config/axiosClient";

const khachHangService = {
  login: (data) => axiosClient.post("/khach-hang/auth/login", data),
  // Thêm headers cho FormData
  register: (formData) => axiosClient.post("/khach-hang/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export default khachHangService;