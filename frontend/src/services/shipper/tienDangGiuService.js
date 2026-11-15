// frontend/src/services/shipper/tienDangGiuService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/dvvc/tien-dang-giu";

const ma = (value) => encodeURIComponent(String(value ?? "").trim());

const tienDangGiuService = {
  getThongTin: (shipper_ma) => axiosClient.get(`${BASE}/thong-tin/${ma(shipper_ma)}`),

  getDangGiu: (shipper_ma, params) =>
    axiosClient.get(`${BASE}/dang-giu/${ma(shipper_ma)}`, { params }),

  getThongKe: (shipper_ma, params) =>
    axiosClient.get(`${BASE}/thong-ke/${ma(shipper_ma)}`, { params }),

  getLichSuNop: (shipper_ma, params) =>
    axiosClient.get(`${BASE}/lich-su-nop/${ma(shipper_ma)}`, { params }),
};

export default tienDangGiuService;