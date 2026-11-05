import axiosClient from "../../config/axiosClient";

const thuongHieuService = {
  getAll: () => axiosClient.get("/thuong-hieu"),
  
  // 🟢 THÊM HÀM NÀY
  getByShop: (gh_ma) => axiosClient.get(`/thuong-hieu/shop/${gh_ma}`),
  
  create: (data) => axiosClient.post("/thuong-hieu", data, {
      headers: { "Content-Type": "multipart/form-data" }
  }),
  update: (id, data) => axiosClient.put(`/thuong-hieu/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" }
  }),
  delete: (id) => axiosClient.delete(`/thuong-hieu/${id}`),
};

export default thuongHieuService;