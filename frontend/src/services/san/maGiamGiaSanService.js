// frontend/src/services/maGiamGiaService.js
import axiosClient from "../../config/axiosClient";

const maGiamGiaSanService = {
  // 1. Lấy danh sách toàn bộ mã giảm giá
  getAll: () => {
    const url = "/ma-giam-gia-san";
    return axiosClient.get(url);
  },

  // 2. Lấy chi tiết 1 mã giảm giá theo ID (MGG_San_Ma)
  getById: (id) => {
    const url = `/ma-giam-gia-san/${id}`;
    return axiosClient.get(url);
  },

  // 3. Tạo mới mã giảm giá
  create: (data) => {
    const url = "/ma-giam-gia-san";
    return axiosClient.post(url, data);
  },

  // 4. Cập nhật mã giảm giá
  update: (id, data) => {
    const url = `/ma-giam-gia-san/${id}`;
    return axiosClient.put(url, data);
  },

  // 5. Xóa mã giảm giá
  delete: (id) => {
    const url = `/ma-giam-gia-san/${id}`;
    return axiosClient.delete(url);
  },

  // ==========================================
  // CÁC HÀM HỖ TRỢ (Gọi API Danh mục / Sàn)
  // ==========================================
  
  // 6. Lấy danh sách Sàn Thương Mại (Dùng để đổ vào thẻ <select> STMDTL_Ma)
  getAllSanThuongMai: () => {
    // Lưu ý: Endpoint này phải khớp với Route bên Backend của bạn
    // (Thường sẽ nằm trong sanThuongMaiRoutes.js)
    const url = "/san-thuong-mai"; 
    return axiosClient.get(url);
  },
};

export default maGiamGiaSanService;