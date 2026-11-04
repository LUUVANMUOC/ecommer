const VanChuyenShopModel = require('../../models/gianhang/vanChuyenShopModel');

const VanChuyenShopController = {
    // Lấy cài đặt vận chuyển của shop (Gồm tất cả ĐVVC + Trạng thái đã chọn)
    getSettings: async (req, res) => {
        try {
            const gh_ma = req.params.gh_ma;
            const [allDVVC, selectedIds] = await Promise.all([
                VanChuyenShopModel.getAllDVVC(),
                VanChuyenShopModel.getSelectedDVVC(gh_ma)
            ]);
            res.status(200).json({ allDVVC, selectedIds });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Cập nhật cài đặt
    updateSettings: async (req, res) => {
        try {
            const gh_ma = req.params.gh_ma;
            const { dvvc_list } = req.body; // Mảng các mã ĐVVC
            
            if (!Array.isArray(dvvc_list)) {
                return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
            }

            const result = await VanChuyenShopModel.updateSelectedDVVC(gh_ma, dvvc_list);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = VanChuyenShopController;