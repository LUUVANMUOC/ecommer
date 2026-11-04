import axiosClient from "../../config/axiosClient";

const sanPhamService = {
  getByGianHang: (gh_ma) => axiosClient.get(`/nguoi-ban/san-pham/${gh_ma}`),
  create: (data) => axiosClient.post("/nguoi-ban/san-pham", data),
  update: (id, data) => axiosClient.put(`/nguoi-ban/san-pham/${id}`, data),
  delete: (id) => axiosClient.delete(`/nguoi-ban/san-pham/${id}`),
};

export default sanPhamService;