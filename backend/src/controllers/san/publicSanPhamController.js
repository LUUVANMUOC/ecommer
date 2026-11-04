const PublicSanPhamModel = require('../../models/san/publicSanPhamModel');

const PublicSanPhamController = {
  // ... (giữ nguyên 2 hàm getAll và getDetail cũ)
  getAll: async (req, res) => {
    try {
      const data = await PublicSanPhamModel.getAllActive();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getDetail: async (req, res) => {
    try {
      const data = await PublicSanPhamModel.getProductDetail(req.params.sp_ma);
      if (!data) return res.status(404).json({ message: "Sản phẩm không tồn tại." });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ✅ THÊM HÀM NÀY
  toggleLike: async (req, res) => {
    try {
      const { isLiked } = req.body; // Frontend gửi lên true/false
      const ctsp_ma = req.params.id; // Mã chi tiết sản phẩm
      
      const result = await PublicSanPhamModel.toggleLike(ctsp_ma, isLiked);
      res.status(200).json(result);
    } catch (error) {
      console.error("Lỗi Like sản phẩm:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = PublicSanPhamController;