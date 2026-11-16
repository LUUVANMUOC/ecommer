// src/services/san/publicSanPhamService.js
import axiosClient from "../../config/axiosClient";

/**
 * Chuẩn hoá tham số cho API sản phẩm theo shop.
 * - Kiểu mới: getProductsByShop(gh_ma, { dmsp_ma, page, limit, search, brand, sort })
 * - Kiểu cũ : getProductsByShop(gh_ma, "DMSP001")  -> vẫn chạy
 */
const normalizeShopParams = (input) => {
  const raw =
    typeof input === "string"
      ? { dmsp_ma: input }
      : input && typeof input === "object"
        ? input
        : {};

  // Bỏ các tham số rỗng để URL gọn và không gửi `?search=&brand=`
  const params = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params[key] = value;
  });

  return params;
};

const publicSanPhamService = {
  // 🟢 Hàm này giờ sẽ dùng cho cả lấy danh sách VÀ tìm kiếm
  // params: { page, limit, search, brand, sort }
  getAll: (params) => {
    return axiosClient.get("/san-pham", { params });
  },

  // 🟢 3 khối nổi bật: top thương hiệu / gian hàng / voucher
  getNoiBat: (limit = 10) =>
    axiosClient.get("/san-pham/noi-bat", { params: { limit } }),

  getDetail: (sp_ma) => {
    return axiosClient.get(`/san-pham/${sp_ma}`);
  },

  toggleLike: (ctsp_ma, isLiked) =>
    axiosClient.put(`/san-pham/${ctsp_ma}/like`, { isLiked }),

  // 🟢 Các API lịch sử và gian hàng
  recordView: (data) => axiosClient.post("/san-pham/record-view", data),
  getViewHistory: (kh_ma) => axiosClient.get(`/san-pham/lich-su-xem/${kh_ma}`),
  getShopProfile: (gh_ma) => axiosClient.get(`/san-pham/gian-hang/${gh_ma}`),

  /**
   * Danh sách sản phẩm của 1 shop — hỗ trợ tìm kiếm / lọc / sắp xếp / phân trang.
   * Trả về: { data: [...], total, page, limit }
   *
   * params: {
   *   dmsp_ma?: string,   // lọc theo danh mục của shop
   *   page?: number,      // mặc định 1
   *   limit?: number,     // mặc định 20 (backend chặn tối đa 100)
   *   search?: string,    // tìm trong sp_ten, sp_mota, dmsp_ten
   *   brand?: string,     // th_ma
   *   sort?: "newest" | "popular" | "price_asc" | "price_desc"
   * }
   */
  getProductsByShop: (gh_ma, params = {}) =>
    axiosClient.get(`/san-pham/shop/${gh_ma}`, {
      params: normalizeShopParams(params),
    }),

  getShopVouchers: (gh_ma) =>
    axiosClient.get(`/san-pham/gian-hang/${gh_ma}/vouchers`),

  /**
   * Đánh giá của 1 sản phẩm.
   * Trả về: { data, total, page, limit, total_pages, thong_ke }
   *
   * params: { page?, limit?, sao? (1-5), ctsp_ma? }
   */
  getDanhGia: (sp_ma, params = {}) =>
    axiosClient.get(`/san-pham/${sp_ma}/danh-gia`, {
      params: normalizeShopParams(params),
    }),
};

export default publicSanPhamService;