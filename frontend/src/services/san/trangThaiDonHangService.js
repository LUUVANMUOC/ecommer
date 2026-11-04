// src/services/san/trangThaiDonHangService.js
import axiosClient from "../../config/axiosClient";

const trangThaiDonHangService = {
  getAll: () => axiosClient.get("/trang-thai-don-hang"),
};

// ✅ Dòng này là bắt buộc để các file khác import được
export default trangThaiDonHangService;