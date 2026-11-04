import axiosClient from "../../config/axiosClient";

const dvvcProfileService = {
  getProfile: (dvvc_ma) => axiosClient.get(`/dvvc/thong-tin/profile/${dvvc_ma}`),
  updateProfile: (dvvc_ma, formData) => axiosClient.put(`/dvvc/thong-tin/profile/${dvvc_ma}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  changePassword: (data) => axiosClient.put(`/dvvc/thong-tin/change-password`, data),
  saveBank: (dvvc_ma, data) => axiosClient.post(`/dvvc/thong-tin/bank/${dvvc_ma}`, data),
  deleteBank: (dvvc_ma) => axiosClient.delete(`/dvvc/thong-tin/bank/${dvvc_ma}`),
};

export default dvvcProfileService;