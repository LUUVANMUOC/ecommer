import axiosClient from "../../config/axiosClient";

const adminGianHangService = {
  getAll: () => axiosClient.get("/admin/gian-hang"),
  update: (id, data) => axiosClient.put(`/admin/gian-hang/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  delete: (id) => axiosClient.delete(`/admin/gian-hang/${id}`),
};

export default adminGianHangService;