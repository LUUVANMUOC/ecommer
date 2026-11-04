const QuanLyKhoAuthService = require('../../services/quanlykho/authService');

const QuanLyKhoAuthController = {
    login: async (req, res) => {
        try {
            const { kho_ma, password } = req.body;
            if (!kho_ma || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập Mã kho và Mật khẩu!' });
            }
            const result = await QuanLyKhoAuthService.loginKho(kho_ma, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
};
module.exports = QuanLyKhoAuthController;