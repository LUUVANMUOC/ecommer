import axiosClient from "../../config/axiosClient";

const phiChiecKhauService = {
  // --- PHẦN PHÍ CHIẾT KHẤU ---
  getTableData: (stmdt_ma) => axiosClient.get(`/phi-chiec-khau?stmdt_ma=${stmdt_ma}`),
  updateFee: (data) => axiosClient.post("/phi-chiec-khau", data),

  // --- PHẦN CRUD NGÀNH HÀNG (Đã trỏ sang API mới) ---
  createCategory: (data) => axiosClient.post("/nganh-hang", data),
  updateCategory: (id, data) => axiosClient.put(`/nganh-hang/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/nganh-hang/${id}`),
};

export default phiChiecKhauService;