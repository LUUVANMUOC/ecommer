import axiosClient from "../../config/axiosClient";

const sanPhamService = {
  getByGianHang: (gh_ma) => axiosClient.get(`/nguoi-ban/san-pham/${gh_ma}`),

  // Phân trang + tìm kiếm + lọc ở server
  // params: { q, th_ma, dmsp_ma, status,
  //           mua_tu, mua_den, xem_tu, xem_den,
  //           gia_tu, gia_den, sao_tu, sao_den,
  //           sort, page, limit }
  getPhanTrang: (gh_ma, params) =>
    axiosClient.get(`/nguoi-ban/san-pham/phan-trang/${gh_ma}`, { params }),

  // Khoảng thực tế (min–max) của shop để làm mốc thanh trượt
  getKhoangLoc: (gh_ma) =>
    axiosClient.get(`/nguoi-ban/san-pham/khoang-loc/${gh_ma}`),

  create: (data) => axiosClient.post("/nguoi-ban/san-pham", data),
  update: (id, data) => axiosClient.put(`/nguoi-ban/san-pham/${id}`, data),
  delete: (id) => axiosClient.delete(`/nguoi-ban/san-pham/${id}`),
};

export default sanPhamService;