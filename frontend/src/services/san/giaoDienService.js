// src/services/san/giaoDienService.js
import axiosClient from "../../config/axiosClient";

const giaoDienService = {
  getPublic: (bust = false) =>
    axiosClient.get(
      "/giao-dien",
      bust ? { params: { _t: Date.now() } } : undefined,
    ),

  getAdmin: () => axiosClient.get("/admin/giao-dien"),
  updateCaiDat: (data) => axiosClient.put("/admin/giao-dien", data),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return axiosClient.post("/admin/giao-dien/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Upload tệp PDF cho mục liên kết
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/admin/giao-dien/upload-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Khu vực
  createKhuVuc: (data) => axiosClient.post("/admin/giao-dien/khu-vuc", data),
  updateKhuVuc: (id, data) =>
    axiosClient.put(`/admin/giao-dien/khu-vuc/${id}`, data),
  deleteKhuVuc: (id) => axiosClient.delete(`/admin/giao-dien/khu-vuc/${id}`),

  // Thành phần
  createThanhPhan: (data) =>
    axiosClient.post("/admin/giao-dien/thanh-phan", data),
  updateThanhPhan: (id, data) =>
    axiosClient.put(`/admin/giao-dien/thanh-phan/${id}`, data),
  deleteThanhPhan: (id) =>
    axiosClient.delete(`/admin/giao-dien/thanh-phan/${id}`),

  // Sắp xếp sau kéo thả
  reorder: (loai, ids) =>
    axiosClient.put("/admin/giao-dien/sap-xep", { loai, ids }),
};

export default giaoDienService;