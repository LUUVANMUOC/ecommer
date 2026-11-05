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
  },
      // 🟢 API Ghi nhận lượt xem
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

    // 🟢 API Lấy lịch sử xem
    getViewHistory: async (req, res) => {
        try {
            const data = await PublicSanPhamModel.getViewHistory(req.params.kh_ma);
            res.status(200).json(data);
        } catch (error) {
            console.error("Lỗi lấy lịch sử xem:", error);
            res.status(500).json({ message: error.message });
        }
    },
        // 🟢 Lấy sản phẩm của Shop
    getByShop: async (req, res) => {
        try {
            const { gh_ma } = req.params;
            const { dmsp_ma } = req.query; // Lấy danh mục từ query param (VD: ?dmsp_ma=DM01)
            
            const data = await PublicSanPhamModel.getByShop(gh_ma, dmsp_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
};

module.exports = PublicSanPhamController;