import axiosClient from "../../config/axiosClient";

const sanPhamService = {
  getByGianHang: (gh_ma) => axiosClient.get(`/nguoi-ban/san-pham/${gh_ma}`),

  // Phân trang + tìm kiếm + lọc ở server
  // params: { q, th_ma, dmsp_ma, status, page, limit }
  getPhanTrang: (gh_ma, params) =>
    axiosClient.get(`/nguoi-ban/san-pham/phan-trang/${gh_ma}`, { params }),

  create: (data) => axiosClient.post("/nguoi-ban/san-pham", data),
  update: (id, data) => axiosClient.put(`/nguoi-ban/san-pham/${id}`, data),
  delete: (id) => axiosClient.delete(`/nguoi-ban/san-pham/${id}`),
};

export default sanPhamService;