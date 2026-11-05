// src/services/san/publicSanPhamService.js
import axiosClient from "../../config/axiosClient";

const publicSanPhamService = {
  getAll: () => {
    return axiosClient.get("/san-pham");
  },
  getDetail: (sp_ma) => {
    return axiosClient.get(`/san-pham/${sp_ma}`);
  },
  toggleLike: (ctsp_ma, isLiked) => 
    axiosClient.put(`/san-pham/${ctsp_ma}/like`, { isLiked }),

  // 🟢 Thêm 2 API mới
  recordView: (data) => axiosClient.post('/san-pham/record-view', data),
  getViewHistory: (kh_ma) => axiosClient.get(`/san-pham/lich-su-xem/${kh_ma}`),
  getShopProfile: (gh_ma) => axiosClient.get(`/san-pham/gian-hang/${gh_ma}`),
  getProductsByShop: (gh_ma, dmsp_ma = "") => {
    const url = `/san-pham/shop/${gh_ma}${dmsp_ma ? `?dmsp_ma=${dmsp_ma}` : ''}`;
    return axiosClient.get(url);
  },
    // 🟢 API Public lấy voucher của shop
  getShopVouchers: (gh_ma) => axiosClient.get(`/san-pham/gian-hang/${gh_ma}/vouchers`),


};

export default publicSanPhamService;