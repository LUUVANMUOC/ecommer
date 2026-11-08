// src/services/san/publicSanPhamService.js
import axiosClient from "../../config/axiosClient";

const publicSanPhamService = {
  // 🟢 Hàm này giờ sẽ dùng cho cả lấy danh sách VÀ tìm kiếm
  getAll: (params) => {
    return axiosClient.get("/san-pham", { params });
  },

  getDetail: (sp_ma) => {
    return axiosClient.get(`/san-pham/${sp_ma}`);
  },
  
  toggleLike: (ctsp_ma, isLiked) => 
    axiosClient.put(`/san-pham/${ctsp_ma}/like`, { isLiked }),

  // 🟢 Các API lịch sử và gian hàng
  recordView: (data) => axiosClient.post('/san-pham/record-view', data),
  getViewHistory: (kh_ma) => axiosClient.get(`/san-pham/lich-su-xem/${kh_ma}`),
  getShopProfile: (gh_ma) => axiosClient.get(`/san-pham/gian-hang/${gh_ma}`),
  
  getProductsByShop: (gh_ma, dmsp_ma = "") => {
    const url = `/san-pham/shop/${gh_ma}${dmsp_ma ? `?dmsp_ma=${dmsp_ma}` : ''}`;
    return axiosClient.get(url);
  },
  
  getShopVouchers: (gh_ma) => axiosClient.get(`/san-pham/gian-hang/${gh_ma}/vouchers`),
};

export default publicSanPhamService;