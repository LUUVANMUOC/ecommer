import axiosClient from "../../config/axiosClient";

const dvvcKhoService = {
  getAll: (dvvc_ma, tinh_ma, xa_ma) => {
    let url = `/dvvc/kho/${dvvc_ma}`;
    const params = new URLSearchParams();
    if (tinh_ma) params.append("tinh_ma", tinh_ma);
    if (xa_ma) params.append("xa_ma", xa_ma);
    if (params.toString()) url += `?${params.toString()}`;
    return axiosClient.get(url);
  },
  create: (formData) => axiosClient.post("/dvvc/kho", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  update: (kho_ma, formData) => axiosClient.put(`/dvvc/kho/${kho_ma}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  delete: (kho_ma) => axiosClient.delete(`/dvvc/kho/${kho_ma}`),
};

export default dvvcKhoService;