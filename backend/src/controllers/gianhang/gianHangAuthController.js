// backend/src/controllers/gianhang/gianHangAuthController.js
const GianHangAuthService = require('../../services/gianhang/gianHangAuthService');
const GianHangModel = require('../../models/gianhang/gianHangModel');

const GianHangAuthController = {
    // 1. Đăng ký gian hàng
    register: async (req, res) => {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.gh_hinhanh = `/uploads/shops/${req.file.filename}`;
            }

            const result = await GianHangAuthService.registerShop(data);
            res.status(201).json({ message: 'Đăng ký gian hàng thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // 2. Đăng nhập
    login: async (req, res) => {
        try {
            const { gh_email, password } = req.body;
            if (!gh_email || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' });
            }

            const result = await GianHangAuthService.loginShop(gh_email, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    },

    // 3. Lấy thông tin Profile cửa hàng
    getProfile: async (req, res) => {
        try {
            const shop = await GianHangModel.getById(req.params.id);
            if (!shop) {
                return res.status(404).json({ message: 'Không tìm thấy gian hàng' });
            }
            res.status(200).json(shop);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. Cập nhật thông tin Profile cửa hàng
    updateProfile: async (req, res) => {
        try {
            const data = { ...req.body };
            
            if (req.file) {
                data.gh_hinhanh = `/uploads/shops/${req.file.filename}`;
            }

            const existing = await GianHangModel.getById(req.params.id);
            if (!existing) {
                return res.status(404).json({ message: 'Không tìm thấy gian hàng' });
            }

            const updateData = {
                gh_ten: data.gh_ten,
                gh_mota: data.gh_mota,
                gh_hinhanh: data.gh_hinhanh || existing.gh_hinhanh,
                dc_mota: data.dc_mota,
                xa_ma: data.xa_ma
            };

            const result = await GianHangModel.update(req.params.id, updateData);
            res.status(200).json({ message: 'Cập nhật thành công', data: result });
        } catch (error) {
            console.error("Lỗi cập nhật Profile Shop:", error);
            res.status(400).json({ message: error.message });
        }
    },

    // 5. ĐỔI MẬT KHẨU (BẠN ĐANG THIẾU HÀM NÀY)
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
    }
};

module.exports = GianHangAuthController;