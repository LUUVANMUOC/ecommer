// backend/src/services/dvvc/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DVVCModel = require('../../models/dvvc/dvvcModel');
require('dotenv').config();

const AuthDVVCService = {
    // ==========================================
    // 1. ĐĂNG NHẬP ĐVVC
    // ==========================================
    loginDVVC: async (email, password) => {
        console.log("--- BẮT ĐẦU ĐĂNG NHẬP ĐVVC ---");
        
        const dvvc = await DVVCModel.findByEmail(email);
        if (!dvvc) {
            throw new Error('Email hoặc mật khẩu không đúng!');
        }

        const isMatch = await bcrypt.compare(password, dvvc.dvvc_hashpass);
        if (!isMatch) {
            throw new Error('Email hoặc mật khẩu không đúng!');
        }

        const payload = { 
            id: dvvc.dvvc_ma, 
            role: 'dvvc' 
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        return {
            token: token,
            user: { 
                dvvc_ma: dvvc.dvvc_ma, 
                dvvc_ten: dvvc.dvvc_ten, 
                dvvc_email: dvvc.dvvc_email,
                dvvc_hinhanh: dvvc.dvvc_hinhanh,
                role: 'dvvc' 
            }
        };
    },

    // ==========================================
    // 2. ĐĂNG KÝ ĐVVC
    // ==========================================
    registerDVVC: async (data, file) => {
        // Kiểm tra email tồn tại
        const existingDVVC = await DVVCModel.findByEmail(data.dvvc_email);
        if (existingDVVC) {
            throw new Error('Email này đã được đăng ký!');
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        // Sinh mã ĐVVC (Giới hạn 10 ký tự: DVVC + 6 số)
        let newMa = 'DVVC000001'; 
        const latestMa = await DVVCModel.getLatestMa();
        
        if (latestMa) {
            const currentNumber = parseInt(latestMa.substring(4), 10);
            const nextNumber = currentNumber + 1;
            newMa = 'DVVC' + nextNumber.toString().padStart(6, '0');
        }

        // Đường dẫn ảnh
        const hinhanhPath = file ? `/uploads/dvvc/${file.filename}` : null;

        const newDVVCData = {
            dvvc_ma: newMa,
            dvvc_ten: data.dvvc_ten,
            dvvc_email: data.dvvc_email,
            dvvc_hinhanh: hinhanhPath,
            dvvc_hashpass: hashedPassword,
            ct_ma: 'CT03', // Đã cố định theo yêu cầu
            dvvc_mota: data.dvvc_mota || null
        };

        return await DVVCModel.createDVVC(newDVVCData);
    },
};

module.exports = AuthDVVCService;