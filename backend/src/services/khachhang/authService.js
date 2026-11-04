// backend/src/services/khachhang/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const KhachHangModel = require('../../models/khachhang/khachHangModel');
require('dotenv').config();

const AuthKhachHangService = {
  login: async (email, password) => {
    const kh = await KhachHangModel.findByEmail(email);
    if (!kh) throw new Error('Email hoặc mật khẩu không đúng!');

    const isMatch = await bcrypt.compare(password, kh.kh_hashpass);
    if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng!');

    const payload = { id: kh.kh_ma, role: 'khachhang' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: { 
        kh_ma: kh.kh_ma, 
        kh_ten: kh.kh_ten, 
        kh_email: kh.kh_email,
        kh_sdt: kh.kh_sdt,
        kh_avatar: kh.kh_avatar,
        role: 'khachhang' 
      }
    };
  },

  register: async (data, file) => {
    const existing = await KhachHangModel.findByEmail(data.email);
    if (existing) throw new Error('Email này đã được sử dụng!');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    let newMa = 'KH001';
    const latest = await KhachHangModel.getLatestMa();
    if (latest) {
      const num = parseInt(latest.substring(2), 10) + 1;
      newMa = 'KH' + num.toString().padStart(3, '0');
    }

    // ✅ Xử lý ảnh Avatar: Nếu có file thì lấy đường dẫn, không thì lấy ảnh mặc định
    let avatarPath = file ? `/uploads/avatars/${file.filename}` : 'https://ui-avatars.com/api/?name=Khach+Hang&background=random';

    const newKH = {
      kh_ma: newMa,
      kh_ten: data.ten,
      kh_sdt: data.sdt,
      kh_ngaysinh: data.ngaysinh || null, 
      kh_gioitinh: data.gioitinh, 
      kh_email: data.email,
      kh_hashpass: hashedPassword,
      kh_avatar: avatarPath // Thêm avatar vào data
    };

    return await KhachHangModel.create(newKH);
  }
};

module.exports = AuthKhachHangService;