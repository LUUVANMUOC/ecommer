import axiosClient from "../../config/axiosClient";

const danhMucSanPhamService = {
  // Lấy danh mục theo mã gian hàng
  getByGianHang: (gh_ma) => axiosClient.get(`/nguoi-ban/danh-muc-san-pham/${gh_ma}`),
  
  create: (data) => axiosClient.post("/nguoi-ban/danh-muc-san-pham", data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  
  update: (id, data) => axiosClient.put(`/nguoi-ban/danh-muc-san-pham/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  
  delete: (id) => axiosClient.delete(`/nguoi-ban/danh-muc-san-pham/${id}`),
};

export default danhMucSanPhamService;