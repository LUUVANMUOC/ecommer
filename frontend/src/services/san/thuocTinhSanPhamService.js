import axiosClient from "../../config/axiosClient";

const thuocTinhSanPhamService = {
  getAll: () => axiosClient.get("/thuoc-tinh-san-pham"),
  create: (data) =>
    axiosClient.post("/thuoc-tinh-san-pham", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    axiosClient.put(`/thuoc-tinh-san-pham/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => axiosClient.delete(`/thuoc-tinh-san-pham/${id}`),
};

export default thuocTinhSanPhamService;