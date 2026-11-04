import axiosClient from "../../config/axiosClient";

const chiTietSanPhamService = {
  // Lấy danh sách chi tiết của 1 sản phẩm
  getBySanPham: (sp_ma) => axiosClient.get(`/nguoi-ban/chi-tiet-san-pham/${sp_ma}`),
  
  // Thêm chi tiết mới (Gửi FormData để hỗ trợ upload ảnh nếu có)
  create: (data) => axiosClient.post("/nguoi-ban/chi-tiet-san-pham", data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  
  // Cập nhật chi tiết (nếu cần sau này)
  update: (id, data) => axiosClient.put(`/nguoi-ban/chi-tiet-san-pham/${id}`, data),
  
  // Xóa chi tiết
  delete: (id) => axiosClient.delete(`/nguoi-ban/chi-tiet-san-pham/${id}`),
};

export default chiTietSanPhamService;