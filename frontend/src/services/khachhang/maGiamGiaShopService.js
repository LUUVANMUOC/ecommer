import axiosClient from "../../config/axiosClient";

const maGiamGiaShopService = {
  getActiveVouchersByShop: (gh_ma) => axiosClient.get(`/khach-hang/ma-giam-gia-shop/${gh_ma}`),
};

export default maGiamGiaShopService;