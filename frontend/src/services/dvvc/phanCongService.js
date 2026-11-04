import axiosClient from "../../config/axiosClient";

const phanCongService = {
  getPendingOrders: (dvvc_ma) => axiosClient.get(`/dvvc/phan-cong/don-cho-lay/${dvvc_ma}`),
  getShippersByKho: (kho_ma) => axiosClient.get(`/dvvc/phan-cong/shipper-theo-kho/${kho_ma}`),
  assignShipper: (data) => axiosClient.post("/dvvc/phan-cong/phan-cong", data),
};

export default phanCongService;