// src/services/san/publicSanPhamService.js
import axiosClient from "../../config/axiosClient";

const publicSanPhamService = {
  // Lấy danh sách tất cả sản phẩm đã được duyệt (dành cho trang chủ/khách xem)
  getAll: () => {
    return axiosClient.get("/san-pham");
  },

  // Lấy chi tiết một sản phẩm theo mã (dành cho trang xem chi tiết)
  getDetail: (sp_ma) => {
    return axiosClient.get(`/san-pham/${sp_ma}`);
  },
  increaseView: (ctsp_ma) => axiosClient.put(`/nguoi-ban/chi-tiet-san-pham/${ctsp_ma}/view`),
  toggleLike: (ctsp_ma, isLiked) => 
    axiosClient.put(`/san-pham/${ctsp_ma}/like`, { isLiked }),

};

export default publicSanPhamService;