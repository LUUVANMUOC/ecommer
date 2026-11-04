const GianHangService = require('../../services/gianhang/gianHangService');

const GianHangController = {
    getAll: async (req, res) => {
        try {
            const data = await GianHangService.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    // Thêm vào object GianHangAuthController
    changePassword: async (req, res) => {
        try {
            const { gh_ma, oldPassword, newPassword } = req.body;
            
            if (!gh_ma || !oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
            }

            await GianHangAuthService.changePassword(gh_ma, oldPassword, newPassword);
            res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.gh_hinhanh = `/uploads/shops/${req.file.filename}`;
            }
            const result = await GianHangService.update(req.params.id, data);
            res.status(200).json({ message: 'Cập nhật thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await GianHangService.delete(req.params.id);
            res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = GianHangController;