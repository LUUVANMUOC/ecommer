import axiosClient from "../../config/axiosClient";

const donHangService = {
  getMyOrders: (kh_ma) => axiosClient.get(`/khach-hang/don-hang/${kh_ma}`),
  cancelOrder: (dts_ma) => axiosClient.put(`/khach-hang/don-hang/huy/${dts_ma}`),
  xacNhanDaNhanHang: (dts_ma) => axiosClient.put(`/khach-hang/don-hang/xac-nhan/${dts_ma}`),
  guiDanhGia: (formData) => axiosClient.post(`/khach-hang/don-hang/danh-gia`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default donHangService;