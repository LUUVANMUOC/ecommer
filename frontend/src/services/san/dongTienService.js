// frontend/src/services/san/dongTienService.js
import axiosClient from "../../config/axiosClient";

const dongTienService = {
  getDanhMuc: () => axiosClient.get("/dong-tien/admin/danh-muc"),

  getTongQuan: (params) =>
    axiosClient.get("/dong-tien/admin/tong-quan", { params }),

  getGiaoDich: (params) =>
    axiosClient.get("/dong-tien/admin/giao-dich", { params }),

  getPhieuChiTiet: (ptt_ma) =>
    axiosClient.get(`/dong-tien/admin/phieu/${ptt_ma}`),
};

export default dongTienService;