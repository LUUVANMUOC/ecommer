// src/services/san/maGiamGiaVanChuyenService.js
import axiosClient from "../../config/axiosClient";

const maGiamGiaVanChuyenService = {
  getAll: () => axiosClient.get("/ma-giam-gia-van-chuyen"),
  getById: (id) => axiosClient.get(`/ma-giam-gia-van-chuyen/${id}`),
  create: (data) => axiosClient.post("/ma-giam-gia-van-chuyen", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update: (id, data) => axiosClient.put(`/ma-giam-gia-van-chuyen/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  delete: (id) => axiosClient.delete(`/ma-giam-gia-van-chuyen/${id}`),
};

export default maGiamGiaVanChuyenService;