// frontend/src/services/dvvc/dongTienThongKeService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/dvvc/thong-ke-dong-tien";

const ma = (value) => encodeURIComponent(String(value ?? "").trim());

const dongTienThongKeService = {
  getDanhMuc: (dvvc_ma) =>
    axiosClient.get(`${BASE}/danh-muc/${ma(dvvc_ma)}`),

  getTongQuan: (dvvc_ma, params) =>
    axiosClient.get(`${BASE}/tong-quan/${ma(dvvc_ma)}`, { params }),

  getDonDangGiu: (dvvc_ma, params) =>
    axiosClient.get(`${BASE}/don-dang-giu/${ma(dvvc_ma)}`, { params }),

  getDonChuaLap: (dvvc_ma, params) =>
    axiosClient.get(`${BASE}/don-chua-lap/${ma(dvvc_ma)}`, { params }),

  getDanhSachPhieu: (dvvc_ma, params) =>
    axiosClient.get(`${BASE}/phieu/${ma(dvvc_ma)}`, { params }),

  getPhieuChiTiet: (dvvc_ma, pcd_ma) =>
    axiosClient.get(`${BASE}/phieu/${ma(dvvc_ma)}/${ma(pcd_ma)}`),
};

export default dongTienThongKeService;