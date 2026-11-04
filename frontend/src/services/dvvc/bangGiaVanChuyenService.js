// src/services/dvvc/bangGiaVanChuyenService.js
import axiosClient from "../../config/axiosClient";

const bangGiaVanChuyenService = {
  getFormData: () => axiosClient.get("/dvvc/bang-gia/form-data"),
  getBangGia: (dvvc_ma) => axiosClient.get(`/dvvc/bang-gia/${dvvc_ma}`),
  updateGia: (data) => axiosClient.post("/dvvc/bang-gia/update", data),
  
  createKhoiLuong: (data) => axiosClient.post("/dvvc/bang-gia/khoi-luong", data),
  updateKhoiLuong: (id, data) => axiosClient.put(`/dvvc/bang-gia/khoi-luong/${id}`, data),
  deleteKhoiLuong: (id) => axiosClient.delete(`/dvvc/bang-gia/khoi-luong/${id}`),
};

export default bangGiaVanChuyenService;