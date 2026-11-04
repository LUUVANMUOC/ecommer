import axiosClient from "../../config/axiosClient";

const maGiamGiaVanChuyenService = {
  getActiveVouchers: () => axiosClient.get("/khach-hang/ma-giam-gia-van-chuyen"),
};

export default maGiamGiaVanChuyenService;