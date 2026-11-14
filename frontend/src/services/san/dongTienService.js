// frontend/src/services/san/dongTienService.js
import axiosClient from "../../config/axiosClient";

const dongTienService = {
  // ===== DÒNG TIỀN KHO (dùng ở tab "Dòng tiền kho" của trang Vận chuyển) =====
  getDanhMuc: () => axiosClient.get("/dong-tien/admin/danh-muc"),

  getTongQuan: (params) =>
    axiosClient.get("/dong-tien/admin/tong-quan", { params }),

  getGiaoDich: (params) =>
    axiosClient.get("/dong-tien/admin/giao-dich", { params }),

  getPhieuChiTiet: (ptt_ma) =>
    axiosClient.get(`/dong-tien/admin/phieu/${ptt_ma}`),

  // ===== DOANH THU SÀN (dùng ở trang Doanh thu sàn) =====
  getDanhMucDoanhThuSan: () =>
    axiosClient.get("/dong-tien/admin/doanh-thu-san/danh-muc"),

  getTongQuanDoanhThuSan: (params) =>
    axiosClient.get("/dong-tien/admin/doanh-thu-san/tong-quan", { params }),

  getGiaoDichDoanhThuSan: (params) =>
    axiosClient.get("/dong-tien/admin/doanh-thu-san/giao-dich", { params }),

  getPhieuChiTietDoanhThuSan: (ptt_ma) =>
    axiosClient.get(`/dong-tien/admin/doanh-thu-san/phieu/${ptt_ma}`),
};

export default dongTienService;