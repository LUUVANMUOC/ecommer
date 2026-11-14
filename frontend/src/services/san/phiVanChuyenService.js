// frontend/src/services/san/phiVanChuyenService.js
import axiosClient from "../../config/axiosClient";

const phiVanChuyenService = {
  // Giữ nguyên API cũ
  getAdmin: () => axiosClient.get("/phi-van-chuyen/admin"),

  // Thống kê
  getDanhMuc: () => axiosClient.get("/phi-van-chuyen/admin/danh-muc"),
  getTongQuan: (params) =>
    axiosClient.get("/phi-van-chuyen/admin/tong-quan", { params }),
  getDanhSach: (params) =>
    axiosClient.get("/phi-van-chuyen/admin/danh-sach", { params }),
};

export default phiVanChuyenService;