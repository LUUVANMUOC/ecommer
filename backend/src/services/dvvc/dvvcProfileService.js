const DvvcProfileModel = require('../../models/dvvc/dvvcProfileModel');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/dvvc');

const DvvcProfileService = {
    getProfile: async (dvvc_ma) => {
        return await DvvcProfileModel.getProfile(dvvc_ma);
    },

    updateProfile: async (dvvc_ma, data, file) => {
        const existing = await DvvcProfileModel.getProfile(dvvc_ma);
        if (!existing) throw new Error('Không tìm thấy ĐVVC!');

        let hinhAnhPath = existing.DVVC_HinhAnh;
        if (file) {
            hinhAnhPath = `/uploads/dvvc/${file.filename}`;
            // Xóa ảnh cũ nếu có
            if (existing.DVVC_HinhAnh && existing.DVVC_HinhAnh.startsWith('/uploads/')) {
                const oldFilePath = path.join(__dirname, '../../../public', existing.DVVC_HinhAnh);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
        }

        const updateData = {
            DVVC_Ten: data.DVVC_Ten,
            DVVC_MoTa: data.DVVC_MoTa,
            DVVC_HinhAnh: hinhAnhPath
        };

        return await DvvcProfileModel.updateProfile(dvvc_ma, updateData);
    },

    saveBankAccount: async (dvvc_ma, data) => {
        if (!data.NganHang_Ma || !data.TTNT_DVVC_SoTaiKhoan || !data.TTNT_DVVC_TenTaiKhoan) {
            throw new Error('Vui lòng nhập đầy đủ thông tin ngân hàng!');
        }
        return await DvvcProfileModel.saveBankAccount(dvvc_ma, data);
    },

    deleteBankAccount: async (dvvc_ma) => {
        return await DvvcProfileModel.deleteBankAccount(dvvc_ma);
    },

    changePassword: async (dvvc_ma, oldPassword, newPassword) => {
        const existing = await DvvcProfileModel.getProfile(dvvc_ma);
        if (!existing) throw new Error('Không tìm thấy ĐVVC!');

        const isMatch = await bcrypt.compare(oldPassword, existing.DVVC_HashPass);
        if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng!');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        return await DvvcProfileModel.updatePassword(dvvc_ma, hashedPassword);
    }
};

module.exports = DvvcProfileService;