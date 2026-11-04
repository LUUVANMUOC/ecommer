import axiosClient from "../../config/axiosClient";

const vanChuyenShopService = {
  getSettings: (gh_ma) => axiosClient.get(`/nguoi-ban/van-chuyen/${gh_ma}`),
  updateSettings: (gh_ma, dvvc_list) => 
    axiosClient.post(`/nguoi-ban/van-chuyen/${gh_ma}`, { dvvc_list }),
};

export default vanChuyenShopService;