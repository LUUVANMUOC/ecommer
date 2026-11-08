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
        // Kiểm tra các trường bắt buộc
        if (!data.NganHang_Ma || !data.TTNT_DVVC_SoTaiKhoan || !data.TTNT_DVVC_TenTaiKhoan) {
            throw new Error('Vui lòng nhập đầy đủ thông tin ngân hàng!');
        }
        
        // 🟢 Chuẩn bị dữ liệu để gửi xuống Model (bao gồm cả sepay_webhook_secret)
        const bankData = {
            NganHang_Ma: data.NganHang_Ma,
            TTNT_DVVC_SoTaiKhoan: data.TTNT_DVVC_SoTaiKhoan,
            TTNT_DVVC_TenTaiKhoan: data.TTNT_DVVC_TenTaiKhoan,
            sepay_webhook_secret: data.sepay_webhook_secret || null
        };

        return await DvvcProfileModel.saveBankAccount(dvvc_ma, bankData);
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