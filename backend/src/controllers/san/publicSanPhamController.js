// backend/src/controllers/san/publicSanPhamController.js
const PublicSanPhamModel = require('../../models/san/publicSanPhamModel');
// 🟢 Đã xóa dòng require AIService

const PublicSanPhamController = {
  // Hàm này giờ đảm nhận cả việc Lấy danh sách và Tìm kiếm (Deep Search)
  getAll: async (req, res) => {
    try {
      const { page, limit, search, brand, sort } = req.query;
      const data = await PublicSanPhamModel.getAllActive({ 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 50, 
        search: search || "", 
        brand: brand || "", 
        sort: sort || "newest" 
      });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 🟢 ĐÃ XÓA HÀM getAISuggestions
  // 🟢 ĐÃ XÓA HÀM searchWithAI

  getDetail: async (req, res) => {
    try {
      const data = await PublicSanPhamModel.getProductDetail(req.params.sp_ma);
      if (!data) return res.status(404).json({ message: "Sản phẩm không tồn tại." });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  toggleLike: async (req, res) => {
    try {
      const { isLiked } = req.body;
      const ctsp_ma = req.params.id;
      const result = await PublicSanPhamModel.toggleLike(ctsp_ma, isLiked);
      res.status(200).json(result);
    } catch (error) {
      console.error("Lỗi Like sản phẩm:", error);
      res.status(500).json({ message: error.message });
    }
  },

  recordView: async (req, res) => {
    try {
      const { ctsp_ma, kh_ma } = req.body;
      if (!ctsp_ma) {
        return res.status(400).json({ message: "Thiếu mã chi tiết sản phẩm." });
      }
      await PublicSanPhamModel.recordView(ctsp_ma, kh_ma);
      res.status(200).json({ message: "Đã ghi nhận lượt xem." });
    } catch (error) {
      console.error("Lỗi ghi nhận view:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getViewHistory: async (req, res) => {
    try {
      const data = await PublicSanPhamModel.getViewHistory(req.params.kh_ma);
      res.status(200).json(data);
    } catch (error) {
      console.error("Lỗi lấy lịch sử xem:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getByShop: async (req, res) => {
    try {
      const { gh_ma } = req.params;
      const { dmsp_ma } = req.query; 
      const data = await PublicSanPhamModel.getByShop(gh_ma, dmsp_ma);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = PublicSanPhamController;