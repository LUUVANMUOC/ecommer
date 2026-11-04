// backend/src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SanThuongMaiModel = require('../../models/san/sanThuongMaiModel');
require('dotenv').config();

const AuthService = {
    loginSan: async (email, password) => {
        console.log("--- BẮT ĐẦU ĐĂNG NHẬP ---");
        console.log("1. Email nhận được từ Frontend:", email);

        const san = await SanThuongMaiModel.findByEmail(email);
        if (!san) {
            console.log("=> LỖI: Không tìm thấy email này trong Database!");
            throw new Error('Email hoặc mật khẩu không đúng!');
        }
        
        // SỬA LỖI: Dùng chữ thường stmdt_ma và stmdt_hashpass để lấy đúng dữ liệu từ Postgres
        console.log("2. Đã tìm thấy user trong DB với Mã:", san.stmdt_ma);

        const isMatch = await bcrypt.compare(password, san.stmdt_hashpass);
        console.log("3. Kết quả so sánh mật khẩu (bcrypt):", isMatch);
        
        if (!isMatch) {
            console.log("=> LỖI: Mật khẩu không khớp!");
            throw new Error('Email hoặc mật khẩu không đúng!');
        }

        console.log("4. Đăng nhập thành công, đang tạo Token...");
        const payload = { 
            id: san.stmdt_ma, 
            role: 'admin' 
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Map ngược lại thành chữ HOA để Frontend (React) dễ dùng theo thói quen cũ
        return {
            token: token,
            user: { 
                STMDT_Ma: san.stmdt_ma, 
                STMDT_Ten: san.stmdt_ten, 
                STMDT_Email: san.stmdt_email,
                role: 'admin' 
            }
        };
    },
    registerSan: async (data) => {
        // LOG THÊM DÒNG NÀY ĐỂ KIỂM TRA FRONTEND GỬI LÊN ĐÚNG KEY CHƯA
        console.log("Dữ liệu đăng ký nhận được:", data);

        const existingSan = await SanThuongMaiModel.findByEmail(data.STMDT_Email);
        if (existingSan) {
            throw new Error('Email này đã được đăng ký!');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        let newMa = 'ST00000001'; 
        const latestMa = await SanThuongMaiModel.getLatestMa();
        
        // Bây giờ latestMa đã lấy đúng, logic này sẽ chạy chuẩn
        if (latestMa) {
            const currentNumber = parseInt(latestMa.substring(2), 10);
            const nextNumber = currentNumber + 1;
            newMa = 'ST' + nextNumber.toString().padStart(8, '0');
        }

        const newSanData = {
            STMDT_Ma: newMa,
            STMDT_Ten: data.STMDT_Ten,
            STMDT_Email: data.STMDT_Email,
            STMDT_SDT: data.STMDT_SDT,
            STMDT_HashPass: hashedPassword
        };

        return await SanThuongMaiModel.createSan(newSanData);
    },
};

module.exports = AuthService;