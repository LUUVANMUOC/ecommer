import axiosClient from "../../config/axiosClient";

const donHangShopService = {
  getOrders: (gh_ma) => axiosClient.get(`/nguoi-ban/don-hang/${gh_ma}`),
  getOrderDetail: (dts_ma) => axiosClient.get(`/nguoi-ban/don-hang/chi-tiet/${dts_ma}`),
  confirmOrder: (dts_ma) => axiosClient.put(`/nguoi-ban/don-hang/xac-nhan/${dts_ma}`),
  phanHoiDanhGia: (data) => axiosClient.put(`/nguoi-ban/don-hang/phan-hoi-danh-gia`, data),
};

export default donHangShopService;