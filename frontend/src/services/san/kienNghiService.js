import axiosClient from "../../config/axiosClient";

const kienNghiService = {
  getByShop: (gh_ma) => axiosClient.get(`/kien-nghi/shop/${gh_ma}`),
  create: (data) => axiosClient.post("/kien-nghi/shop", data),
  getAllForSan: () => axiosClient.get("/kien-nghi/admin"),
  reply: (id, phanhoi) => axiosClient.put(`/kien-nghi/admin/${id}/reply`, { phanhoi }),
};

export default kienNghiService;