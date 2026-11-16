// frontend/src/services/san/thanhToanVanChuyenService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/admin/thanh-toan-van-chuyen";

const thanhToanVanChuyenService = {
  // Thống kê
  getDanhMuc: () => axiosClient.get(`${BASE}/danh-muc`),
  getTongQuan: (params) => axiosClient.get(`${BASE}/tong-quan`, { params }),
  getDanhSachPhieu: (params) =>
    axiosClient.get(`${BASE}/danh-sach-phieu`, { params }),
  getPhieuChiTiet: (pcd_ma) => axiosClient.get(`${BASE}/phieu/${pcd_ma}`),

  // Nghiệp vụ
  getDanhSachNo: () => axiosClient.get(`${BASE}/danh-sach-no`),
  getChiTietNo: (dvvc_ma) =>
    axiosClient.get(`${BASE}/chi-tiet-no/${dvvc_ma}`),
  taoPhieuChi: (dvvc_ma, dts_ma_list) =>
    axiosClient.post(`${BASE}/tao-phieu/${dvvc_ma}`, { dts_ma_list }),
  huyPhieuChi: (pcd_ma) =>
    axiosClient.delete(`${BASE}/huy-phieu/${pcd_ma}`),
  checkTrangThai: (pcd_ma) =>
    axiosClient.get(`${BASE}/trang-thai/${pcd_ma}`),
};

export default thanhToanVanChuyenService;