// frontend/src/services/suco/suCoService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/su-co";
const ma = (v) => encodeURIComponent(String(v ?? "").trim());

// Gốc backend để hiển thị ảnh/PDF minh chứng
export const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/api\/?$/, "");

export const urlTep = (duongdan) => {
  if (!duongdan) return "";
  if (/^https?:\/\//i.test(duongdan)) return duongdan;
  return `${API_ORIGIN}${duongdan}`;
};

const suCoService = {
  getLoaiSuCo: (ct_ma) => axiosClient.get(`${BASE}/loai`, { params: { ct_ma } }),
  getTrangThai: () => axiosClient.get(`${BASE}/trang-thai`),

  getDonHang: (dts_ma, ct_ma, maNguoi) =>
    axiosClient.get(`${BASE}/don-hang/${ma(dts_ma)}`, {
      params: { ct_ma, ma: maNguoi },
    }),

  getDanhSach: (params) => axiosClient.get(BASE, { params }),

  getChiTiet: (ycxlsc_ma, ct_ma, maNguoi) =>
    axiosClient.get(`${BASE}/${ma(ycxlsc_ma)}`, {
      params: { ct_ma, ma: maNguoi },
    }),

  taoPhieu: (data) =>
    axiosClient.post(BASE, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  themMinhChung: (ycxlsc_ma, data) =>
    axiosClient.post(`${BASE}/${ma(ycxlsc_ma)}/minh-chung`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getThanhToan: (ycxlsc_ma, ht_ma, ct_ma, maNguoi) =>
    axiosClient.get(
      `${BASE}/${ma(ycxlsc_ma)}/hoan-tien/${ma(ht_ma)}/thanh-toan`,
      { params: { ct_ma, ma: maNguoi } },
    ),

  baoDaChuyen: (ycxlsc_ma, ht_ma, data) =>
    axiosClient.post(
      `${BASE}/${ma(ycxlsc_ma)}/hoan-tien/${ma(ht_ma)}/bao-chuyen`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    ),

  huy: (ycxlsc_ma, data) =>
    axiosClient.post(`${BASE}/${ma(ycxlsc_ma)}/huy`, data),
};

export default suCoService;