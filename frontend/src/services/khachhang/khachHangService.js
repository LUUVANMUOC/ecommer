// src/services/khachhang/khachHangService.js
import axiosClient from "../../config/axiosClient";

const khachHangProfileService = {
  getProfile: (kh_ma) => axiosClient.get(`/khach-hang/thong-tin/profile/${kh_ma}`),
  updateProfile: (kh_ma, formData) => axiosClient.put(`/khach-hang/thong-tin/profile/${kh_ma}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  saveBank: (kh_ma, data) => axiosClient.post(`/khach-hang/thong-tin/bank/${kh_ma}`, data),
  deleteBank: (kh_ma) => axiosClient.delete(`/khach-hang/thong-tin/bank/${kh_ma}`),
   changePassword: (data) => axiosClient.put(`/khach-hang/thong-tin/change-password`, data),
};

export default khachHangProfileService;