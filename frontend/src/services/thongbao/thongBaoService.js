// frontend/src/services/thongbao/thongBaoService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/thong-bao";

const ma = (value) => encodeURIComponent(String(value ?? "").trim());

const thongBaoService = {
  // ===== Hộp thư =====
  getHopThu: (nn_loai, nn_ma, params) =>
    axiosClient.get(`${BASE}/${ma(nn_loai)}/${ma(nn_ma)}`, { params }),

  getChiTiet: (nn_loai, nn_ma, tb_ma) =>
    axiosClient.get(`${BASE}/${ma(nn_loai)}/${ma(nn_ma)}/${ma(tb_ma)}`),

  demChuaDoc: (nn_loai, nn_ma) =>
    axiosClient.get(`${BASE}/${ma(nn_loai)}/${ma(nn_ma)}/chua-doc`),

  danhDauDaDoc: (nn_loai, nn_ma, tb_ma) =>
    axiosClient.patch(`${BASE}/${ma(nn_loai)}/${ma(nn_ma)}/${ma(tb_ma)}/da-doc`),

  danhDauTatCa: (nn_loai, nn_ma) =>
    axiosClient.post(`${BASE}/${ma(nn_loai)}/${ma(nn_ma)}/da-doc-tat-ca`),

  // ===== Danh sách chọn người nhận =====
  getKhachHangTheoDoi: (gh_ma, q = "") =>
    axiosClient.get(`/nguoi-ban/thong-bao/khach-hang-theo-doi/${ma(gh_ma)}`, {
      params: { q },
    }),

  getShopDeGui: (q = "") =>
    axiosClient.get("/admin/thong-bao/shop", { params: { q } }),

  // ===== Gửi hàng loạt =====
  guiTuShop: (data) =>
    axiosClient.post("/nguoi-ban/thong-bao/gui", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  guiTuSan: (data) =>
    axiosClient.post("/admin/thong-bao/gui", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default thongBaoService;