const PublicGianHangModel = require('../../models/san/publicGianHangModel');

const PublicGianHangController = {
    getShopProfile: async (req, res) => {
        try {
            const { gh_ma } = req.params;
            
            // Lấy song song thông tin Shop và Danh mục
            const [info, categories] = await Promise.all([
                PublicGianHangModel.getShopInfo(gh_ma),
                PublicGianHangModel.getShopCategories(gh_ma)
            ]);

            if (!info) {
                return res.status(404).json({ message: "Không tìm thấy Shop." });
            }

            res.status(200).json({ info, categories });
        } catch (error) {
            console.error("Lỗi lấy thông tin shop:", error);
            res.status(500).json({ message: error.message });
        }
    },
        // 🟢 API Public lấy Voucher
    getShopVouchers: async (req, res) => {
        try {
            const data = await PublicGianHangModel.getShopVouchers(req.params.gh_ma);
            res.status(200).json(data);
        } catch (error) {
            console.error("Lỗi lấy voucher shop:", error);
            res.status(500).json({ message: error.message });
        }
    },
};

module.exports = PublicGianHangController;