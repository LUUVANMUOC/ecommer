import axiosClient from "../../config/axiosClient";

const addressService = {
  // Lấy tất cả Tỉnh
  getAllTinh: () => axiosClient.get("/tinh"),
  // Lấy tất cả Xã (Sau đó sẽ filter theo Tỉnh ở Frontend)
  getAllXa: () => axiosClient.get("/xa"), 
};

export default addressService;