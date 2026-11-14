// frontend/src/services/san/thongKeNganhHangService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/admin/thong-ke-nganh-hang";

const thongKeNganhHangService = {
  getDanhMuc: () => axiosClient.get(`${BASE}/danh-muc`),
  getTongQuan: (params) => axiosClient.get(`${BASE}/tong-quan`, { params }),
  getTheoNganh: (params) => axiosClient.get(`${BASE}/theo-nganh`, { params }),
  getTheoThuongHieu: (params) =>
    axiosClient.get(`${BASE}/theo-thuong-hieu`, { params }),
  getTheoShop: (params) => axiosClient.get(`${BASE}/theo-shop`, { params }),
  getTheoSanPham: (params) =>
    axiosClient.get(`${BASE}/theo-san-pham`, { params }),
  getShopThoiGian: (params) =>
    axiosClient.get(`${BASE}/shop-thoi-gian`, { params }),
};

export default thongKeNganhHangService;