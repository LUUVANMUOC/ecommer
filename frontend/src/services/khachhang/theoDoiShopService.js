// src/services/khachhang/theoDoiShopService.js (File của Frontend)
import axiosClient from "../../config/axiosClient";

const theoDoiShopService = {
  toggleFollow: (kh_ma, gh_ma) => 
    axiosClient.post("/khach-hang/theo-doi-shop/toggle", { kh_ma, gh_ma }),
    
  checkStatus: (kh_ma, gh_ma) => 
    axiosClient.get(`/khach-hang/theo-doi-shop/check?kh_ma=${kh_ma}&gh_ma=${gh_ma}`),
    
  getFollowedShops: (kh_ma) => 
    axiosClient.get(`/khach-hang/theo-doi-shop/${kh_ma}`),
};

export default theoDoiShopService;