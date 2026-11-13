import axiosClient from "../../config/axiosClient";

const phiChiecKhauService = {
  // --- PHẦN PHÍ CHIẾT KHẤU ---
  getTableData: (stmdt_ma) => axiosClient.get(`/phi-chiec-khau?stmdt_ma=${stmdt_ma}`),
  updateFee: (data) => axiosClient.post("/phi-chiec-khau", data),

  // --- PHẦN CRUD NGÀNH HÀNG (multipart để gửi kèm icon) ---
  createCategory: (data) =>
    axiosClient.post("/nganh-hang", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateCategory: (id, data) =>
    axiosClient.put(`/nganh-hang/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteCategory: (id) => axiosClient.delete(`/nganh-hang/${id}`),
};

export default phiChiecKhauService;