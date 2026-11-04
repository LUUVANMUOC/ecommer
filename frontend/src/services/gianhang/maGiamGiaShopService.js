// src/services/gianhang/maGiamGiaShopService.js
import axiosClient from "../../config/axiosClient";

const maGiamGiaShopService = {
  getAllByShop: (gh_ma) => axiosClient.get(`/nguoi-ban/ma-giam-gia-shop/${gh_ma}`),
  getById: (id) => axiosClient.get(`/nguoi-ban/ma-giam-gia-shop/detail/${id}`),
  create: (data) => axiosClient.post("/nguoi-ban/ma-giam-gia-shop", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update: (id, data) => axiosClient.put(`/nguoi-ban/ma-giam-gia-shop/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  delete: (id) => axiosClient.delete(`/nguoi-ban/ma-giam-gia-shop/${id}`),
};

export default maGiamGiaShopService;