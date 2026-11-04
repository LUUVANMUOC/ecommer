// backend/src/services/sanThuongMaiService.js
const SanThuongMaiModel = require('../../models/san/sanThuongMaiModel');
const bcrypt = require('bcryptjs');

const SanThuongMaiService = {
    getProfile: async (STMDT_Ma) => {
        return await SanThuongMaiModel.getProfile(STMDT_Ma);
    },

    updateProfile: async (STMDT_Ma, data) => {
        return await SanThuongMaiModel.updateProfile(STMDT_Ma, data);
    },

    saveBankAccount: async (STMDT_Ma, data) => {
        if (!data.NganHang_Ma || !data.TTNT_STMDT_SoTaiKhoan || !data.TTNT_STMDT_TenTaiKhoan) {
            throw new Error('Vui lòng nhập đầy đủ thông tin ngân hàng!');
        }
        return await SanThuongMaiModel.saveBankAccount(STMDT_Ma, data);
    },

    deleteBankAccount: async (STMDT_Ma) => {
        return await SanThuongMaiModel.deleteBankAccount(STMDT_Ma);
    },

    changePassword: async (STMDT_Ma, oldPassword, newPassword) => {
        const existing = await SanThuongMaiModel.getProfile(STMDT_Ma);
        if (!existing) throw new Error('Không tìm thấy Sàn!');

        // Lưu ý: existing.STMDT_HashPass đã được alias ở Model
        const isMatch = await bcrypt.compare(oldPassword, existing.STMDT_HashPass);
        if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng!');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        return await SanThuongMaiModel.updatePassword(STMDT_Ma, hashedPassword);
    }
};

module.exports = SanThuongMaiService;