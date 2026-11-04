import axiosClient from "../../config/axiosClient";

const donHangService = {
  getMyOrders: (kh_ma) => axiosClient.get(`/khach-hang/don-hang/${kh_ma}`),
  cancelOrder: (dts_ma) => axiosClient.put(`/khach-hang/don-hang/huy/${dts_ma}`),
};

export default donHangService;