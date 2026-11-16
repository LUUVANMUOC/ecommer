import axiosClient from "../../config/axiosClient";

const danhGiaShopService = {
  // params: { page, limit, sao, phan_hoi: '' | 'chua' | 'da' }
  getDanhSach: (gh_ma, params) =>
    axiosClient.get(`/nguoi-ban/danh-gia/${gh_ma}`, { params }),

  phanHoi: (data) => axiosClient.put(`/nguoi-ban/danh-gia/phan-hoi`, data),
};

export default danhGiaShopService;