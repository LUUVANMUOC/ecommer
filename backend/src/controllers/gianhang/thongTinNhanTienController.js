const ThongTinNhanTienModel = require('../../models/gianhang/thongTinNhanTienModel');

const ThongTinNhanTienController = {
    // 1. Lấy thông tin
    getByGianHang: async (req, res) => {
        try {
            const data = await ThongTinNhanTienModel.getByGianHang(req.params.gh_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. Lưu thông tin (Thêm mới/Cập nhật)
    save: async (req, res) => {
        try {
            const { gh_ma, nh_ma, ttnt_gianhang_tentaikhoan, ttnt_gianhang_sotaikhoan } = req.body;
            
            // Validate bắt buộc phải có đủ 4 trường
            if (!gh_ma || !nh_ma || !ttnt_gianhang_tentaikhoan || !ttnt_gianhang_sotaikhoan) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin tài khoản.' });
            }

            const result = await ThongTinNhanTienModel.createOrUpdate({
                gh_ma,
                nh_ma,
                ttnt_gianhang_tentaikhoan, 
                ttnt_gianhang_sotaikhoan
            });
            
            res.status(200).json({ message: 'Lưu thông tin nhận tiền thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // 3. Xóa tài khoản
    delete: async (req, res) => {
        try {
            const { gh_ma } = req.params; 
            await ThongTinNhanTienModel.delete(gh_ma);
            res.status(200).json({ message: 'Đã xóa tài khoản nhận tiền.' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = ThongTinNhanTienController;