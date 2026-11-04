const DvvcProfileService = require('../../services/dvvc/dvvcProfileService');

const DvvcProfileController = {
    getProfile: async (req, res) => {
        try {
            const data = await DvvcProfileService.getProfile(req.params.id);
            if (!data) return res.status(404).json({ message: 'Không tìm thấy ĐVVC!' });
            res.json(data);
        } catch (error) { res.status(500).json({ message: error.message }); }
    },

    updateProfile: async (req, res) => {
        try {
            const result = await DvvcProfileService.updateProfile(req.params.id, req.body, req.file);
            res.json({ message: 'Cập nhật thành công!', data: result });
        } catch (error) { res.status(400).json({ message: error.message }); }
    },

    changePassword: async (req, res) => {
        try {
            const { DVVC_Ma, oldPassword, newPassword } = req.body;
            if (!DVVC_Ma || !oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
            }
            await DvvcProfileService.changePassword(DVVC_Ma, oldPassword, newPassword);
            res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    saveBankAccount: async (req, res) => {
        try {
            const result = await DvvcProfileService.saveBankAccount(req.params.id, req.body);
            res.json({ message: 'Lưu tài khoản ngân hàng thành công!', data: result });
        } catch (error) { res.status(400).json({ message: error.message }); }
    },

    deleteBankAccount: async (req, res) => {
        try {
            await DvvcProfileService.deleteBankAccount(req.params.id);
            res.json({ message: 'Đã xóa tài khoản ngân hàng!' });
        } catch (error) { res.status(400).json({ message: error.message }); }
    }
};

module.exports = DvvcProfileController;