const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GianHangModel = require('../../models/gianhang/gianHangModel');
require('dotenv').config();

const GianHangAuthService = {
    registerShop: async (data) => {
        // 1. Kiểm tra email
        const existingShop = await GianHangModel.findByEmail(data.gh_email);
        if (existingShop) throw new Error('Email này đã được đăng ký!');

        // 2. Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        // 3. Sinh mã GH
        let newMa = 'GH01'; 
        const latestMa = await GianHangModel.getLatestMa();
        if (latestMa) {
            const currentNumber = parseInt(latestMa.substring(2), 10);
            newMa = 'GH' + (currentNumber + 1).toString().padStart(2, '0');
        }

        // 4. Chuẩn bị dữ liệu
        const shopData = {
            gh_ma: newMa,
            gh_ten: data.gh_ten,
            gh_mota: data.gh_mota,
            gh_hinhanh: data.gh_hinhanh, // Lấy từ upload file (nếu có)
            gh_email: data.gh_email,
            gh_hashpass: hashedPassword
        };

        const addressData = {
            DC_MoTa: data.dc_mota, // Nhận từ Frontend
            XA_Ma: data.xa_ma      // Nhận từ Frontend (Mã Xã đã chọn)
        };

        // 5. Lưu vào Database
        return await GianHangModel.createGianHangWithAddress(shopData, addressData);
    },

    loginShop: async (email, password) => {
        const shop = await GianHangModel.findByEmail(email);
        if (!shop) throw new Error('Email hoặc mật khẩu không đúng!');

        const isMatch = await bcrypt.compare(password, shop.gh_hashpass);
        if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng!');

        // Tạo Token
        const token = jwt.sign(
            { id: shop.gh_ma, role: 'shop' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        return {
            token,
            user: {
                GH_Ma: shop.gh_ma,
                GH_Ten: shop.gh_ten,
                GH_Email: shop.gh_email,
                role: 'shop'
            }
        };
    },
    // Thêm vào object GianHangAuthService
    changePassword: async (gh_ma, oldPassword, newPassword) => {
        // 1. Lấy thông tin shop
        const shop = await GianHangModel.getById(gh_ma);
        if (!shop) throw new Error('Không tìm thấy gian hàng!');

        // 2. Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, shop.gh_hashpass);
        if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng!');

        // 3. Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // 4. Cập nhật DB
        return await GianHangModel.updatePassword(gh_ma, newHash);
    }
};

module.exports = GianHangAuthService;