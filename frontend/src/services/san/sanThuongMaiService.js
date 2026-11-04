// src/services/san/sanThuongMaiService.js
import axiosClient from "../../config/axiosClient";

const sanThuongMaiService = {
  getProfile: (stmdt_ma) => axiosClient.get(`/san/profile/${stmdt_ma}`),
  updateProfile: (stmdt_ma, data) => axiosClient.put(`/san/profile/${stmdt_ma}`, data),
  changePassword: (data) => axiosClient.put(`/san/change-password`, data),
  saveBank: (stmdt_ma, data) => axiosClient.post(`/san/bank/${stmdt_ma}`, data),
  deleteBank: (stmdt_ma) => axiosClient.delete(`/san/bank/${stmdt_ma}`),
};

export default sanThuongMaiService;