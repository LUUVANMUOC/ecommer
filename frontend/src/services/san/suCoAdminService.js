// frontend/src/services/san/suCoAdminService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/admin/su-co";
const ma = (v) => encodeURIComponent(String(v ?? "").trim());

const suCoAdminService = {
  getKpi: () => axiosClient.get(`${BASE}/kpi`),
  getDanhSach: (params) => axiosClient.get(BASE, { params }),
  getChiTiet: (ycxlsc_ma) => axiosClient.get(`${BASE}/${ma(ycxlsc_ma)}`),

  tiepNhan: (ycxlsc_ma, data) =>
    axiosClient.post(`${BASE}/${ma(ycxlsc_ma)}/tiep-nhan`, data),
  yeuCauBoSung: (ycxlsc_ma, data) =>
    axiosClient.post(`${BASE}/${ma(ycxlsc_ma)}/yeu-cau-bo-sung`, data),
  ketLuan: (ycxlsc_ma, data) =>
    axiosClient.post(`${BASE}/${ma(ycxlsc_ma)}/ket-luan`, data),
  tuChoi: (ycxlsc_ma, data) =>
    axiosClient.post(`${BASE}/${ma(ycxlsc_ma)}/tu-choi`, data),
  hoanTat: (ycxlsc_ma, data) =>
    axiosClient.post(`${BASE}/${ma(ycxlsc_ma)}/hoan-tat`, data),

  xacNhanChi: (ycxlsc_ma, ht_ma, data) =>
    axiosClient.post(
      `${BASE}/${ma(ycxlsc_ma)}/hoan-tien/${ma(ht_ma)}/xac-nhan`,
      data
    ),
  huyHoanTien: (ycxlsc_ma, ht_ma, data) =>
    axiosClient.post(
      `${BASE}/${ma(ycxlsc_ma)}/hoan-tien/${ma(ht_ma)}/huy`,
      data
    ),
};

export default suCoAdminService;