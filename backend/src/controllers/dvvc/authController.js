// backend/src/controllers/dvvc/authController.js
const AuthDVVCService = require('../../services/dvvc/authService');

const AuthDVVCController = {
    // POST /api/dvvc/auth/login
    login: async (req, res) => {
        try {
            // Đón nhận cả trường hợp frontend gửi 'email' hoặc 'dvvc_email'
            const email = req.body.email || req.body.dvvc_email;
            const password = req.body.password;

            if (!email || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu!' });
            }

            const result = await AuthDVVCService.loginDVVC(email, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    },

    // POST /api/dvvc/auth/register
    register: async (req, res) => {
        try {
            // req.file được cung cấp bởi multer (xem ở file Route)
            const result = await AuthDVVCService.registerDVVC(req.body, req.file);
            res.status(201).json({ 
                message: 'Đăng ký Đơn Vị Vận Chuyển thành công!', 
                data: result 
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = AuthDVVCController;