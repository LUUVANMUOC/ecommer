import axiosClient from "../../config/axiosClient";

const phiVanChuyenService = {
  // Lấy danh sách phí vận chuyển cho Admin
  getAdmin: () => axiosClient.get("/phi-van-chuyen/admin"),
};

export default phiVanChuyenService;