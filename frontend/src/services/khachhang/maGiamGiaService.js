import axiosClient from "../../config/axiosClient";

const maGiamGiaService = {
  getActiveVouchers: () => axiosClient.get("/khach-hang/ma-giam-gia"),
};

export default maGiamGiaService;