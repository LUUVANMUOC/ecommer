import axiosClient from "../../config/axiosClient";

const shipperService = {
  getAll: (dvvc_ma) => axiosClient.get(`/dvvc/shipper/${dvvc_ma}`),
  create: (formData) => axiosClient.post("/dvvc/shipper", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  update: (shipper_ma, formData) => axiosClient.put(`/dvvc/shipper/${shipper_ma}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  delete: (shipper_ma) => axiosClient.delete(`/dvvc/shipper/${shipper_ma}`),
};

export default shipperService;