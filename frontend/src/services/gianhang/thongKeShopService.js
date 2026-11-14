// frontend/src/services/gianhang/thongKeShopService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/nguoi-ban/thong-ke-doanh-thu";

const thongKeShopService = {
  getDanhMuc: (gh_ma) => axiosClient.get(`${BASE}/danh-muc/${gh_ma}`),
  getTongQuan: (gh_ma, params) =>
    axiosClient.get(`${BASE}/tong-quan/${gh_ma}`, { params }),
  getTheoDanhMuc: (gh_ma, params) =>
    axiosClient.get(`${BASE}/theo-danh-muc/${gh_ma}`, { params }),
  getTheoThuongHieu: (gh_ma, params) =>
    axiosClient.get(`${BASE}/theo-thuong-hieu/${gh_ma}`, { params }),
  getTheoSanPham: (gh_ma, params) =>
    axiosClient.get(`${BASE}/theo-san-pham/${gh_ma}`, { params }),
};

export default thongKeShopService;