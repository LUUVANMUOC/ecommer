const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QuanLyKhoAuthModel = require('../../models/quanlykho/authModel');
require('dotenv').config();

const QuanLyKhoAuthService = {
    loginKho: async (kho_ma, password) => {
        const kho = await QuanLyKhoAuthModel.findByKhoMa(kho_ma);
        if (!kho) throw new Error('Mã kho hoặc mật khẩu không đúng!');
        if (!kho.kho_hashpass) throw new Error('Tài khoản kho chưa được thiết lập mật khẩu!');

        const isMatch = await bcrypt.compare(password, kho.kho_hashpass);
        if (!isMatch) throw new Error('Mã kho hoặc mật khẩu không đúng!');

        const payload = { 
            id: kho.kho_ma, 
            role: 'quanlykho', 
            dvvc_ma: kho.dvvc_ma,
            kho_ten: kho.kho_ten
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        return {
            token: token,
            user: { 
                kho_ma: kho.kho_ma, 
                kho_ten: kho.kho_ten, 
                kho_hinhanh: kho.kho_hinhanh,
                dvvc_ma: kho.dvvc_ma,
                dvvc_ten: kho.dvvc_ten,
                role: 'quanlykho' 
            }
        };
    }
};
module.exports = QuanLyKhoAuthService;