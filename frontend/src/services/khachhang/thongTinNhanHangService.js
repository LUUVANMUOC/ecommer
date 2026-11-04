import axiosClient from "../../config/axiosClient";

const thongTinNhanHangService = {
  getAll: (kh_ma) => axiosClient.get(`/khach-hang/dia-chi-nhan-hang/${kh_ma}`),
  create: (data) => axiosClient.post("/khach-hang/dia-chi-nhan-hang", data),
  update: (ttnh_ma, data) => axiosClient.put(`/khach-hang/dia-chi-nhan-hang/${ttnh_ma}`, data),
  delete: (ttnh_ma) => axiosClient.delete(`/khach-hang/dia-chi-nhan-hang/${ttnh_ma}`),
  setDefault: (kh_ma, ttnh_ma) => axiosClient.put(`/khach-hang/dia-chi-nhan-hang/mac-dinh/${ttnh_ma}`, { kh_ma }),
};
export default thongTinNhanHangService;