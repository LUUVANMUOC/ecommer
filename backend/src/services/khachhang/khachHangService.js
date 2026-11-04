// backend/src/services/khachhang/khachHangService.js
const KhachHangModel = require('../../models/khachhang/khachHangModel');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // Thêm dòng này lên đầu file

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/avatars');

const KhachHangService = {
  getProfile: async (kh_ma) => {
    return await KhachHangModel.getProfile(kh_ma);
  },

  updateProfile: async (kh_ma, data, file) => {
    const existing = await KhachHangModel.getProfile(kh_ma);
    if (!existing) throw new Error('Không tìm thấy khách hàng!');

    // Xử lý Avatar
    let avatarPath = existing.kh_avatar;
    if (file) {
      avatarPath = `/uploads/avatars/${file.filename}`;
      // Xóa ảnh cũ nếu là ảnh local (không phải link ngoài)
      if (existing.kh_avatar && existing.kh_avatar.startsWith('/uploads/')) {
        const oldFileName = path.basename(existing.kh_avatar);
        const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const updateData = {
      kh_ten: data.kh_ten,
      kh_sdt: data.kh_sdt,
      kh_ngaysinh: data.kh_ngaysinh || null,
      kh_gioitinh: data.kh_gioitinh === 'true' || data.kh_gioitinh === true,
      kh_avatar: avatarPath
    };

    return await KhachHangModel.updateProfile(kh_ma, updateData);
  },

  saveBankAccount: async (kh_ma, data) => {
    if (!data.nganhang_ma || !data.ttnt_kh_sotaikhoan || !data.ttnt_kh_tennguoinhan) {
      throw new Error('Vui lòng nhập đầy đủ thông tin ngân hàng!');
    }
    return await KhachHangModel.saveBankAccount(kh_ma, data);
  },

  deleteBankAccount: async (kh_ma) => {
    return await KhachHangModel.deleteBankAccount(kh_ma);
  },
  changePassword: async (kh_ma, oldPassword, newPassword) => {
    const existing = await KhachHangModel.getProfile(kh_ma);
    if (!existing) throw new Error('Không tìm thấy khách hàng!');

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, existing.kh_hashpass);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng!');

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    return await KhachHangModel.updatePassword(kh_ma, hashedPassword);
  },
};

module.exports = KhachHangService;