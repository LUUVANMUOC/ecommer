// backend/src/services/san/publicSanPhamService.js
const PublicSanPhamModel = require('../../models/san/publicSanPhamModel');
const AIService = require('./aiService');

const PublicSanPhamService = {
  // Lấy danh sách sản phẩm (phân trang, lọc, tìm kiếm)
  getAllActive: async (params) => {
    return await PublicSanPhamModel.getAllActive(params);
  },

  // Lấy chi tiết sản phẩm
  getProductDetail: async (sp_ma) => {
    return await PublicSanPhamModel.getProductDetail(sp_ma);
  },

  // Gợi ý sản phẩm bằng AI
  getAISuggestions: async (searchQuery) => {
    // 1. Lấy 50 sản phẩm mới nhất từ DB (hoặc lấy theo từ khóa)
    const dbResult = await PublicSanPhamModel.getAllActive({ search: searchQuery, limit: 50 });
    
    // 2. Đưa cho AI chọn lọc
    const aiSortedProducts = await AIService.goiYSanPham(searchQuery, dbResult.data);
    
    return aiSortedProducts;
  },

  // Like / Bỏ like
  toggleLike: async (ctsp_ma, isLiked) => {
    return await PublicSanPhamModel.toggleLike(ctsp_ma, isLiked);
  },

  // Ghi nhận lượt xem
  recordView: async (ctsp_ma, kh_ma) => {
    return await PublicSanPhamModel.recordView(ctsp_ma, kh_ma);
  },

  // Lấy lịch sử xem
  getViewHistory: async (kh_ma) => {
    return await PublicSanPhamModel.getViewHistory(kh_ma);
  },

  // Lấy sản phẩm theo Shop
  getByShop: async (gh_ma, dmsp_ma) => {
    return await PublicSanPhamModel.getByShop(gh_ma, dmsp_ma);
  }
};

module.exports = PublicSanPhamService;