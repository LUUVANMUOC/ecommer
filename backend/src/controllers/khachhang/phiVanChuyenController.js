const PhiVanChuyenService = require('../../services/khachhang/phiVanChuyenService');

const PhiVanChuyenController = {
    calculateFee: async (req, res) => {
        try {
            const { gh_ma, xa_ma_nhan, items } = req.body;
            
            if (!gh_ma || !xa_ma_nhan || !items || items.length === 0) {
                return res.status(400).json({ message: "Thiếu thông tin tính phí" });
            }

            const result = await PhiVanChuyenService.calculateShippingFee(gh_ma, xa_ma_nhan, items);
            
            // ✅ SỬA TẠI ĐÂY: Trả về nguyên object (đã có sẵn shippingFee, dvvc_ma, klkh_ma...)
            res.status(200).json(result); 
        } catch (error) {
            console.error("Lỗi tính phí ship Backend:", error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = PhiVanChuyenController;