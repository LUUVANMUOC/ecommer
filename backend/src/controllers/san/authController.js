//Nhận Request, Trả Response
const AuthService = require('../../services/san/authService');

const AuthController = {
    // Xử lý API Đăng ký
    register: async (req, res) => {
        try {
            const result = await AuthService.registerSan(req.body);
            res.status(201).json({
                message: 'Đăng ký tài khoản Sàn thành công!',
                data: result
            });
        } catch (error) {
            // Bắt lỗi constraint từ PostgreSQL (ví dụ: sai định dạng email regex, SĐT quá dài)
            if (error.code === '23514') { 
                return res.status(400).json({ message: 'Dữ liệu không hợp lệ (Sai định dạng email hoặc số điện thoại).' });
            }
            res.status(400).json({ message: error.message });
        }
    },

    // Xử lý API Đăng nhập
    login: async (req, res) => {
        try {
            const { STMDT_Email, password } = req.body;
            
            if (!STMDT_Email || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' });
            }

            const result = await AuthService.loginSan(STMDT_Email, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
};

module.exports = AuthController;