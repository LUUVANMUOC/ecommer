// src/services/khachhang/gioHangService.js
import axiosClient from "../../config/axiosClient";

const gioHangService = {
  getCart: (kh_ma) => axiosClient.get(`/khach-hang/gio-hang/${kh_ma}`),
  getCartCount: (kh_ma) => axiosClient.get(`/khach-hang/gio-hang/count/${kh_ma}`),
  addToCart: (data) => axiosClient.post("/khach-hang/gio-hang/add", data),
  updateQuantity: (data) => axiosClient.put("/khach-hang/gio-hang/update", data),
  removeItem: (kh_ma, ctsp_ma) => axiosClient.post("/khach-hang/gio-hang/remove", { kh_ma, ctsp_ma }),
  clearCart: (kh_ma) => axiosClient.delete(`/khach-hang/gio-hang/clear/${kh_ma}`),
};

export default gioHangService;